import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { join } from 'path';
import { debug } from 'console';
import type { ZenDecision } from '@gorules/zen-engine';
import { registerList, listLists, ZenRule } from 'zen-rule';
import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { serveStatic } from 'hono/bun';
import { customNodeFunctionSchema } from './custom-node-schema';

// Function to recursively list files in a directory
async function getFilesRecursively(dir: string, fileList: string[] = [], rootDir: string = dir): Promise<string[]> {
  const files = await readdir(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = join(dir, file.name);
    if (file.isDirectory()) {
      await getFilesRecursively(fullPath, fileList, rootDir);
    } else {
      // Add the file path relative to the root directory
      const relativePath = path.relative(rootDir, fullPath);
      fileList.push(relativePath);
    }
  }

  return fileList;
}

const staticConfig = {
  assets: 'public', // Directory to serve static files from
  prefix: '/', // URL prefix to access static files
};

// assets 默认是 public
const store = {
  input: { num: 19 },
  db: { users: [], hits: 0 },
  zenDecisions: {
    // ZenRule 封装了 customHandlerFunc(执行 customNode 的 UDF 表达式)与 graphAddons，
    // 决策对象缓存由 ZenRule 内部维护(createDecisionWithCacheKey / getDecisionCache)。
    engine: new ZenRule(),
  },
};

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

// 名单文件目录：apps/editor/lists/*.json({ name, description, items })，启动时注册进 zen-rule 名单存储。
const LISTS_DIR = path.resolve(import.meta.dir ?? process.cwd(), '../lists');

async function loadLists(): Promise<void> {
  try {
    const entries = await readdir(LISTS_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      const raw = await readFile(join(LISTS_DIR, entry.name), 'utf-8');
      const list = JSON.parse(raw) as { name?: string; description?: string; items?: string[] };
      if (!list.name || !Array.isArray(list.items)) continue;
      const items = list.items.map((item) => String(item));
      registerList({ name: list.name, description: list.description, items });
      console.log(`[lists] loaded ${list.name} (${items.length} items) from ${entry.name}`);
    }
  } catch (error) {
    console.warn(`[lists] failed to load list files from ${LISTS_DIR}:`, error);
  }
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
    size: z.number(),
  })
  .openapi('ListSummary');

const ListQuerySchema = z
  .object({
    q: z.string().optional(),
  })
  .openapi('ListQuery');

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

const app = new OpenAPIHono();

app.use(requestLogger);

// 统一错误日志：打印堆栈并返回结构化错误响应
app.onError((err, c) => {
  console.error(`[${new Date().toISOString()}] ERROR ${c.req.method} ${c.req.path}:`, err);
  if (err instanceof HTTPException) {
    if (err.res) return err.res;
    return c.json({ error: err.message }, err.status);
  }
  return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
});

// GET / 必须在 serveStatic 之前注册，否则会被静态文件中间件直接返回 index.html
app.get('/', async (c) => {
  if (!('files' in c.req.query())) {
    // 如果没有传 files 参数，则返回 index.html
    const url = path.resolve(staticConfig.assets, 'index.html');
    return new Response(Bun.file(url));
  }
  const directoryPath = join(process.cwd(), staticConfig.assets); // Adjust 'public' to your directory name
  try {
    const files = await getFilesRecursively(directoryPath);
    // Generate an HTML list
    let htmlResponse = '<h1>File List</h1><ul>';
    for (const file of files) {
      // Create a link to the actual static file path
      let fileUrl;
      if (file === 'index.html') {
        fileUrl = staticConfig.prefix; // Root URL for index.html
      } else {
        fileUrl = path.resolve(staticConfig.prefix, file);
      }
      htmlResponse += `<li><a href="${fileUrl}">${file}</a></li>`;
    }
    htmlResponse += '</ul>';

    return c.html(htmlResponse);
  } catch (error) {
    console.error(error);
    return c.text('Error reading directory', 500);
  }
});

app.use('/*', serveStatic({ root: './public' }));

app.get('/state', (c) => {
  console.log('store in /state:', store);
  return c.json(store);
});

// 自定义节点/自定义函数 JSON Schema 下发：GET /api/custom-nodes/schema(见 customNodesSchemaRoute)。
// 前端加载该 schema 后，可动态生成对应的自定义函数组件(createJdmNode)。
app.get('/input', (c) => {
  return c.json({ num: 19 });
});

// /api 以后使用 prefix 或者 plugin 来使用.
app.openapi(simulateRoute, async (c) => {
  // 动态加载规则文件(含自定义节点执行：ZenRule.graphAddons + customHandlerFunc)
  const body = c.req.valid('json');
  console.log('body:', body);
  const zr = store.zenDecisions.engine;
  const decision = zr.createDecision(body.content);
  try {
    // 考虑把 trace 做成一个url?后的参数
    const result = await decision.evaluate(body.context, { trace: true });
    return c.json(result);
  } catch (error) {
    console.error(error);
    return c.json({ error: String(error) }, 500);
  }
});

app.openapi(decisionRoute, async (c) => {
  // 线上规则推理时需要把通过content获得的decision规则对象缓存起来，
  // 避免每次都重新创建规则对象(缓存由 ZenRule 内部维护)
  const body = c.req.valid('json');
  console.log('body:', body);
  const zr = store.zenDecisions.engine;
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
      return c.json({ error: 'content is required when decision is not cached' }, 400);
    }
  } else {
    if (!body.content) {
      return c.json({ error: 'content is required' }, 400);
    }
    debug('创建临时decision对象(不缓存)');
    decision = zr.createDecision(body.content);
  }
  const result = await decision.evaluate(body.context, { trace: false });
  console.log('result:', result);
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
      userId: 'mock-user-1',
      expiresAt,
      createdAt: now,
      updatedAt: now,
    },
    user: {
      id: 'mock-user-1',
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

// 名单名称列表下发(查询名单节点下拉数据源)
app.openapi(listsRoute, (c) => {
  const q = c.req.query('q');
  const lists = listLists(q).map((list) => ({ name: list.name, size: list.items.length }));
  return c.json(lists);
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

const server = Bun.serve({
  port: 3000,
  fetch: app.fetch,
});
console.log(`Hono is running at http://${server.hostname}:${server.port}`);
console.log(`openapi UI is running at http://${server.hostname}:${server.port}/openapi`);
console.log(`openapi schema is running at http://${server.hostname}:${server.port}/openapi/json`);

// Admin API
const adminApp = new Hono();
adminApp.use(requestLogger);
adminApp.get('/', (c) => c.text('Admin API index'));
adminApp.get('/admin', (c) => c.text('Admin API'));

const adminServer = Bun.serve({
  port: 3001,
  fetch: adminApp.fetch,
});
console.log(`Admin API running at http://${adminServer.hostname}:${adminServer.port}`);
