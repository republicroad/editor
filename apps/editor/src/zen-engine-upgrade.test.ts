// 第九十批：zen-engine 2.0.2 → 2.1.1 升级回归（上游 2026-09-29 发布）。
// 覆盖 2.1.0 三个行为面：
// ① date input（#529）——输入声明 format: date 后，日期比较免 d() 包装、
//    原文本保真（string()/输出不变）；
// ② 小数序列化（#530 zen-types）——非任意精度下保留小数（0.1+0.2 = 0.3 而非
//    0.30000000000000004）；
// ③ 存量图兼容——图级回归套件（graph-regression）另文件覆盖，此处不重复。
// 宿主引擎解析：apps/editor → zen-engine 2.1.1（catalog）；zen-udf 0.12.1 内置 2.1.0
// （仅差 type-hover 修复，执行语义同线）。
import { describe, expect, test } from 'bun:test';

import { DecisionRuntime, runWithExecContext } from '@republicroad/zen-udf';

const REGRESSION_TENANT = 'engine-upgrade';
const CTX = { userId: 'engine-upgrade', tenantId: REGRESSION_TENANT };

const buildGraph = (expressions: Array<{ key: string; value: string }>, withDateInput: boolean): string =>
  JSON.stringify({
    nodes: [
      {
        id: 'in',
        name: 'In',
        type: 'inputNode',
        content: {
          schema: withDateInput
            ? JSON.stringify({ type: 'object', properties: { start: { type: 'string', format: 'date' } } })
            : '',
        },
      },
      {
        id: 'e1',
        name: 'Expr',
        type: 'expressionNode',
        content: {
          expressions: expressions.map((expr, i) => ({ id: 'x' + i, ...expr })),
          passThrough: true,
          executionMode: 'single',
        },
      },
      { id: 'out', name: 'Out', type: 'outputNode', content: { schema: '' } },
    ],
    edges: [
      { id: 'ea', sourceId: 'in', targetId: 'e1' },
      { id: 'eb', sourceId: 'e1', targetId: 'out' },
    ],
  });

const evaluate = async (
  runtime: DecisionRuntime,
  key: string,
  graph: string,
  input: unknown,
): Promise<Record<string, unknown>> => {
  const { result } = await runWithExecContext(CTX, async () => {
    runtime.createDecisionWithCacheKey(key, graph);
    return {
      result: (await runtime.evaluate(key, input, { trace: false })) as {
        result?: Record<string, unknown>;
      },
    };
  });
  return result.result ?? {};
};

describe('zen-engine 2.1.x 升级回归（第九十批）', () => {
  test('date input（#529）：声明 format:date 后日期比较免 d() 包装', async () => {
    const runtime = new DecisionRuntime();
    const result = await evaluate(
      runtime,
      'upgrade:date-cmp',
      buildGraph([{ key: 'isAfter', value: 'start > d("2020-01-01")' }], true),
      { start: '2024-05-01' },
    );
    expect(result.isAfter).toBe(true);
  });

  test('date input：负例——2020 前的日期比较为 false', async () => {
    const runtime = new DecisionRuntime();
    const result = await evaluate(
      runtime,
      'upgrade:date-cmp-neg',
      buildGraph([{ key: 'isAfter', value: 'start > d("2020-01-01")' }], true),
      { start: '2019-12-31' },
    );
    expect(result.isAfter).toBe(false);
  });

  test('date input：调用方原文本保真（string()/输出行为不变）', async () => {
    const runtime = new DecisionRuntime();
    const result = await evaluate(
      runtime,
      'upgrade:date-text',
      buildGraph(
        [
          { key: 'text', value: 'string(start)' },
          { key: 'start', value: 'start' },
        ],
        true,
      ),
      { start: '2024-05-01' },
    );
    // 原文本保留：string() 与直通输出均为原始输入文本
    expect(result.start).toBe('2024-05-01');
    expect(result.text).toBe('2024-05-01');
  });

  test('小数序列化（#530）：0.1 + 0.2 保留干净小数', async () => {
    const runtime = new DecisionRuntime();
    const result = await evaluate(
      runtime,
      'upgrade:decimal',
      buildGraph(
        [
          { key: 'sum', value: '0.1 + 0.2' },
          { key: 'trailing', value: '1.10' },
          { key: 'mul', value: 'price * quantity' },
        ],
        false,
      ),
      { price: 19.99, quantity: 3 },
    );
    expect(result.sum).toBe(0.3);
    expect(result.trailing).toBe(1.1);
    expect(result.mul).toBe(59.97);
    // JSON 序列化层不再出现长尾精度噪声
    expect(JSON.stringify(result)).not.toContain('0.30000000000000004');
  });
});
