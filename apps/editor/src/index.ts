import { mkdir, readdir, readFile, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { join } from 'path';
import { debug } from 'console';
import type { ZenDecision } from '@gorules/zen-engine';
import { deleteList, getList, registerList, listLists, runWithExecContext, type ExecContext, ZenRule } from 'zen-rule';
import { cors } from 'hono/cors';
import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { serveStatic } from 'hono/bun';
import { customNodeFunctionSchema } from './custom-node-schema';
import {
  deleteGraph,
  GRAPHS_DIR,
  GraphPersistenceError,
  listGraphVersions,
  listGraphs,
  loadGraph,
  saveGraph,
} from './graphs-store';

// 环境配置：PORT 监听端口、CORS_ORIGINS 跨域白名单(逗号分隔，未设则全放行)、LISTS_DIR 名单落盘目录
const PORT = Number(process.env.PORT ?? 3000);
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const LISTS_DIR = process.env.LISTS_DIR
  ? path.resolve(process.env.LISTS_DIR)
  : path.resolve(import.meta.dir, '../lists');
const SHARED_LISTS_DIR = join(LISTS_DIR, 'shared');
const USERS_LISTS_DIR = join(LISTS_DIR, 'users');
const MOCK_USER_ID = 'mock-user-1';

// 执行上下文解析：TRUST_PROXY_HEADERS=true 时信任网关头(X-User-Id/X-Request-Id)，
// 否则回退到 Mock 开发用户(与 /api/auth/get-session 一致)。UDF 经 getExecContext() 读取。
type HeaderGetter = (name: string) => string | undefined;
export const resolveExecContext = (getHeader: HeaderGetter): ExecContext => {
  const requestId = getHeader('x-request-id') ?? crypto.randomUUID();
  if (process.env.TRUST_PROXY_HEADERS === 'true') {
    const userId = getHeader('x-user-id');
    if (userId) {
      return { userId, requestId };
    }
  }
  return { userId: MOCK_USER_ID, requestId };
};

const staticConfig = {
  assets: 'public', // Directory to serve static files from
};

// ZenRule 封装了 customHandlerFunc(执行 customNode 的 UDF 表达式)与 graphAddons，
// 决策对象缓存由 ZenRule 内部维护(createDecisionWithCacheKey / getDecisionCache)。
const zenRuleEngine = new ZenRule();

// 请求日志中间件：打印每个请求的方法、路径、状态码与耗时
async function requestLogger(c: Context, next: Next) {
  const start = performance.now();
  const url = new URL(c.req.url);
  const path = url.pathname + url.search;
  console.log(`[${new Date().toISOString()}] => ${c.req.method} ${path}`);
  await next();
  console.log(
    `[${new Date().toISOString()}] <= ${c.req.method} ${path} ${c.res.status} ${(performance.now() - start).toFixed(1)}ms`,
  );
}

// 名单文件布局: $LISTS_DIR/shared/*.json(共享) + $LISTS_DIR/users/{owner}/*.json(私有)
// + 存量扁平 $LISTS_DIR/*.json(无 owner 字段, 视为共享, 只读兼容并在写回时原位更新)。
async function registerListFile(filePath: string): Promise<void> {
  try {
    const raw = await readFile(filePath, 'utf-8');
    const list = JSON.parse(raw) as { name?: string; description?: string; items?: string[]; owner?: string };
    if (!list.name || !Array.isArray(list.items)) return;
    const items = list.items.map((item) => String(item));
    registerList({ name: list.name, description: list.description, items, owner: list.owner });
  } catch {
    // 单个文件损坏不阻塞其余装载
  }
}

async function loadLists(): Promise<void> {
  const roots: string[][] = [];
  try {
    roots.push(
      (await readdir(LISTS_DIR, { withFileTypes: true }))
        .filter((e) => e.isFile() && e.name.endsWith('.json'))
        .map((e) => join(LISTS_DIR, e.name)),
    );
    roots.push(
      (await readdir(SHARED_LISTS_DIR, { withFileTypes: true }))
        .filter((e) => e.isFile() && e.name.endsWith('.json'))
        .map((e) => join(SHARED_LISTS_DIR, e.name)),
    );
    const userDirs = (await readdir(USERS_LISTS_DIR, { withFileTypes: true })).filter((e) => e.isDirectory());
    for (const dir of userDirs) {
      const userPath = join(USERS_LISTS_DIR, dir.name);
      roots.push(
        (await readdir(userPath, { withFileTypes: true }))
          .filter((e) => e.isFile() && e.name.endsWith('.json'))
          .map((e) => join(userPath, e.name)),
      );
    }
  } catch {
    // 目录缺失时按空处理
  }
  for (const files of roots) {
    for (const filePath of files) {
      await registerListFile(filePath);
    }
  }
}

// 文件名安全化：保留 unicode 字母/数字/下划线/连字符，其余折叠为下划线
const sanitizeListFilename = (name: string): string =>
  name.replace(/[^\p{L}\p{N}_-]+/gu, '_').replace(/^[-_]+|[-_]+$/g, '') || 'unnamed';

/** 按内容中的 name 字段定位名单文件; 扫描顺序 自有目录 → shared → 存量扁平根 */
async function findListFile(name: string, owner?: string): Promise<string | null> {
  const roots = [...(owner ? [join(USERS_LISTS_DIR, sanitizeListFilename(owner))] : []), SHARED_LISTS_DIR, LISTS_DIR];
  for (const root of roots) {
    let entries;
    try {
      entries = await readdir(root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      const filePath = join(root, entry.name);
      try {
        const raw = await readFile(filePath, 'utf-8');
        const parsed = JSON.parse(raw) as { name?: string };
        if (parsed.name === name) {
          return filePath;
        }
      } catch {
        // 单个文件损坏不阻塞查找
      }
    }
  }
  return null;
}

interface PersistableList {
  name: string;
  description?: string;
  items: string[];
  owner?: string;
}

async function writeListFile(list: PersistableList): Promise<void> {
  const existing = await findListFile(list.name, list.owner);
  const canonicalDir = list.owner ? join(USERS_LISTS_DIR, sanitizeListFilename(list.owner)) : SHARED_LISTS_DIR;
  const filePath = existing ?? join(canonicalDir, `${sanitizeListFilename(list.name)}.json`);
  if (!existing) {
    await mkdir(canonicalDir, { recursive: true });
  }
  await writeFile(filePath, `${JSON.stringify({ ...list }, null, 2)}\n`, 'utf-8');
  console.log(`[lists] persisted ${list.name} -> ${path.relative(LISTS_DIR, filePath)}`);
}

// --- OpenAPI schemas ---
const DecisionContentSchema = z
  .object({
    contentType: z.string().optional(),
    nodes: z.array(z.record(z.string(), z.unknown())),
    edges: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .openapi('DecisionContent');

const ContextSchema = z.record(z.string(), z.unknown()).openapi('Context');

const SimulateRequestSchema = z
  .object({
    content: DecisionContentSchema,
    context: ContextSchema,
  })
  .openapi('SimulateRequest');

const SimulateResponseSchema = z
  .object({
    result: z.any(),
    trace: z.any().optional(),
    performance: z.string().optional(),
  })
  .openapi('SimulateResponse');

const DecisionRequestSchema = z
  .object({
    decisionId: z.string().optional(),
    content: DecisionContentSchema.optional(),
    context: ContextSchema,
  })
  .openapi('DecisionRequest');

const simulateRoute = createRoute({
  method: 'post',
  path: '/api/simulate',
  request: {
    body: {
      content: {
        'application/json': { schema: SimulateRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: SimulateResponseSchema },
      },
      description: '决策模拟执行结果(含 trace)',
    },
    500: {
      content: {
        'application/json': { schema: z.any() },
      },
      description: '执行失败',
    },
  },
});

const decisionRoute = createRoute({
  method: 'post',
  path: '/api/decision',
  request: {
    body: {
      content: {
        'application/json': { schema: DecisionRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: z.any() },
      },
      description: '决策推理执行结果',
    },
    400: {
      content: {
        'application/json': { schema: z.any() },
      },
      description: '请求参数缺失',
    },
    500: {
      content: {
        'application/json': { schema: z.any() },
      },
      description: '执行失败',
    },
  },
});

const SessionSchema = z
  .object({
    id: z.string(),
    token: z.string(),
    userId: z.string(),
    expiresAt: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi('Session');

const UserSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    emailVerified: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    image: z.string().nullable(),
  })
  .openapi('User');

const GetSessionResponseSchema = z
  .object({
    session: SessionSchema,
    user: UserSchema,
  })
  .openapi('GetSessionResponse');

const getSessionRoute = createRoute({
  method: 'get',
  path: '/api/auth/get-session',
  responses: {
    200: {
      content: {
        'application/json': { schema: GetSessionResponseSchema },
      },
      description: '当前会话(Mock 开发用户)',
    },
  },
});

// 自定义节点/自定义函数 JSON Schema(namespace/tools 格式，与 brdeapi.geetest.com/zen_custom_node_function.json 对齐)。
// 内容本身是 JSON Schema，因此外层用宽松的 record 数组描述。
const CustomNodeFunctionSchema = z.array(z.record(z.string(), z.unknown())).openapi('CustomNodeFunctionSchema');

const customNodesSchemaRoute = createRoute({
  method: 'get',
  path: '/api/custom-nodes/schema',
  responses: {
    200: {
      content: {
        'application/json': { schema: CustomNodeFunctionSchema },
      },
      description: '自定义节点与自定义函数 JSON Schema(namespace/tools 格式)',
    },
  },
});

const ListSummarySchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    size: z.number(),
  })
  .openapi('ListSummary');

const ListQuerySchema = z
  .object({
    q: z.string().optional(),
  })
  .openapi('ListQuery');

const NamedListSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
    items: z.array(z.string()),
  })
  .openapi('NamedList');

const ListUpdateSchema = z
  .object({
    description: z.string().optional(),
    items: z.array(z.string()),
  })
  .openapi('ListUpdate');

const listsRoute = createRoute({
  method: 'get',
  path: '/api/lists',
  request: {
    query: ListQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: z.array(ListSummarySchema) },
      },
      description: '服务端名单名称列表(支持 q 关键词搜索，供查询名单节点下拉动态加载)',
    },
  },
});

const listDetailRoute = createRoute({
  method: 'get',
  path: '/api/lists/{name}',
  request: {
    params: z.object({ name: z.string() }),
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: NamedListSchema },
      },
      description: '名单详情(含全部条目)',
    },
    404: {
      content: {
        'application/json': { schema: z.object({ error: z.string() }) },
      },
      description: '名单不存在',
    },
  },
});

const listCreateRoute = createRoute({
  method: 'post',
  path: '/api/lists',
  request: {
    body: {
      content: {
        'application/json': { schema: NamedListSchema },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: NamedListSchema },
      },
      description: '已保存(upsert：同名覆盖)并回写 JSON 文件',
    },
    400: {
      content: {
        'application/json': { schema: z.object({ error: z.string() }) },
      },
      description: '请求体不合法',
    },
    500: {
      content: {
        'application/json': { schema: z.object({ error: z.string() }) },
      },
      description: 'JSON 文件回写失败',
    },
  },
});

const listUpdateRoute = createRoute({
  method: 'put',
  path: '/api/lists/{name}',
  request: {
    params: z.object({ name: z.string() }),
    body: {
      content: {
        'application/json': { schema: ListUpdateSchema },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: NamedListSchema },
      },
      description: '已更新并回写 JSON 文件',
    },
    404: {
      content: {
        'application/json': { schema: z.object({ error: z.string() }) },
      },
      description: '名单不存在',
    },
    500: {
      content: {
        'application/json': { schema: z.object({ error: z.string() }) },
      },
      description: 'JSON 文件回写失败',
    },
  },
});

const listDeleteRoute = createRoute({
  method: 'delete',
  path: '/api/lists/{name}',
  request: {
    params: z.object({ name: z.string() }),
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: z.object({ deleted: z.boolean() }) },
      },
      description: '已删除(内存存储 + 对应 JSON 文件)',
    },
    404: {
      content: {
        'application/json': { schema: z.object({ error: z.string() }) },
      },
      description: '名单不存在',
    },
  },
});

// --- Graph persistence routes (reference implementation of GraphPersistenceAdapter) ---

const GraphMetaSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    owner: z.string().optional(),
    tags: z.array(z.string()).optional(),
    extensions: z.record(z.string(), z.unknown()).optional(),
    revision: z.string(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .openapi('GraphMeta');

const GraphContentSchema = z
  .object({
    contentType: z.string().optional(),
    nodes: z.array(z.record(z.string(), z.unknown())),
    edges: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .openapi('GraphContent');

const GraphSaveSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    extensions: z.record(z.string(), z.unknown()).optional(),
    content: GraphContentSchema,
    baseRevision: z.string().optional(),
  })
  .openapi('GraphSave');

const GraphVersionSchema = z
  .object({
    revision: z.string(),
    updatedAt: z.string(),
  })
  .openapi('GraphVersion');

const graphsRoute = createRoute({
  method: 'get',
  path: '/api/graphs',
  request: {
    query: ListQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: z.array(GraphMetaSchema) },
      },
      description: '当前用户可见图的 head 元数据列表(不含 content)',
    },
  },
});

const graphDetailRoute = createRoute({
  method: 'get',
  path: '/api/graphs/{id}',
  request: {
    params: z.object({ id: z.string() }),
    query: z.object({ revision: z.string().optional() }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: GraphMetaSchema.extend({ content: z.record(z.string(), z.unknown()) }),
        },
      },
      description: '图明细(head 或指定历史版本)',
    },
    404: {
      content: {
        'application/json': { schema: z.object({ error: z.string() }) },
      },
      description: '图不存在或不可见',
    },
  },
});

const graphCreateRoute = createRoute({
  method: 'post',
  path: '/api/graphs',
  request: {
    body: {
      content: {
        'application/json': { schema: GraphSaveSchema },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: z.object({ id: z.string(), revision: z.string() }) },
      },
      description: '已创建(服务端注入 owner，revision=v1)',
    },
    400: {
      content: {
        'application/json': { schema: z.object({ error: z.string() }) },
      },
      description: '请求体不合法',
    },
    500: {
      content: {
        'application/json': { schema: z.object({ error: z.string() }) },
      },
      description: 'JSON 文件写入失败',
    },
  },
});

const graphUpdateRoute = createRoute({
  method: 'put',
  path: '/api/graphs/{id}',
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': { schema: GraphSaveSchema },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: z.object({ id: z.string(), revision: z.string() }) },
      },
      description: '已更新(保留原 owner；baseRevision 乐观锁)',
    },
    404: {
      content: {
        'application/json': { schema: z.object({ error: z.string() }) },
      },
      description: '图不存在或不可见',
    },
    409: {
      content: {
        'application/json': { schema: z.object({ error: z.object({ code: z.string() }) }) },
      },
      description: 'baseRevision 与 head 不匹配(乐观锁冲突)',
    },
  },
});

const graphDeleteRoute = createRoute({
  method: 'delete',
  path: '/api/graphs/{id}',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: z.object({ deleted: z.boolean() }) },
      },
      description: '已删除(含全部历史版本文件)',
    },
    404: {
      content: {
        'application/json': { schema: z.object({ error: z.string() }) },
      },
      description: '图不存在或不可见',
    },
  },
});

const graphVersionsRoute = createRoute({
  method: 'get',
  path: '/api/graphs/{id}/versions',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: z.array(GraphVersionSchema) },
      },
      description: '历史版本列表(不含 head)',
    },
    404: {
      content: {
        'application/json': { schema: z.object({ error: z.string() }) },
      },
      description: '图不存在或不可见',
    },
  },
});

const app = new OpenAPIHono();

app.use(requestLogger);

// 跨域：未设 CORS_ORIGINS 时全放行(本地/镜像开发)；设置后仅白名单内 origin 反射放行(带凭证)
if (CORS_ORIGINS.length > 0) {
  app.use(
    '*',
    cors({
      origin: (origin) => (CORS_ORIGINS.includes(origin) ? origin : undefined),
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
    }),
  );
} else {
  app.use('*', cors());
}

// 统一错误日志：打印堆栈并返回结构化错误响应
app.onError((err, c) => {
  console.error(`[${new Date().toISOString()}] ERROR ${c.req.method} ${c.req.path}:`, err);
  if (err instanceof HTTPException) {
    if (err.res) return err.res;
    return c.json({ error: err.message }, err.status);
  }
  return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
});

// GET / 返回编辑器入口(须在 serveStatic 之前注册，否则会被静态文件中间件直接返回 index.html)
app.get('/', () => {
  const url = path.resolve(staticConfig.assets, 'index.html');
  return new Response(Bun.file(url));
});

app.use('/*', serveStatic({ root: './public' }));
// /api 以后使用 prefix 或者 plugin 来使用.
app.openapi(simulateRoute, async (c) => {
  // 动态加载规则文件(含自定义节点执行：ZenRule.graphAddons + customHandlerFunc)；执行失败由 onError 统一返回 {error} 500
  const body = c.req.valid('json');
  const decision = zenRuleEngine.createDecision(body.content);
  const result = await runWithExecContext(
    resolveExecContext((name) => c.req.header(name)),
    () => decision.evaluate(body.context, { trace: true }),
  );
  return c.json(result);
});

app.openapi(decisionRoute, async (c) => {
  // 线上规则推理时需要把通过content获得的decision规则对象缓存起来，
  // 避免每次都重新创建规则对象(缓存由 ZenRule 内部维护)
  const body = c.req.valid('json');
  const zr = zenRuleEngine;
  const decisionId = body.decisionId;
  let decision: ZenDecision;
  if (decisionId) {
    const cached = zr.getDecisionCache(decisionId);
    if (cached && !body.content) {
      debug(`使用缓存的decision对象: ${decisionId}`);
      decision = cached;
    } else if (cached && body.content) {
      debug(`更新decision对象: ${decisionId}`);
      decision = zr.updateDecisionWithCacheKey(decisionId, body.content);
    } else if (!cached && body.content) {
      debug(`创建新的decision对象并缓存: ${decisionId}`);
      decision = zr.createDecisionWithCacheKey(decisionId, body.content);
    } else {
      throw new HTTPException(400, { message: 'content is required when decision is not cached' });
    }
  } else {
    if (!body.content) {
      throw new HTTPException(400, { message: 'content is required' });
    }
    debug('创建临时decision对象(不缓存)');
    decision = zr.createDecision(body.content);
  }
  const result = await runWithExecContext(
    resolveExecContext((name) => c.req.header(name)),
    () => decision.evaluate(body.context, { trace: false }),
  );
  return c.json(result);
});

// Mock 开发用户会话，供前端 authClient.getSession() 消费 user.id
app.openapi(getSessionRoute, (c) => {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return c.json({
    session: {
      id: 'mock-session-1',
      token: 'mock-token-1',
      userId: MOCK_USER_ID,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    },
    user: {
      id: MOCK_USER_ID,
      name: 'Mock User',
      email: 'mock@example.com',
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
      image: null,
    },
  });
});

// 自定义节点/自定义函数 JSON Schema 下发
app.openapi(customNodesSchemaRoute, (c) => {
  return c.json(customNodeFunctionSchema);
});

// 名单名称列表下发(查询名单节点下拉数据源)；按会话用户过滤: 自有私有 + 共享
app.openapi(listsRoute, (c) => {
  const q = c.req.query('q');
  const execCtx = resolveExecContext((name) => c.req.header(name));
  const lists = listLists(q, execCtx.userId).map((list) => ({
    name: list.name,
    description: list.description,
    size: list.items.length,
  }));
  return c.json(lists);
});

// 名单详情；他人私有一律 404(防名字探测)
app.openapi(listDetailRoute, (c) => {
  const { name } = c.req.valid('param');
  const execCtx = resolveExecContext((name) => c.req.header(name));
  const list = getList(name, execCtx.userId);
  if (!list) {
    throw new HTTPException(404, { message: `list '${name}' not found` });
  }
  return c.json({ name: list.name, description: list.description, items: list.items, owner: list.owner }, 200);
});

// 名单保存(upsert)：owner 由服务端注入为会话用户(新建默认私有)，客户端传入的归属字段被 schema 剥离
app.openapi(listCreateRoute, async (c) => {
  const body = c.req.valid('json');
  const execCtx = resolveExecContext((name) => c.req.header(name));
  const list: PersistableList = {
    name: body.name.trim(),
    description: body.description?.trim() || undefined,
    items: body.items.map((item) => String(item)),
    owner: execCtx.userId,
  };
  if (!list.name) {
    throw new HTTPException(400, { message: 'name is required' });
  }
  registerList(list);
  try {
    await writeListFile(list);
  } catch (error) {
    throw new HTTPException(500, { message: `failed to persist list file: ${String(error)}` });
  }
  return c.json(list, 200);
});

// 名单更新(仅已存在的名单；name 不可变；保留原 owner，共享名单编辑后仍共享)
app.openapi(listUpdateRoute, async (c) => {
  const { name } = c.req.valid('param');
  const body = c.req.valid('json');
  const execCtx = resolveExecContext((name) => c.req.header(name));
  const existing = getList(name, execCtx.userId);
  if (!existing) {
    throw new HTTPException(404, { message: `list '${name}' not found` });
  }
  const list: PersistableList = {
    name: existing.name,
    description: body.description?.trim() || undefined,
    items: body.items.map((item) => String(item)),
    owner: existing.owner,
  };
  registerList(list);
  try {
    await writeListFile(list);
  } catch (error) {
    throw new HTTPException(500, { message: `failed to persist list file: ${String(error)}` });
  }
  return c.json(list, 200);
});

// 名单删除：内存存储 + 对应 JSON 文件一并移除；他人私有一律 404
app.openapi(listDeleteRoute, async (c) => {
  const { name } = c.req.valid('param');
  const execCtx = resolveExecContext((name) => c.req.header(name));
  const list = getList(name, execCtx.userId);
  if (!list || !deleteList(name, execCtx.userId)) {
    throw new HTTPException(404, { message: `list '${name}' not found` });
  }
  const filePath = await findListFile(name, list.owner);
  if (filePath) {
    try {
      await unlink(filePath);
      console.log(`[lists] removed file ${path.relative(LISTS_DIR, filePath)} for ${name}`);
    } catch (error) {
      console.warn(`[lists] failed to remove file for ${name}:`, error);
    }
  }
  return c.json({ deleted: true }, 200);
});

// OpenAPI schema at /openapi/json, Scalar API Reference at /openapi
app.doc('/openapi/json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'JDM Editor API',
  },
});
app.get('/openapi', Scalar({ url: '/openapi/json' }));

await loadLists();

// --- Graph persistence handlers (reference implementation) ---

// 图列表：返回当前用户可见的 head 元数据(自有 + 共享)，不含 content；按 updatedAt 降序
app.openapi(graphsRoute, async (c) => {
  const q = c.req.query('q');
  const execCtx = resolveExecContext((name) => c.req.header(name));
  const graphs = await listGraphs(execCtx.userId, { q });
  return c.json(graphs);
});

// 图明细；他人私有一律 404(防探测)；?revision=vN 加载历史版本
app.openapi(graphDetailRoute, async (c) => {
  const { id } = c.req.valid('param');
  const { revision } = c.req.valid('query');
  const execCtx = resolveExecContext((name) => c.req.header(name));
  const graph = await loadGraph(id, execCtx.userId, { revision });
  if (!graph) {
    throw new HTTPException(404, { message: `graph '${id}' not found or not visible` });
  }
  const { content, ...meta } = graph;
  return c.json({ ...meta, content: content as Record<string, unknown> }, 200);
});

// 图新建：owner 由服务端注入(默认私有)，revision 初始为 v1
app.openapi(graphCreateRoute, async (c) => {
  const body = c.req.valid('json');
  const execCtx = resolveExecContext((name) => c.req.header(name));
  const id = crypto.randomUUID();
  try {
    const result = await saveGraph(
      {
        name: body.name.trim(),
        description: body.description?.trim() || undefined,
        tags: body.tags,
        extensions: body.extensions,
        content: body.content,
      },
      execCtx.userId,
      { newId: id },
    );
    console.log(`[graphs] created ${result.id} -> ${result.revision}`);
    return c.json(result, 200);
  } catch (error) {
    throw new HTTPException(500, { message: `failed to persist graph file: ${String(error)}` });
  }
});

// 图更新：保留原 owner；baseRevision 乐观锁，不匹配抛 409 CONFLICT；他人私有一律 404
app.openapi(graphUpdateRoute, async (c) => {
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  const execCtx = resolveExecContext((name) => c.req.header(name));
  try {
    const result = await saveGraph(
      {
        id,
        name: body.name.trim(),
        description: body.description?.trim() || undefined,
        tags: body.tags,
        extensions: body.extensions,
        content: body.content,
      },
      execCtx.userId,
      { baseRevision: body.baseRevision },
    );
    console.log(`[graphs] updated ${result.id} -> ${result.revision}`);
    return c.json(result, 200);
  } catch (error) {
    if (error instanceof GraphPersistenceError) {
      if (error.code === 'CONFLICT') {
        throw new HTTPException(409, { message: `conflict: ${error.message}` });
      }
      throw new HTTPException(404, { message: `graph '${id}' not found or not visible` });
    }
    throw new HTTPException(500, { message: `failed to persist graph file: ${String(error)}` });
  }
});

// 图删除：删除 head 与全部历史版本文件；不可见或不存在返回 false → 404
app.openapi(graphDeleteRoute, async (c) => {
  const { id } = c.req.valid('param');
  const execCtx = resolveExecContext((name) => c.req.header(name));
  const deleted = await deleteGraph(id, execCtx.userId);
  if (!deleted) {
    throw new HTTPException(404, { message: `graph '${id}' not found or not visible` });
  }
  return c.json({ deleted: true }, 200);
});

// 历史版本列表(不含 head)
app.openapi(graphVersionsRoute, async (c) => {
  const { id } = c.req.valid('param');
  const execCtx = resolveExecContext((name) => c.req.header(name));
  const head = await loadGraph(id, execCtx.userId);
  if (!head) {
    throw new HTTPException(404, { message: `graph '${id}' not found or not visible` });
  }
  const versions = await listGraphVersions(id, execCtx.userId);
  return c.json(versions, 200);
});

export { app, LISTS_DIR, GRAPHS_DIR };

// 仅直接运行时启动 HTTP 服务；被测试/其他模块导入时只暴露 app
if (import.meta.main) {
  const server = Bun.serve({
    port: PORT,
    fetch: app.fetch,
  });
  console.log(`Hono is running at http://${server.hostname}:${server.port}`);
  console.log(`openapi UI is running at http://${server.hostname}:${server.port}/openapi`);
  console.log(`openapi schema is running at http://${server.hostname}:${server.port}/openapi/json`);
}
