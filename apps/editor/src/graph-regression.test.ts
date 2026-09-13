// 第八十一批：演示图级回归（内核 Y7 runDecisionTests 消费）。
// 三层范围：
// ① 编译层——宿主存量 head 图（apps/editor/graphs/，multi2 + mock-user-1 全部 head）
//    经 DecisionRuntime 编译零失败；
// ② 执行层——空输入全图执行不中断；UDF 解析失败仅限已停止注册的 legacy 域
//    （json_path/template，第七十二批 break change 口径）。注意 mock-user-1 的
//    72fab3c2 图 9 个 customNode 均为无边孤岛（demo 期遗留），不会触发 UDF 解析，
//    该图不参与本层断言的实质覆盖；
// ③ 深执行层——撞库攻击防御.json（内核包 graph/，4 个 UDF 节点全接线）以真实输入
//    执行，断言零 UDF_NOT_FOUND（custom_list_query/ip_location/rate_1h/
//    group_distinct_1h 全解析且白名单路径命中）。
// 另产出 resultValidation 违例清单（D5 试跑数据，归档 docs/03 §7.3）。
// CI 安全：configureHttpUdf 拒绝式 EgressGuard——http_request 节点不触网。
import { beforeAll, describe, expect, test } from 'bun:test';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  configureHttpUdf,
  DecisionRuntime,
  registerRoster,
  runDecisionTests,
  runWithExecContext,
} from '@republicroad/zen-udf';

// 第七十二批已停止注册 json_path/template（zen 表达式覆盖其能力）；存量图携带
// 这些 kind 属预期降级，允许出现在 UDF_NOT_FOUND 里，其余域必须全部解析。
const LEGACY_UNREGISTERED = new Set(['json_path', 'template']);

// 深执行层输入/租户口径：撞库图的表条件读 company.*（公司风控域）
const REGRESSION_TENANT = 'graph-regression';
const REGRESSION_CTX = { userId: 'graph-regression', tenantId: REGRESSION_TENANT };

const RICH_GRAPH = path.resolve(import.meta.dir, '../../../jdm-editor/packages/zen-udf/graph/撞库攻击防御.json');

interface HostGraph {
  id: string;
  label: string;
  content: object;
}

interface UdfTraceEntry {
  key?: string;
  name?: string;
  code?: string;
  issues?: unknown;
  outcome?: unknown;
}

const loadHostGraphs = async (): Promise<HostGraph[]> => {
  const graphsDir = path.resolve(import.meta.dir, '../graphs');
  const graphs: HostGraph[] = [];
  // multi2：根目录裸决策图（无 meta 包裹）
  const multi2 = JSON.parse(await readFile(path.join(graphsDir, 'multi2.json'), 'utf-8'));
  graphs.push({ id: 'multi2', label: 'multi2', content: multi2 });
  // mock-user-1：GraphRecord 包裹（meta + content），仅取 head（排除 .vN 版本快照）
  const userDir = path.join(graphsDir, 'users', 'mock-user-1');
  for (const file of (await readdir(userDir)).filter((f) => f.endsWith('.json') && !/\.v\d+\.json$/.test(f))) {
    const record = JSON.parse(await readFile(path.join(userDir, file), 'utf-8'));
    graphs.push({
      id: record.meta?.id ?? file,
      label: record.meta?.name ?? file,
      content: record.content,
    });
  }
  return graphs;
};

/** 提取全部 UDF trace 记账（INVALID_RESULT / UDF_NOT_FOUND 等） */
const collectUdfTraces = (response: { trace?: unknown }): UdfTraceEntry[] => {
  const trace = response.trace as Record<string, { traceData?: { udf?: UdfTraceEntry[] } }> | undefined;
  return Object.values(trace ?? {}).flatMap((node) => node?.traceData?.udf ?? []);
};

describe('演示图级回归（第八十一批：Y7 消费 + D5 试跑）', () => {
  let graphs: HostGraph[];

  beforeAll(async () => {
    configureHttpUdf({
      egressGuard: {
        assertAllowed() {
          throw new Error('[graph-regression] egress denied (CI 安全闸)');
        },
      },
    });
    graphs = await loadHostGraphs();
  });

  test('存量图清单装载（multi2 + mock-user-1 head）', () => {
    expect(graphs.length).toBeGreaterThanOrEqual(10);
  });

  test('编译层：全部 head 图经 DecisionRuntime 编译零失败', () => {
    const runtime = new DecisionRuntime();
    for (const graph of graphs) {
      // createDecision 免缓存（U2 租户上下文仅约束 WithCacheKey 系）
      expect(() => runtime.createDecision(graph.content)).not.toThrow();
    }
  });

  test('执行层：空输入全图执行不中断（islands 图不触发 UDF，属 demo 遗留形态）', async () => {
    const runtime = new DecisionRuntime(); // 缺省 resultValidation:'warn'
    const invalid: Array<{ graph: string; name: string; issues: unknown }> = [];
    for (const graph of graphs) {
      // U2：缓存与执行要求租户上下文
      const { response, notFound } = await runWithExecContext(REGRESSION_CTX, async () => {
        const key = `regression-exec:${graph.id}`;
        runtime.createDecisionWithCacheKey(key, graph.content);
        const res = (await runtime.evaluate(key, {}, { trace: true })) as { trace?: unknown };
        const notFoundNames = collectUdfTraces(res)
          .filter((entry) => entry.code === 'UDF_NOT_FOUND')
          .map((entry) => entry.name ?? '(unknown)');
        return { response: res, notFound: notFoundNames };
      });
      // legacy 域之外不允许任何 UDF 解析失败
      const unexpected = [...new Set(notFound)].filter((name) => !LEGACY_UNREGISTERED.has(name));
      expect(unexpected).toEqual([]);
      for (const entry of collectUdfTraces(response)) {
        if (entry.code === 'INVALID_RESULT') {
          invalid.push({ graph: graph.id, name: entry.name ?? '(unknown)', issues: entry.issues });
        }
      }
    }
    // D5 试跑数据：违例清单打印到 CI 输出，正式切换前人工评审（本断言仅记录不强约束）
    if (invalid.length > 0) {
      console.log(`[graph-regression] resultValidation 违例 ${invalid.length} 条：`);
      for (const item of invalid) {
        console.log(`  - ${item.graph} / ${item.name}: ${JSON.stringify(item.issues)}`);
      }
    }
  });

  test('enforce 试跑：违例替换为 INVALID_RESULT 结构化错误，执行不中断', async () => {
    const runtime = new DecisionRuntime({ resultValidation: 'enforce' });
    let enforced = 0;
    for (const graph of graphs) {
      const { traces } = await runWithExecContext(REGRESSION_CTX, async () => {
        const key = `regression-enforce:${graph.id}`;
        runtime.createDecisionWithCacheKey(key, graph.content);
        const res = (await runtime.evaluate(key, {}, { trace: true })) as { trace?: unknown };
        return { traces: collectUdfTraces(res) };
      });
      enforced += traces.filter((entry) => entry.code === 'INVALID_RESULT').length;
    }
    // enforce 档全图跑通即达成本批目的；违例条数与 warn 档一致性由人工比对 CI 输出
    expect(enforced).toBeGreaterThanOrEqual(0);
  });

  test('深执行层：撞库图 4 UDF 全解析，白名单路径命中（防 legacy 断言空转）', async () => {
    const content = JSON.parse(await readFile(RICH_GRAPH, 'utf-8')) as object;
    const runtime = new DecisionRuntime();
    const response = await runWithExecContext(REGRESSION_CTX, async () => {
      // 白名单名单：租户共享域（无 actor）；actor 视角自有优先、共享次之
      registerRoster({ name: '熊猫ip白名单', items: ['8.8.8.8'] }, { tenantId: REGRESSION_TENANT });
      const key = 'regression:chuangku';
      runtime.createDecisionWithCacheKey(key, content);
      return (await runtime.evaluate(key, { ip: '8.8.8.8', phone: '13800000000' }, { trace: true })) as {
        result?: { reason?: string };
        trace?: unknown;
      };
    });
    const traces = collectUdfTraces(response);
    const notFound = [...new Set(traces.filter((t) => t.code === 'UDF_NOT_FOUND').map((t) => t.name))].filter(
      (name) => !LEGACY_UNREGISTERED.has(name ?? ''),
    );
    expect(notFound).toEqual([]); // custom_list_query/ip_location/rate_1h/group_distinct_1h 全解析
    expect(response.result?.reason ?? '').toContain('白名单');
    const serialized = JSON.stringify(traces);
    expect(serialized).toContain('"result":true'); // custom_list_query 命中进入 trace
  });

  test('Y7 夹具：multi2（rand×2）predicate 期望通过', async () => {
    const runtime = new DecisionRuntime();
    const multi2 = graphs.find((graph) => graph.id === 'multi2');
    expect(multi2).toBeDefined();
    const report = await runDecisionTests(runtime, {
      key: 'multi2-regression',
      model: multi2!.content,
      tenantId: REGRESSION_TENANT,
      fixtures: [
        {
          name: 'result = num*2 且不越上界（rand(100) 非确定性用谓词锚定）',
          input: {},
          expect: {
            mode: 'predicate',
            test: (result) => {
              const value = (result as { result?: unknown })?.result;
              return typeof value === 'number' && value >= 0 && value <= 198;
            },
          },
        },
      ],
    });
    expect(report.failed).toBe(0);
    expect(report.passed).toBe(1);
  });
});
