// https://elysiajs.com/integrations/cheat-sheet.html#return-json
import fs from 'fs/promises';
import { readdir } from 'fs/promises';
import path from 'path';
import { join } from 'path';
import { debug } from "console";
import { ZenEngine } from '@gorules/zen-engine';
import { Elysia, file } from "elysia";
import { openapi } from '@elysiajs/openapi'
import { staticPlugin } from '@elysiajs/static'
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

// const ipplugin = new Elysia({ name: 'ip' })
// 	.derive(
// 		{ as: 'global' },
// 		({ server, request }) => ({
// 			ip: server?.requestIP(request)
// 		})
// 	)
//   .get('/ip', ({ ip }) => ip);

const staticConfig = {
  assets: 'public', // Directory to serve static files from
  prefix: '/', // URL prefix to access static files
};
const staticFilelistPlugin = new Elysia({ name: 'staticFilelist' }) 
.use(staticPlugin(staticConfig))
.get('/', async (request) => {
  if (!("files" in request.query)) {  // 如果没有传 files 参数，则返回 index.html
    const url = path.resolve(staticConfig.assets, 'index.html');
    return file(url);
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
      // fileUrl = path.resolve(staticConfig.prefix, file);
      htmlResponse += `<li><a href="${fileUrl}">${file}</a></li>`;
    }
    htmlResponse += '</ul>';

    return new Response(htmlResponse, {
      headers: {
        'Content-Type': 'text/html'
      }
    });
  } catch (error) {
    console.error(error);
    return new Response('Error reading directory', { status: 500 });
  }
});

// assets 默认是 public
const app = new Elysia()
.use(staticFilelistPlugin)
.use(openapi()) 
.state('input', { num: 19 })
.state('db', { users: [], hits: 0 })
.state('zenDecisions', {engine: new ZenEngine(), rules:{}})
.onBeforeHandle(({ request, store }) => {
  // console.log(`[${store.zenDecisions}] ${request.method} ${request.url}`)
  // console.log("store:", store);
  // console.log(`zenDecisions: [${store.zenDecisions}]`);
  // console.log("request:", request);
  // console.log("request.body:", request.body);
})
.get("/state", ({store}) => {
  console.log("store in /state:", store);
  return store;
})
.get("/input", () => {return { num: 19 }})  // 以后给自定义函数返回一个json文件schema. 这样便于前端加载对应的自定义函数组件.
// /api 以后使用 prefix 或者 plugin 来使用.
.post('/api/simulate',  async ({request, body, store}) => {
      // 动态加载规则文件
      console.log("body:", body);
      const content:object = body.content;
      const context:object = body.context;
      // const engine = new ZenEngine();
      const engine = store.zenDecisions.engine;
      const decision = engine.createDecision(content);
      const result = await decision.evaluate(context, {"trace": true});  // 考虑把 trace 做成一个url?后的参数
      // console.log("result:", result);
      // store.zenDecisions.rules["a"] = decision;  // 测试把decision对象缓存起来.
      return result;
    })  
.post('/api/decision',  async ({request, body, store}) => {
      // https://elysiajs.com/patterns/extends-context.html#decorate
      // 线上规则推理时需要把通过content获得的decision规则对象缓存起来，
      // 避免每次都重新创建规则对象
      // 动态加载规则文件
      console.log("body:", body);
      const engine = store.zenDecisions.engine;
      // 如果传来了 decisionId，则尝试从缓存中获取对应的decision对象.
      // 否则每次都重新创建新的decision对象.
      if(body["decisionId"]) {  // decisionId 考虑作为 /api/decision/:decisionId 的 url 参数传入.
        const decisionId:string = body.decisionId;
        if(store.zenDecisions.rules[decisionId]) {
          debug(`使用缓存的decision对象: ${decisionId}`);
          const decision = store.zenDecisions.rules[decisionId];
        } else {
          debug(`创建新的decision对象并缓存: ${decisionId}`);
          const decision = engine.createDecision(content);
          store.zenDecisions.rules[decisionId] = decision;
        }
      }
      const context:object = body.context;
      const result = await decision.evaluate(context, {"trace": false});
      console.log("result:", result);
      return result;
    })
.listen(3000, ({protocol,hostname, port, url}) => {
    // [Elysia assign hostname to 0.0.0.0 automatically, which works with Railway](https://elysiajs.com/patterns/deploy.html#railway:~:text=provided%20by%20Railway.-,TIP,-Elysia%20assign%20hostname)
    // console.log(url);
    console.log('Elysia assign hostname to 0.0.0.0 automatically');
    console.log(`🦊 Elysia  is running at ${protocol}://${hostname}:${port}`);
    console.log(`🦊 openapi UI is running at ${protocol}://${hostname}:${port}/openapi`);
    console.log(`🦊 openapi schema is running at ${protocol}://${hostname}:${port}/openapi/json`);
  });

// const content:object = body.content;  // content 作为规则图json， 从数据库或文件系统中获取.
// const context:object = body.context;  // context 作为推理输入，从请求体中获取.
// const engine = new ZenEngine();
// const decision = engine.createDecision(content);
// const result = await decision.evaluate(context, {"trace": false});
// console.log("result:", result);
// return result;

// Admin API
const adminApp = new Elysia()
  .get("/", () => "Admin API index")
  .get("/admin", () => "Admin API")
  .listen(3001, ({ hostname, port }) => {
    console.log(`Admin API running at http://${hostname}:${port}`);
});
