/**
 * 表达式槽位补全端点（第九十一批）：zen-engine 2.1 slots API（#527）的宿主直通层。
 *
 * 两种模式（引擎响应原样透传，零语义加工——引擎是单一事实来源）：
 * - batch：slotBatch 直通（无图上下文，表格列/独立表达式场景）；
 * - workspace：Workspace.setDocument(图) + slot/completions（节点输出作操作数、
 *   决策表枚举入补全项；Workspace 按 content 哈希 LRU 缓存，图内容不变即复用）。
 */
import { createHash } from 'node:crypto';

import { HTTPException } from 'hono/http-exception';
import { createRoute, z } from '@hono/zod-openapi';
import { Workspace, slotBatch, type PolicyCursorTarget } from '@gorules/zen-engine';

const WORKSPACE_CACHE_MAX = 8;

const slotRequestSchema = z.object({
  id: z.string(),
  text: z.string(),
  pos: z.number().int().min(0),
  unary: z.boolean(),
  role: z.enum(['condition', 'value', 'path', 'unary']),
  // PolicyVariableType 深联合由引擎校验——透传层不做结构性复制（避免二次漂移）
  scope: z.unknown(),
  expected: z.unknown().nullable().optional(),
  labels: z.record(z.string(), z.record(z.string(), z.string())).nullable().optional(),
});

const slotBodySchema = z.object({
  mode: z.enum(['batch', 'workspace']),
  requests: z.array(slotRequestSchema).optional(),
  content: z.unknown().optional(),
  cursor: z
    .object({
      blockId: z.string().optional(),
      pos: z.number().int().min(0).optional(),
      target: z.unknown().optional(),
    })
    .optional(),
  text: z.string().optional(),
  op: z.enum(['slot', 'completions']).optional(),
});

export type SlotBody = z.infer<typeof slotBodySchema>;

export const expressionSlotRoute = createRoute({
  method: 'post',
  path: '/api/expression/slot',
  description:
    '表达式槽位补全（zen-engine 2.1 slots API 直通）。' +
    'batch = slotBatch 直通（无图上下文）；workspace = 图上下文 Workspace（内容哈希 LRU 缓存）。' +
    '响应为引擎原样结果（PolicySlotResponse / completions / batch 数组）。' +
    '错误（400 请求不满足模式要求或图文档无效 / 422 该游标无槽位）经全局 onError 统一渲染。',
  request: {
    body: { content: { 'application/json': { schema: slotBodySchema } }, required: true },
  },
  responses: {
    200: {
      description: '引擎原样结果',
      content: { 'application/json': { schema: z.any() } },
    },
  },
});

// Workspace LRU（按内容哈希键控；命中即触底提升重序）
const workspaceCache = new Map<string, Workspace>();

const contentHash = (content: unknown): string => createHash('sha1').update(JSON.stringify(content)).digest('hex');

export const getOrCreateWorkspace = (content: unknown): { ws: Workspace; docPath: string } => {
  const key = contentHash(content);
  const hit = workspaceCache.get(key);
  if (hit) {
    workspaceCache.delete(key);
    workspaceCache.set(key, hit);
    return { ws: hit, docPath: key };
  }
  const ws = new Workspace();
  try {
    // 文档路径 = 内容哈希：cursor.policyPath 必须与之严格一致（引擎按路径定位文档）
    ws.setDocument(key, content);
  } catch (error) {
    throw new HTTPException(400, {
      message: `invalid graph document: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
  workspaceCache.set(key, ws);
  if (workspaceCache.size > WORKSPACE_CACHE_MAX) {
    const oldest = workspaceCache.keys().next().value;
    if (oldest !== undefined) workspaceCache.delete(oldest);
  }
  return { ws, docPath: key };
};

export const workspaceCacheSize = (): number => workspaceCache.size;

export const handleExpressionSlot = (body: SlotBody): unknown => {
  if (body.mode === 'batch') {
    if (!body.requests?.length) {
      throw new HTTPException(400, { message: 'requests is required in batch mode' });
    }
    return slotBatch(body.requests as never);
  }

  if (body.content === undefined) {
    throw new HTTPException(400, { message: 'content is required in workspace mode' });
  }
  const { ws, docPath } = getOrCreateWorkspace(body.content);
  const cursor = {
    policyPath: docPath,
    blockId: body.cursor?.blockId ?? '',
    pos: body.cursor?.pos ?? 0,
    target: (body.cursor?.target ?? { kind: 'expression', id: '' }) as PolicyCursorTarget,
  };

  if ((body.op ?? 'slot') === 'completions') {
    return { completions: ws.completions(cursor) };
  }
  const result = ws.slot(cursor, body.text ?? '');
  if (result === null) {
    throw new HTTPException(422, { message: 'slot unavailable for the given cursor/text' });
  }
  return result;
};
