# 宿主鉴权集成指南

> 适用范围：将本编辑器嵌入其他主应用时的身份打通与执行期用户隔离。
> 设计前提：编辑器定位为**通用无状态库**，自身不维护会话/用户数据库；鉴权由宿主负责，编辑器只消费注入的身份与上下文。

## 一、两层身份模型

| 层 | 接口 | 用途 | 落点 |
| --- | --- | --- | --- |
| 编辑态身份 | `AuthAdapter`(`() => Promise<{userId} \| null>`) | 图元数据归属显示、审计署名 | `EditorShellProvider options.authAdapter` |
| 执行态凭证 | `ExecContext`(`{userId, requestId}`) | 服务端 UDF(query_list 等)按用户隔离数据面 | HTTP 会话/网关头 → AsyncLocalStorage 穿透 |

关键区分：`AuthAdapter` 只解决"当前在编辑的人是谁"；规则执行时的用户级隔离由后端从请求本身解析(同源 cookie 或网关头)，**客户端不传明文 userId**。

## 二、三种宿主接入模式

| 模式 | 凭证传递 | authAdapter 写法 | 适用场景 |
| --- | --- | --- | --- |
| npm 嵌入(推荐) | 同源 httpOnly cookie 自动携带 | `() => fetch('/api/auth/get-session').then(r => r.json())` 取宿主会话 | 主应用与规则服务同域 |
| iframe/microfrontend | postMessage 握手换取 token → apiClient 注入 Authorization 头 | 包装握手 Promise 为 adapter | 跨团队异栈嵌入、跨域 |
| 独立部署+网关 | 网关鉴权后转发 `X-User-Id`/`X-Request-Id`(仅内网信任) | 无需(前端零感知) | SaaS 化独立部署 |

### 模式 1 示例：npm 嵌入

```tsx
import { EditorShellProvider } from './shell';

<EditorShellProvider
  options={{
    authAdapter: async () => {
      const res = await fetch('/api/auth/get-session');
      const session = await res.json();
      return session?.user ? { userId: session.user.id } : null;
    },
    // simulate 可选注入；缺省为同源 POST /api/simulate
  }}
>
  <MyGraphPage />
</EditorShellProvider>
```

页面内消费:

```tsx
const { customNodes, schema, userResolver, runSimulate } = useEditorShell();
```

### 模式 3 示例：网关头信任

```bash
# apps/editor 环境变量
TRUST_PROXY_HEADERS=true   # 仅在内网/网关之后开启，公网直连必须保持关闭
```

后端行为(apps/editor/src/index.ts `resolveExecContext`)：
- `TRUST_PROXY_HEADERS=true` 且带 `X-User-Id` → 采用该身份
- 否则回退 Mock 开发用户(`mock-user-1`)

simulate/decision 的 evaluate 全程包在 `runWithExecContext(ctx, ...)` 中，UDF 经 `getExecContext()?.userId` 读取——并发请求经 AsyncLocalStorage 天然隔离。

## 三、用户级数据隔离(名单)

- 名单分**私有**(owner=创建者，服务端注入)与**共享**(存量无 owner 文件)；私有仅 owner 可见可删，共享所有登录用户可读写
- 同名时自有遮蔽共享；他人私有一律 404(防名字探测)
- `query_list` 节点在规则执行时只命中"当前会话用户的私有名单 + 共享名单"
- 存储:`LISTS_DIR/users/{owner}/*.json` 与 `LISTS_DIR/shared/*.json`;存量扁平文件兼容读取

## 四、安全红线

1. **绝不信任客户端明文 userId**——身份只能来自 httpOnly cookie 会话或内网网关头;`TRUST_PROXY_HEADERS` 仅限受信网络
2. **cookie 优先于 token 注入**:同源场景用 httpOnly cookie,XSS 面最小
3. **http_request 出站不携带用户凭证**——如需第三方调用凭据,走服务端凭据库引用(未实现,设计先行)
4. **404 而非 403**:不可见资源与不存在资源返回一致,防枚举探测
5. **ExecCtx 无 actor = 管理员视角**,该路径仅供引擎直调/CLI 内部使用,不得暴露为 HTTP 行为
