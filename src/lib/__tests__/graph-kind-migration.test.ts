import { describe, expect, test } from 'bun:test';
import path from 'path';
import { migrateLegacyNodeKinds } from '../graph-kind-migration.ts';
import type { DecisionNode } from '../../helpers/graph.ts';

const node = (id: string, kind: string | undefined, type = 'customNode'): DecisionNode =>
  ({
    id,
    name: id,
    type,
    position: { x: 0, y: 0 },
    ...(kind !== undefined ? { content: { kind, config: { expressions: [] } } } : {}),
  }) as DecisionNode;

describe('migrateLegacyNodeKinds（第六十七批 D1）', () => {
  test('contrib.<fn> → 裸函数名（非 http 例外）', () => {
    const { nodes, changes } = migrateLegacyNodeKinds([node('n1', 'contrib.custom_list_query')]);
    expect((nodes[0].content as { kind: string }).kind).toBe('custom_list_query');
    expect(changes).toEqual([{ id: 'n1', from: 'contrib.custom_list_query', to: 'custom_list_query' }]);
  });

  test('contrib.http_request 不迁移（http 专属节点替代，占位卡）', () => {
    const { nodes, changes } = migrateLegacyNodeKinds([node('n1', 'contrib.http_request')]);
    expect((nodes[0].content as { kind: string }).kind).toBe('contrib.http_request');
    expect(changes).toHaveLength(0);
  });

  test('容器 kind 精确映射：roster.roster / risk.query_list → roster', () => {
    const { nodes, changes } = migrateLegacyNodeKinds([node('a', 'roster.roster'), node('b', 'risk.query_list')]);
    expect((nodes[0].content as { kind: string }).kind).toBe('roster');
    expect((nodes[1].content as { kind: string }).kind).toBe('roster');
    expect(changes.map((c) => c.id)).toEqual(['a', 'b']);
  });

  test('非 contrib 的旧容器名（legacy_http/http）与现代节点均不迁移', () => {
    const input = [node('a', 'legacy_http'), node('b', 'http'), node('c', 'roster'), node('d', undefined, 'inputNode')];
    const { nodes, changes } = migrateLegacyNodeKinds(input);
    expect(changes).toHaveLength(0);
    expect(nodes[0]).toBe(input[0]); // 引用不变——零改写路径不产新对象
    expect(nodes[2].content).toBe(input[2].content);
  });

  test('幂等：迁移结果再次执行零变化', () => {
    const first = migrateLegacyNodeKinds([
      node('a', 'contrib.query_roster'),
      node('b', 'roster.roster'),
      node('c', 'contrib.http_request'),
    ]);
    const second = migrateLegacyNodeKinds(first.nodes);
    expect(second.changes).toHaveLength(0);
  });

  test('真实样本回归：mock-user-1 v9（contrib.http_request 保留、文件可解析）', async () => {
    const file = path.resolve(
      import.meta.dir,
      '../../../apps/editor/graphs/users/mock-user-1/c0d277e3-a5a7-45dd-b0a5-bc661e66d50a.v9.json',
    );
    const graph = (await Bun.file(file).json()) as { content: { nodes: DecisionNode[] } };
    const { nodes, changes } = migrateLegacyNodeKinds(graph.content.nodes);
    expect(changes).toHaveLength(0); // 该样本唯一旧 kind 为 contrib.http_request（例外保留）
    const preserved = nodes.flatMap((n) => {
      const kind = (n.content as { kind?: string } | undefined)?.kind;
      return kind ? [kind] : [];
    });
    expect(preserved).toContain('contrib.http_request');
  });
});
