// 持久化分支的纯逻辑(不依赖 React/页面环境)，供 decision-simple 复用并可单测。
// 有 GraphPersistenceAdapter → 走宿主存储；否则页面回退浏览器本地文件。
import type { TabSnapshot } from '@republicroad/jdm-editor';
import {
  GraphPersistenceError,
  type GraphPersistenceAdapter,
  type GraphRecord,
} from '@republicroad/jdm-appshell/src/shell/persistence';

export interface GraphLike {
  nodes: ReadonlyArray<{ id: string } & Record<string, unknown>>;
  edges?: ReadonlyArray<Record<string, unknown>>;
}

export type RemoteSaveResult = { kind: 'saved'; id: string; revision: string } | { kind: 'conflict' };

export interface SaveToRemoteOptions {
  graph: GraphLike;
  name: string;
  /** 缺省 = 新建(adapter.save 分配 id)；提供 = upsert */
  id?: string;
  /** upsert 乐观锁：提供时与 head 不匹配返回 {kind:'conflict'} */
  baseRevision?: string;
  extensions?: Record<string, unknown>;
  /** UI 会话现场（GraphRef.serialize() 快照）——随 content.session 兄弟存储，历史=完整现场 */
  session?: TabSnapshot;
}

/** 加载结果：graph 为图数据（供 DecisionGraph value），session 为 UI 现场（供 restore） */
export interface LoadFromRemoteResult {
  graph: GraphLike;
  session?: TabSnapshot;
}

/**
 * 保存到远程宿主存储。
 * - 无 id：新建，返回 {kind:'saved', id, revision}
 * - 有 id：upsert，baseRevision 乐观锁；冲突返回 {kind:'conflict'}(不抛出)
 */
export const saveToRemote = async (
  adapter: GraphPersistenceAdapter,
  opts: SaveToRemoteOptions,
): Promise<RemoteSaveResult> => {
  const record: GraphRecord = {
    id: opts.id ?? '',
    name: opts.name,
    revision: opts.baseRevision ?? '',
    content: opts.session ? { ...opts.graph, session: opts.session } : opts.graph,
    ...(opts.extensions ? { extensions: opts.extensions } : {}),
  };
  try {
    const { id, revision } = await adapter.save(record, opts.id ? { baseRevision: opts.baseRevision } : undefined);
    return { kind: 'saved', id, revision };
  } catch (e) {
    if (e instanceof GraphPersistenceError && e.code === 'CONFLICT') {
      return { kind: 'conflict' };
    }
    throw e;
  }
};

/** 从远程加载指定图(id 可选指定历史版本)；content 内嵌 session 解构剥离后分开返回 */
export const loadFromRemote = async (
  adapter: GraphPersistenceAdapter,
  id: string,
  opts?: { revision?: string },
): Promise<LoadFromRemoteResult | null> => {
  const record = await adapter.load(id, opts);
  if (!record) return null;
  const { session, ...graph } = (record.content ?? {}) as GraphLike & { session?: TabSnapshot };
  return { graph, ...(session ? { session } : {}) };
};

/** 列出指定图的历史版本；适配器未实现时返回空列表 */
export const listRemoteVersions = async (
  adapter: GraphPersistenceAdapter,
  id: string,
): Promise<Array<{ revision: string; updatedAt?: string }>> => {
  if (!adapter.listVersions) return [];
  const versions = await adapter.listVersions(id);
  return (versions ?? []).map(({ revision, updatedAt }) => ({ revision, updatedAt }));
};
