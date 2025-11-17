// https://elysiajs.com/integrations/cheat-sheet.html#return-json
import fs from 'fs/promises';
import path from 'path';
import { debug } from "console";
import { Elysia } from "elysia";
import { ZenEngine } from '@gorules/zen-engine';
import { openapi } from '@elysiajs/openapi'
import * as os from 'os';

function getAllHostIps(): string[] {
    const networkInterfaces = os.networkInterfaces();
    const addresses: string[] = [];

    for (const interfaceName in networkInterfaces) {
        const networkInterface = networkInterfaces[interfaceName];
        if (networkInterface) {
            for (const iface of networkInterface) {
                // Skip internal loopback addresses (127.0.0.1) and IPv6 addresses
                // unless specifically needed. Here we focus on external IPv4.
                if (iface.family === 'IPv4' && !iface.internal) {
                    addresses.push(iface.address);
                }
            }
        }
    }
    return addresses;
}

const localIps = getAllHostIps();
console.log('Detected Host IPs:', localIps);
const hosts = localIps.map(ip => {return {
    port: 3000,
    hostname: ip 
  }
});
console.log('bind hosts:', hosts)

const ipPlugin = new Elysia({ name: 'ip' }) 
	.derive(
		{ as: 'global' },
		({ server, request }) => ({
			ip: server?.requestIP(request)
		})
	)
	.get('/ip', ({ ip }) => ip)


const app = new Elysia()
.use(ipPlugin)
.use(openapi()) 
.state('input', { num: 19 })
.state('db', { users: [], hits: 0 })
.state('zenDecisions', {engine: new ZenEngine(), rules:{}})
.onBeforeHandle(({ request, store }) => {
  console.log(`[${store.zenDecisions}] ${request.method} ${request.url}`)
  console.log("store:", store);
  console.log(`zenDecisions: [${store.zenDecisions}]`);
  // console.log("request:", request);
  // console.log("request.body:", request.body);
})
.get("/state", ({store}) => {
  console.log("store in /state:", store);
  return store;
})
.get("/", () => "Hello Elysia")
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
.listen(
  {
    port: 3000,
    hostname: '0.0.0.0' // Explicitly bind to all network interfaces
  }
);

// console.log(app.server)
console.log(
`Elysia is running at ${app.server.url.href}`
); 
console.log(`openapi is running at ${app.server.url.href}/openapi`)
// `Elysia is running at ${app.server.url.href}`
// `🦊 Elysia is running at ${app.server?.protocol}://${app.server?.hostname}:${app.server?.port}`


// const content:object = body.content;  // content 作为规则图json， 从数据库或文件系统中获取.
// const context:object = body.context;  // context 作为推理输入，从请求体中获取.
// const engine = new ZenEngine();
// const decision = engine.createDecision(content);
// const result = await decision.evaluate(context, {"trace": false});
// console.log("result:", result);
// return result;
//