// 表达式槽位补全端点测试（第九十一批）：直接单测 handleExpressionSlot（纯逻辑，
// 不经 app.request——避免与本套件的 env/tempdir 契约争抢 index.js 的首次导入时序）。
// 覆盖：batch 直通 / workspace 图上下文 / Workspace LRU 缓存命中 / 参数与图文档校验。
// 路由注册本身由 typecheck:apps（app.openapi 编译）与 build 把关。
import { describe, expect, test } from 'bun:test';

import { handleExpressionSlot, workspaceCacheSize, type SlotBody } from './expression-slot.js';

const probeGraph = {
  nodes: [
    {
      id: 'in',
      name: 'In',
      type: 'inputNode',
      content: {
        schema: JSON.stringify({
          type: 'object',
          properties: { price: { type: 'number', title: 'Price' } },
        }),
      },
    },
    {
      id: 'e1',
      name: 'Expr',
      type: 'expressionNode',
      content: { expressions: [{ id: 'x1', key: 'result', value: '' }], passThrough: false, executionMode: 'single' },
    },
    { id: 'out', name: 'Out', type: 'outputNode', content: { schema: '' } },
  ],
  edges: [
    { id: 'ea', sourceId: 'in', targetId: 'e1' },
    { id: 'eb', sourceId: 'e1', targetId: 'out' },
  ],
};

describe('handleExpressionSlot（第九十一批）', () => {
  test('batch 模式：slotBatch 直通（logical 槽给 and/or 操作符）', () => {
    const body: SlotBody = {
      mode: 'batch',
      requests: [
        {
          id: 'a',
          text: 'start > d("2020-01-01") and ',
          pos: 27,
          unary: false,
          role: 'condition',
          scope: { type: 'bool' },
        },
      ],
    };
    const result = handleExpressionSlot(body) as Array<{
      id: string;
      result: { slot: { state: string; operators: string[] } };
    }>;
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
    expect(result[0].result.slot.state).toBe('logical');
    expect(result[0].result.slot.operators).toContain('and');
  });

  test('batch 模式：缺 requests 抛 400', () => {
    expect(() => handleExpressionSlot({ mode: 'batch' })).toThrow('requests is required in batch mode');
  });

  test('workspace 模式：图上下文槽位返回（start 槽 + autoOpen）', () => {
    const before = workspaceCacheSize();
    const result = handleExpressionSlot({
      mode: 'workspace',
      content: probeGraph,
      cursor: { blockId: 'e1', pos: 0, target: { kind: 'expression', id: 'e1' } },
      text: '',
      op: 'slot',
    }) as { role: string; slot: { state: string; autoOpen: boolean } };
    expect(result.role).toBe('value');
    expect(result.slot.state).toBe('start');
    expect(result.slot.autoOpen).toBe(true);
    expect(workspaceCacheSize()).toBe(before + 1);
  });

  test('workspace 模式：同 content 命中缓存（不新建 Workspace）', () => {
    const before = workspaceCacheSize();
    handleExpressionSlot({
      mode: 'workspace',
      content: probeGraph,
      cursor: { blockId: 'e1', pos: 0 },
    });
    expect(workspaceCacheSize()).toBe(before);
  });

  test('workspace 模式：completions 操作返回 items 数组', () => {
    const result = handleExpressionSlot({
      mode: 'workspace',
      content: probeGraph,
      cursor: { blockId: 'e1', pos: 0, target: { kind: 'expression', id: 'e1' } },
      op: 'completions',
    }) as { completions: Array<{ label: string }> };
    expect(Array.isArray(result.completions)).toBe(true);
  });

  test('workspace 模式：无效图文档抛 400（引擎校验透传）', () => {
    expect(() =>
      handleExpressionSlot({
        mode: 'workspace',
        content: { nodes: [{ id: 'bad', name: 'Bad', type: 'decisionTableNode', content: {} }], edges: [] },
        cursor: { blockId: 'bad', pos: 0 },
      }),
    ).toThrow('invalid graph document');
  });

  test('workspace 模式：缺 content 抛 400', () => {
    expect(() => handleExpressionSlot({ mode: 'workspace', cursor: { blockId: 'x', pos: 0 } })).toThrow(
      'content is required in workspace mode',
    );
  });
});
