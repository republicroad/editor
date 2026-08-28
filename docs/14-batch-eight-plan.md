# 第八批执行计划:鉴权适配层 + ExecCtx 通道(+ 名单隔离规划存档)

> 状态:规划完成,**待显式启动**。启动指令下达前不改动任何代码。
> 执行范围:A、B 两项(主仓 apps/editor、apps/zen-rule、src/lib,不含 jdm-editor 子模块)。
> **C 项(名单 owner 隔离)本批仅记录、明确不做**,待单独放行后再启动。
> 原则:先铺管道,真实鉴权由宿主负责(2026-08-24 决策);单用户 Mock 场景行为完全不变。

## 执行序列与提交约定

| 步骤 | 内容 | 提交 |
| --- | --- | --- |
| 0 | 本计划文档 + docs/03 指针行 | `docs: record batch eight plan, C deferred` |
| 1(A 批) | AuthAdapter 抽取,门禁通过后**独立成笔** | `feat(auth): extract auth adapter layer` |
| 2(B 批) | ExecCtx 通道,门禁通过后**独立成笔** | `feat(engine): thread execution context via AsyncLocalStorage` |
| 3 收尾 | docs/03 追加第八批 changelog 与 §6.2 勾选(C 标记暂缓),全量门禁复跑 | `docs: record batch eight (auth adapter + exec context)` |

A、B 两笔均为纯代码提交,changelog 单独第三笔,互不混杂;每笔提交前跑对应门禁(lint / typecheck×2 / 相关测试),最后整体复跑 build。C 全程不碰(lists.ts、apps/editor lists 路由零改动)。

## A. AuthAdapter 抽取(src/lib)【待启动】

- 新建 `src/lib/auth/adapter.ts`:

```ts
export interface AuthUser { userId: string; displayName?: string }
export type AuthAdapter = () => Promise<AuthUser | null>;
export const createAnonymousAdapter = (): AuthAdapter;   // 恒 null
export const createBetterAuthAdapter = (): AuthAdapter;  // 包装 auth-client.getSession()
```

  宿主自定义 adapter 直接传函数即可,无需内置更多实现。

- `user-resolver.ts` 薄封装:`createUserResolver(adapter)` 将 AuthUser 映射为 jdm-editor 的 `{ user }`;现有 `createBetterAuthResolver` 保留为兼容别名(基于新实现)。
- `decision-simple.tsx` 接线改走 adapter;better-auth 从硬依赖降为可选实现。

## B. ExecCtx 执行上下文通道(apps/zen-rule + apps/editor)【待启动】

- 首个任务为 spike:验证 Bun 下 `node:async_hooks` AsyncLocalStorage 可用性。
- zen-rule 新建 `src/exec-context.ts`:

```ts
export interface ExecContext { userId?: string; requestId?: string }
export const execStorage = new AsyncLocalStorage<ExecContext>();
export const getExecContext = (): ExecContext | undefined;
```

- **禁止用 ZenRule 实例字段存 ExecCtx**(ZenRule 是单例,并发请求竞态);UDF 直接 `import { getExecContext }` 使用,`engine.ts` 签名不变。
- apps/editor 会话解析中间件:优先读网关头(`X-User-*`,仅 `TRUST_PROXY_HEADERS=true` 时信任),否则走现有 mock 会话(`/api/auth/get-session` 形状不变);simulate/decision 路由内 `execStorage.run(ctx, () => evaluate(...))`。
- 测试:zen-rule 并发隔离用例(两个不同 ctx 的 evaluate 交错执行,各 UDF 读到各自 userId);apps/editor 补 2-3 个路由用例。

## C. 名单 owner 隔离(apps/zen-rule/lists.ts + apps/editor 路由)【已实施(2026-08-25，第九批)】

> 实施提交:zen-rule `f63e6c5` + apps/editor `4bd678f`。以下为落地语义(与原存档的差异已标注)。

- `NamedList` 增加 `owner?: string`;**存储改为双层作用域 Map**(''=共享,其余=owner id),同名名单跨用户互不覆盖,解析时自有遮蔽共享
- 访问器加可选尾参 `actor`(不传=管理员视角全可见,既有测试零改动):
    - `listLists(query?, actor?)` → 自己的私有 + 全部共享
    - `getList(name, actor?)` / `queryList(name, value, actor?)` → 自有优先回落共享;他人私有不可见
    - `deleteList(name, actor?)` → 私有仅 owner/管理员可删,**共享任意 actor 可删**(拍板语义)
    - `registerList(list, owner?)` → owner 亦可经对象字段传入
- `query_list` UDF 以 `getExecContext()?.userId` 作为 actor(经 ALS 并发隔离,有单测覆盖)
- 存储布局:`LISTS_DIR/shared/*.json`(共享)+ `LISTS_DIR/users/{owner}/*.json`(私有);存量扁平文件视为共享兼容读取,写回时原位更新防重复
- API 行为:GET 列表按会话用户过滤(响应形状 `{name,size}[]` 不变,前端零改动);detail 附 `owner?` 字段;POST 由服务端注入 `owner=会话用户`(**新建默认私有**,拍板语义),客户端归属字段被 schema 剥离;PUT 保留原 owner(共享编辑后仍共享);他人私有一律 404 防名字探测
- 测试:zen-rule **35→40 pass**(+5:可见性矩阵/自有遮蔽/删除权限矩阵/双传参兼容/并发 UDF 双 ctx 命中);apps/editor **16→21 pass**(+5:落盘目录/列表过滤/跨用户 404 矩阵/存量共享可删/同名互不干扰)

## 明确不做(除 C 外留下批)

http_request 出站携带用户 token(高危,需凭据库+白名单方案先行)、EditorShell Provider 抽取、docs/14-auth-integration.md 集成指南、better-auth 服务端真实化。

## 风险

ALS 在 Bun 下的边界行为(spike 先行验证);mock 会话下多用户行为要等真实鉴权接入才显现(本批只保证管道正确)。C 项另注:名单并发写盘为 last-write-wins,实施时需一并评估。
