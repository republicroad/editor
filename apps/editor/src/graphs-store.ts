// 图持久化存储层参考实现。
// 布局镜像名单：$GRAPHS_DIR/shared/{id}.json(共享) + $GRAPHS_DIR/users/{owner}/{id}.json(私有)。
// head 文件 {id}.json 含 {meta, content}；历史版本写入 {id}.v{N}.json(revision = v{N})。
// 语义：owner 由调用方(服务端会话)注入；他人私有一律视为无权限(404 防探测)；
//       save 可选 baseRevision 乐观锁，不匹配 head 抛 CONFLICT。
import { mkdir, readFile, readdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { join } from 'path';

export type GraphPersistenceErrorCode = 'NOT_FOUND' | 'CONFLICT' | 'FORBIDDEN';

export class GraphPersistenceError extends Error {
  constructor(
    public code: GraphPersistenceErrorCode,
    message?: string,
  ) {
    super(message);
    this.name = 'GraphPersistenceError';
  }
}

export interface StoredGraphMeta {
  id: string;
  name: string;
  description?: string;
  owner?: string;
  tags?: string[];
  extensions?: Record<string, unknown>;
  revision: string;
  /** 自动保存条目（保留策略：保留全部 manual + 最近 AUTO_VERSIONS_KEEP 条 auto） */
  auto?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoredGraph {
  id: string;
  name: string;
  description?: string;
  owner?: string;
  tags?: string[];
  extensions?: Record<string, unknown>;
  revision: string;
  auto?: boolean;
  createdAt: string;
  updatedAt: string;
  content: unknown;
}

interface HeadFile {
  meta: StoredGraphMeta;
  content: unknown;
}

let GRAPHS_DIR = process.env.GRAPHS_DIR
  ? path.resolve(process.env.GRAPHS_DIR)
  : path.resolve(import.meta.dir, '../graphs');
const SHARED_GRAPHS_DIR = join(GRAPHS_DIR, 'shared');
const USERS_GRAPHS_DIR = join(GRAPHS_DIR, 'users');

export const configureGraphsDir = (dir: string): void => {
  GRAPHS_DIR = path.resolve(dir);
};

// id 安全化：仅保留 unicode 字母/数字/下划线/连字符，防止路径穿越
const sanitizeGraphId = (id: string): string => id.replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 100);

/** 定位某图的 head 文件；扫描顺序 自有目录 → shared；他人私有不暴露 */
async function findHeadFile(id: string, owner?: string): Promise<string | null> {
  const roots = [...(owner ? [join(USERS_GRAPHS_DIR, sanitizeGraphId(owner))] : []), SHARED_GRAPHS_DIR];
  for (const root of roots) {
    const filePath = join(root, `${sanitizeGraphId(id)}.json`);
    try {
      await readFile(filePath, 'utf-8');
      return filePath;
    } catch {
      // 继续扫描下一作用域
    }
  }
  return null;
}

/** 读取 head 文件(未做权限过滤，调用方负责解析 owner 判断可见性) */
async function readHeadFile(filePath: string): Promise<StoredGraph | null> {
  try {
    const raw = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as HeadFile;
    if (!parsed.meta || !parsed.meta.id) return null;
    return { ...parsed.meta, content: parsed.content };
  } catch {
    return null;
  }
}

/** 列出某目录下所有 .json 文件的 head(不含历史版本文件) */
async function readDirHeads(dir: string): Promise<StoredGraph[]> {
  const graphs: StoredGraph[] = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return graphs;
  }
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const graph = await readHeadFile(join(dir, entry.name));
    if (graph) graphs.push(graph);
  }
  return graphs;
}

/** 列出当前用户可见的图(自有 + 共享)，按 updatedAt 降序 */
export async function listGraphs(actor: string | undefined, query?: { q?: string }): Promise<StoredGraphMeta[]> {
  const q = query?.q?.trim().toLowerCase();
  const results: StoredGraph[] = [];
  if (actor) {
    const userPath = join(USERS_GRAPHS_DIR, sanitizeGraphId(actor));
    results.push(...(await readDirHeads(userPath)));
  }
  results.push(...(await readDirHeads(SHARED_GRAPHS_DIR)));
  const dedup = new Map<string, StoredGraph>();
  for (const graph of results) {
    if (!dedup.has(graph.id)) dedup.set(graph.id, graph);
  }
  const list = [...dedup.values()].filter((g) => (q ? g.name.toLowerCase().includes(q) : true));
  list.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
  return list.map(
    (g): StoredGraphMeta => ({
      id: g.id,
      name: g.name,
      description: g.description,
      owner: g.owner,
      tags: g.tags,
      extensions: g.extensions,
      revision: g.revision,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    }),
  );
}

/**
 * 加载指定图。
 * @param revision 指定历史版本(如 v3)；省略加载 head。
 * @returns null = 不存在或当前用户无权限(404 语义)
 */
export async function loadGraph(
  id: string,
  actor: string | undefined,
  opts?: { revision?: string },
): Promise<StoredGraph | null> {
  const headFile = await findHeadFile(id, actor);
  if (!headFile) return null;

  const head = await readHeadFile(headFile);
  if (!head) return null;
  if (head.owner && head.owner !== actor) return null;

  if (opts?.revision && opts.revision !== head.revision) {
    const versionPath = join(path.dirname(headFile), `${sanitizeGraphId(id)}.${opts.revision}.json`);
    return readHeadFile(versionPath);
  }
  return head;
}

/**
 * 保存(upsert)。
 * @param opts.newId 新建时由服务端分配的 id
 * @param opts.baseRevision 乐观锁：提供时校验 head 是否匹配，不匹配抛 CONFLICT
 * @returns { id, revision }
 */
export async function saveGraph(
  input: {
    id?: string;
    name: string;
    description?: string;
    tags?: string[];
    extensions?: Record<string, unknown>;
    content: unknown;
    auto?: boolean;
  },
  owner: string | undefined,
  opts?: { newId?: string; baseRevision?: string },
): Promise<{ id: string; revision: string }> {
  const id = opts?.newId ?? input.id;
  if (!id) {
    throw new GraphPersistenceError('NOT_FOUND', 'graph id is required on update');
  }

  let existing: StoredGraph | null = null;
  if (input.id) {
    const headFile = await findHeadFile(input.id, owner);
    if (headFile) {
      existing = await readHeadFile(headFile);
      if (existing?.owner && existing.owner !== owner) {
        throw new GraphPersistenceError('NOT_FOUND', 'graph not found or not visible');
      }
    } else {
      throw new GraphPersistenceError('NOT_FOUND', 'graph not found or not visible');
    }
  }

  // 乐观锁：baseRevision 提供且与 head 不匹配 → CONFLICT
  if (opts?.baseRevision) {
    const headRevision = existing?.revision;
    if (opts.baseRevision !== headRevision) {
      throw new GraphPersistenceError(
        'CONFLICT',
        `base revision ${opts.baseRevision} does not match head ${headRevision ?? '(none)'}`,
      );
    }
  }

  const now = new Date().toISOString();
  const isNew = !existing;
  const prevRevision = existing?.revision;
  const nextRevision = isNew ? 'v1' : bumpRevision(prevRevision!);

  const meta: StoredGraphMeta = {
    id,
    name: input.name,
    description: input.description,
    owner: existing?.owner ?? (isNew ? owner : undefined),
    tags: input.tags,
    extensions: input.extensions,
    revision: nextRevision,
    auto: input.auto,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const targetRoot = meta.owner ? join(USERS_GRAPHS_DIR, sanitizeGraphId(meta.owner)) : SHARED_GRAPHS_DIR;
  await mkdir(targetRoot, { recursive: true });
  const headFilePath = join(targetRoot, `${sanitizeGraphId(id)}.json`);
  const headFileBody: HeadFile = { meta, content: input.content };
  await writeFile(headFilePath, `${JSON.stringify(headFileBody, null, 2)}\n`, 'utf-8');

  // 写入新版本存档文件(旧 head 存为 v{N} 历史)
  if (!isNew && prevRevision && existing) {
    const versionPath = join(targetRoot, `${sanitizeGraphId(id)}.${prevRevision}.json`);
    const archivedMeta: StoredGraphMeta = {
      id: existing.id,
      name: existing.name,
      description: existing.description,
      owner: existing.owner,
      tags: existing.tags,
      extensions: existing.extensions,
      revision: prevRevision,
      auto: existing.auto,
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt,
    };
    await writeFile(
      versionPath,
      `${JSON.stringify({ meta: archivedMeta, content: existing.content }, null, 2)}\n`,
      'utf-8',
    );
  }

  // 自动版本保留策略：全部 manual + 最近 AUTO_VERSIONS_KEEP 条 auto，超限删最旧
  await pruneAutoVersions(targetRoot, sanitizeGraphId(id));

  return { id, revision: nextRevision };
}

/** 自动版本保留条数（manual 版本不受治理） */
export const AUTO_VERSIONS_KEEP = 20;

/** 超出保留策略的最旧 auto 版本文件删除 */
async function pruneAutoVersions(dir: string, safeId: string): Promise<void> {
  let entries: import('fs').Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  const autos: Array<{ n: number; file: string }> = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const match = new RegExp(`^${safeId}\\.(v\\d+)\\.json$`).exec(entry.name);
    if (!match) continue;
    const graph = await readHeadFile(join(dir, entry.name));
    if (!graph?.auto) continue;
    autos.push({ n: Number(match[1]), file: join(dir, entry.name) });
  }
  autos.sort((a, b) => a.n - b.n);
  const excess = autos.length - AUTO_VERSIONS_KEEP;
  for (let i = 0; i < excess; i++) {
    try {
      await unlink(autos[i].file);
      console.log(`[graphs] pruned auto version ${path.basename(autos[i].file)}`);
    } catch (error) {
      console.warn(`[graphs] auto-version prune failed:`, error);
    }
  }
}

/** revision 单调递增：v1 → v2 → v3 */
function bumpRevision(revision: string): string {
  const match = /^v(\d+)$/.exec(revision);
  return match ? `v${Number(match[1]) + 1}` : 'v2';
}

/** 删除指定图(含历史版本文件)；返回 false = 不存在或不可见 */
export async function deleteGraph(id: string, owner: string | undefined): Promise<boolean> {
  const headFile = await findHeadFile(id, owner);
  if (!headFile) return false;
  const head = await readHeadFile(headFile);
  if (!head) return false;
  if (head.owner && head.owner !== owner) return false;

  const dir = path.dirname(headFile);
  let entries: import('fs').Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    entries = [];
  }
  const safeId = sanitizeGraphId(id);
  let removed = false;
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    // 删除 head 与全部历史版本文件(id.json / id.v{N}.json)
    if (entry.name === `${safeId}.json` || new RegExp(`^${safeId}\\.v\\d+\\.json$`).test(entry.name)) {
      try {
        await unlink(join(dir, entry.name));
        removed = true;
      } catch (error) {
        console.warn(`[graphs] failed to remove file ${entry.name}:`, error);
      }
    }
  }
  return removed;
}

/** 列出指定图的历史版本(不含 head)；返回空数组 = 图不可见或不存在 */
export async function listGraphVersions(
  id: string,
  owner: string | undefined,
): Promise<Array<{ revision: string; updatedAt: string; auto?: boolean }>> {
  const headFile = await findHeadFile(id, owner);
  if (!headFile) return [];
  const head = await readHeadFile(headFile);
  if (!head) return [];
  if (head.owner && head.owner !== owner) return [];

  const dir = path.dirname(headFile);
  let entries: import('fs').Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const safeId = sanitizeGraphId(id);
  const versions: Array<{ revision: string; updatedAt: string; auto?: boolean }> = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const match = new RegExp(`^${safeId}\\.(v\\d+)\\.json$`).exec(entry.name);
    if (!match) continue;
    const graph = await readHeadFile(join(dir, entry.name));
    versions.push({ revision: match[1], updatedAt: graph?.updatedAt ?? '', auto: graph?.auto });
  }
  versions.sort((a, b) => a.revision.localeCompare(b.revision));
  return versions;
}

export { GRAPHS_DIR };
