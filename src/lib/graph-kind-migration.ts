// 旧平台（2026-09-01 重设计前）节点 kind 迁移——历史 stub 域旧图的唯一恢复路径
// （docs/13 §8.3 已验证映射表）。纯函数、幂等：迁移后再次执行零变化。
import type { DecisionNode } from '../helpers/graph.ts';

/** 旧容器 kind → 现行 kind（精确映射） */
const LEGACY_KIND_MAP: Readonly<Record<string, string>> = {
  'roster.roster': 'roster',
  'risk.query_list': 'roster',
};

const CONTRIB_PREFIX = 'contrib.';

/** contrib.* 不迁移的例外：http 已由 http_request 专属节点取代，customNode 壳无法
 *  转型为专属节点——保持原 kind 落「配置不符合规范」占位卡（数据无损，docs/13 §8.3） */
const CONTRIB_SKIP = new Set(['http_request']);

export interface LegacyKindChange {
  id: string;
  from: string;
  to: string;
}

export interface LegacyKindMigrationResult {
  nodes: DecisionNode[];
  changes: LegacyKindChange[];
}

/** 迁移节点上的旧平台 kind（存放位置 node.content.kind）。仅改写 kind 字符串，
 *  其余内容（expressions/config）原样保留。 */
export const migrateLegacyNodeKinds = (nodes: DecisionNode[]): LegacyKindMigrationResult => {
  const changes: LegacyKindChange[] = [];
  const out = nodes.map((node) => {
    const content = node.content as { kind?: unknown } | undefined;
    const kind = typeof content?.kind === 'string' ? content.kind : undefined;
    if (!kind) return node;

    let to: string | undefined;
    if (LEGACY_KIND_MAP[kind]) {
      to = LEGACY_KIND_MAP[kind];
    } else if (kind.startsWith(CONTRIB_PREFIX)) {
      const bare = kind.slice(CONTRIB_PREFIX.length);
      if (bare && !CONTRIB_SKIP.has(bare)) to = bare;
    }
    if (!to || to === kind) return node;

    changes.push({ id: node.id, from: kind, to });
    return { ...node, content: { ...(content as Record<string, unknown>), kind: to } };
  });
  return { nodes: out, changes };
};
