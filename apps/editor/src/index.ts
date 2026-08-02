import { readdir } from 'fs/promises';
import path from 'path';
import { join } from 'path';
import { debug } from "console";
import { ZenEngine, type ZenDecision } from '@gorules/zen-engine';
import { Hono } from 'hono';
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { serveStatic } from 'hono/bun';

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
    engine: new ZenEngine(),
    rules: {} as Record<string, ZenDecision>,
  },
};

// --- OpenAPI schemas ---
const DecisionContentSchema = z
  .object({
    contentType: z.string(),
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
      description: '决策模拟执行结果（含 trace）',
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

const app = new OpenAPIHono();

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
      var fileUrl;
      if (file === 'index.html') {
        fileUrl = staticConfig.prefix; // Root URL for index.html
      }else{
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

// 以后给自定义函数返回一个json文件schema. 这样便于前端加载对应的自定义函数组件.
app.get('/input', (c) => {
  return c.json({ num: 19 });
});

// /api 以后使用 prefix 或者 plugin 来使用.
app.openapi(simulateRoute, async (c) => {
  // 动态加载规则文件
  const body = c.req.valid('json');
  console.log("body:", body);
  // const engine = new ZenEngine();
  const engine = store.zenDecisions.engine;
  const decision = engine.createDecision(body.content);
  try {
    // 考虑把 trace 做成一个url?后的参数
    const result = await decision.evaluate(body.context, { "trace": true });
    // console.log("result:", result);
    // store.zenDecisions.rules["a"] = decision;  // 测试把decision对象缓存起来.
    return c.json(result);
  } catch (error) {
    console.error(error);
    return c.json({ error: String(error) }, 500);
  }
});

app.openapi(decisionRoute, async (c) => {
  // 线上规则推理时需要把通过content获得的decision规则对象缓存起来，
  // 避免每次都重新创建规则对象
  const body = c.req.valid('json');
  console.log("body:", body);
  const engine = store.zenDecisions.engine;
  const decisionId = body.decisionId;
  // 如果传来了 decisionId，则尝试从缓存中获取对应的decision对象.
  // 否则每次都重新创建新的decision对象.
  let decision: ZenDecision;
  if (decisionId && store.zenDecisions.rules[decisionId]) {
    debug(`使用缓存的decision对象: ${decisionId}`);
    decision = store.zenDecisions.rules[decisionId];
  } else {
    if (!body.content) {
      return c.json({ error: 'content is required when decision is not cached' }, 400);
    }
    debug(`创建新的decision对象并缓存: ${decisionId}`);
    decision = engine.createDecision(body.content);
    if (decisionId) {
      // decisionId 考虑作为 /api/decision/:decisionId 的 url 参数传入.
      store.zenDecisions.rules[decisionId] = decision;
    }
  }
  const result = await decision.evaluate(body.context, { "trace": false });
  console.log("result:", result);
  return c.json(result);
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

const server = Bun.serve({
  port: 3000,
  fetch: app.fetch,
});
console.log(`Hono is running at http://${server.hostname}:${server.port}`);
console.log(`openapi UI is running at http://${server.hostname}:${server.port}/openapi`);
console.log(`openapi schema is running at http://${server.hostname}:${server.port}/openapi/json`);

// Admin API
const adminApp = new Hono().get('/', (c) => c.text('Admin API index')).get('/admin', (c) => c.text('Admin API'));

const adminServer = Bun.serve({
  port: 3001,
  fetch: adminApp.fetch,
});
console.log(`Admin API running at http://${adminServer.hostname}:${adminServer.port}`);
