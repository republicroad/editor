# 项目状态

> 快照时间：2026-08-09

---

## 1. 当前环境

### 1.1 分支状态

| 仓库 | 当前分支 | 基于分支 | 说明 |
|------|----------|----------|------|
| editor(主项目) | `zrule` | `master` | 前后端 TypeScript monorepo 开发分支 |
| jdm-editor(子模块) | `zrule` | `master` | 外部化改造分支(与主项目同分支开发) |

### 1.2 版本信息

| 组件 | 版本 | 说明 |
|------|------|------|
| @gorules/editor | v1.16.1 | 主项目版本 |
| @gorules/jdm-editor | v1.52.0 | 组件库版本 |
| zen-engine | 0.53 | Rust 决策引擎 |
| zen-engine-wasm | ^0.23.1 | WASM 引擎绑定 |

---

## 2. 版本历史里程碑

| 版本 | 日期 | 关键变更 |
|------|------|----------|
| v1.0.0 | 2023-12-04 | 初始发布 |
| v1.1.0 | 2023-12-12 | 更新 zen-engine |
| v1.2.0 | 2024-01-31 | 升级 gorules editor |
| v1.3.0 | 2024-01-31 | 添加暗色模式 |
| v1.4.0 | 2024-02-06 | 可选的宽松 CORS |
| v1.5.0 | 2024-05-17 | 更新 jdm-editor |
| v1.6.0 | 2024-07-05 | 升级 zen v0.23 |
| v1.7.0 | 2024-07-17 | 升级 zen engine v0.24.x |
| v1.8.0 | 2024-08-07 | 升级 gorules deps |
| v1.9.0 | 2024-08-28 | 更新 editor |
| v1.10.0 | 2024-09-23 | 添加 Intellisense |
| v1.11.0 | 2024-10-25 | 升级 zen 0.33.0 |
| v1.12.0 | 2024-12-07 | 更新 packages |
| v1.13.0 | 2025-04-15 | 升级依赖 |
| v1.14.0 | 2025-05-15 | 更新 zen |
| v1.15.0 | 2025-05-23 | 更新 zen |
| v1.16.0 | 2026-01-22 | 更新引擎和编辑器 |
| v1.16.1 | 2026-02-13 | 降级到 React 18 |

---

## 3. 依赖快照

### 3.1 前端核心依赖

| 依赖 | 版本 | 状态 |
|------|------|------|
| react / react-dom | ^18.3.1 | 稳定 |
| antd | ^5.29.3 | 稳定 |
| @ant-design/icons | ^6.1.0 | 稳定 |
| react-router / react-router-dom | ^7.13.0 | 稳定 |
| reactflow | 11.11.4 | 锁定版本 |
| zustand | ^4.5.5 | 稳定 |
| immer | 10.1.1 | 锁定版本 |
| @codemirror/* | ^6.x | 稳定 |
| @monaco-editor/react | ^4.7.0 | 稳定 |
| graphology | ^0.26.0 | 稳定 |
| graphology-dag | ^0.4.1 | 稳定 |
| axios | ^1.13.5 | 稳定 |
| zod | ^4.3.6 | 稳定 |

### 3.2 开发依赖

| 依赖 | 版本 | 状态 |
|------|------|------|
| typescript | ^5.9.3 | 最新 |
| vite | ^7.3.1 | 最新 |
| @vitejs/plugin-react-swc | ^4.2.3 | 稳定 |
| eslint | ^10.0.0 | 最新 |
| prettier | ^3.8.1 | 稳定 |
| semantic-release | ^25.0.3 | 稳定 |
| monaco-editor | 0.52.2 | 锁定版本(Monaco 本地化加载) |
| vite-plugin-static-copy | 4.1.1 | 稳定(构建期拷贝 Monaco 静态资源) |

### 3.3 后端依赖

| 依赖 | 版本 | 状态 |
|------|------|------|
| zen-engine | 0.53 | 最新 |
| axum | 0.7 | 稳定 |
| tokio | 1 | 稳定 |
| tower-http | 0.5 | 稳定 |

---

## 4. Git 分支结构

### 4.1 主项目分支

| 分支 | 说明 | 状态 |
|------|------|------|
| `master` | 上游同步分支 | 活跃 |
| `standalone` | 开源发布分支 | 活跃 |
| `zrule` | 前后端 TS monorepo 开发分支 | **当前** |
| `opencode` | 定制化开发分支 | 历史(功能已并入 zrule) |
| `mono_v1` | Monorepo 实验 | 历史 |
| `workspace_v1/v2/v3` | 工作空间实验 | 历史 |

### 4.2 jdm-editor 分支

| 分支 | 说明 | 状态 |
|------|------|------|
| `master` | 上游发布分支 | 活跃 |
| `zrule` | 外部化改造 + 前后端 TS 开发分支 | **当前** |
| `standalone` | 开源发布分支 | 活跃 |
| `opencode` | 定制化开发分支 | 历史(功能已并入 zrule) |

---

## 5. 构建状态

### 5.1 前端

- **构建命令**: `bun run build`(= `tsc && vite build`)
- **测试命令**: `bun run test`(子模块内 = `bun run --cwd packages/jdm-editor test` = `bun test src`，当前 21 pass)
- **输出目录**: `static/`
- **状态**: 正常
- **类型检查**: 根 tsconfig 启用 `noImplicitAny: true`(全项目严格检查，含 paths 映射引入的子模块源码)；`@gorules/lezer-zen`/`@gorules/lezer-zen-template` 无内置类型，由子模块 `src/lezer-zen.d.ts`(声明 `parser: LRParser`)+ `zen.ts` 顶部 triple-slash 引用解决
- **Monaco 本地化加载**: 运行时从版本化路径 `/monaco-editor@0.52.2/min/vs/**` 加载，构建期由 `vite-plugin-static-copy` 从 `node_modules/monaco-editor` 拷贝到 `static/monaco-editor@0.52.2/`

### 5.2 后端

- **构建命令**: `cargo build`
- **输出**: `target/debug/editor`
- **状态**: 正常

### 5.3 Docker

- **镜像**: `gorules/editor`
- **平台**: linux/amd64
- **状态**: 正常

---

## 6. 已知问题与待办

### 6.1 已知问题
- HTTP 协议下 `crypto.randomUUID` 不可用，已通过 polyfill 解决
- lezer-zen / lezer-zen-template / zen-engine-wasm 源码已从工作区移除(opencode 与 zrule 分支均如此)，改为外部 npm 固定版本依赖

### 6.2 待办事项
- [~] Hono 后端生产化(当前为实验状态)：已移除 :3001 admin 存根、名单 API 升级为持久化 CRUD(见 7.3)；剩余：真实部署配置、错误处理统一
- [x] lezer-zen 源码移除并迁移为外部 npm 依赖(子模块 `e21bd87`)
- [x] zen-engine-wasm 源码移除并迁移为外部 npm 依赖(子模块 `e21bd87`)
- [~] 完善单元测试覆盖(bun test 基线：子模块 21 pass(`f4e972d`)；主仓协议库单测 93 pass + zen-rule 引擎单测 31 pass；模拟器 hooks 待补)
- [~] 补充 Storybook 组件文档(新增 simulator-request-panel stories(带/不带 InputNode 绑定)，`--smoke-test` 通过；其余组件沿用既有 stories)
- [x] 修复 vite build 预存在问题(vite-plugin-dts 加载失败；子模块构建已正常产出 dist/)
- [x] CI 迁移提交(`.github/workflows/validate.yml` pnpm→bun，见 `c0f8d89`)
- [ ] `/api/auth/get-session` 由 Mock 用户升级为真实会话(better-auth 服务端 + 数据库)

---

## 7. 最近活动

### 7.1 主项目最近提交

```
2852407 docs: record simulator modularization refactor and test baseline in request node plan
cf61aee feat: update jdm-editor with request node enhancements and simulator tooltip fix
ac905e6 docs: add antd vs shadcn+ReUI evaluation docs
7dc44d5 feat: query-list custom node with two-pane editor and server list API
3a99c94 docs: update docs
2faf7eb docs: add typescript monorepo branch zrule docs
760897e feat: array-based custom node expressions with legacy ;; upload migration
c0f8d89 chore: editor use zrule branch as dev branch and update github workflow
b0b315c build: single-package submodule with published lezer/zen deps
b7d12bc docs: update project status, dev guide and README
1db7dbb fix: enable noImplicitAny for stricter typecheck
0292f98 feat: custom node registry with function mode in decision graph
2e67e55 feat: localize Monaco loading with versioned static paths
b350013 chore: refactor to use mono repo config and use linter to format codes
31ffe11 feat: add zen-rule for backend to exec custom node functijon
5e7504b docs: add docs for hono
bc79a66 fix: fix rule graph /api/simulate zod error
d4e6f33 chore: rewrite from elysia to hono
81ae0d0 chore: update jdm-editor zrule branch
6db5192 docs: add 07-implementation-plan to README index
dceba9d docs: update project status and implementation plan
```

### 7.2 jdm-editor zrule 分支提交

```
a75fd1e refactor(simulator): extract nodes panel and request binding/editor hooks
f4e972d test: add unit tests for request-schema helpers and json path extractor
e254cd7 refactor(simulator): extract request toolbar and persistence hook, sync definition defaults
10eff3b refactor: extract request tab orchestration into use* hooks
7133c49 refactor(simulator): simplify request toolbar
303e169 refactor: split tab-request.tsx and request-schema.ts into modular files
6a2fe8d fix: simulator toolbar tooltip flickering on hover
5d73ea6 feat: examples table view with drawer editor for request node
89dcc30 feat: custom node expressions as string arrays, JSON code mode, legacy ;; migration
e21bd87 build: single-package bun workspace, use published lezer/zen deps
bc3314b fix: resolve tsc compile errors
3f59467 feat: custom function table editor for custom node renderTab
38fce5f fix: match opencode branch simulator request editor height
52c39df fix: add CachedGraphIterator type to traversal iterator
33ecf08 fix: correct UTF-8 encoding for copied files
0e7aee0 fix: add missing tab-request.scss for Request node styling
8faafc1 feat: export TabRequest, request-schema, json-schema from barrel
f716ea7 feat: replace TabJsonSchema with TabRequest for input node
203de98 feat: upgrade simulator request panel with full feature set
```

### 7.3 zrule 分支变更摘要

**最新变更(2026-08-23，第五/六批：数据加工节点对 + 基建打磨)：**
- 新增 `contrib.json_path`(JSONPath 提取，jsonpath-plus 标准语法，单命中返回值多命中数组，无命中回退 default；子模块 json-path-extractor 经核实为字段定位器而非查询引擎，故改用标准库)与 `contrib.template`(`${path}` 插值渲染，缺失变量空串)两节点，均含引擎向量测试
- KeyValueEditor 抽取为共享组件 `key-value-editor.tsx`(含 Hint),http-request 节点同步瘦身；template 变量表直接复用
- register 类型转换表新增 `any` 直通(json_path 的 input/default 需要)；夹具自动同步脚本 `bun run sync:schema`(udfManager→JSON,离线回退首次纳入 risk.query_list)
- eslint 对 vendored cascader 关闭 react-refresh/no-explicit-any(警告 27→10);crypto 行与节点体显示模拟结果摘要徽章(Hint 全文)
- 主仓测试基线 **93 pass**(`bun test src`)+ zen-rule **31 pass**；README 重写更新(API 一览/自定义节点协议表/质量门禁命令，移除过时 3001 与 tsc 报错说明)
- 新增 `docs/13-custom-node-development.md` 自定义节点开发指南(管线沉淀 + 反模式备忘)

**最新变更(2026-08-23，第四批：crypto 节点 UX 改造)：**
- 摘要方式改为 ReUI Cascader 两级级联(普通摘要/HMAC 签名 × MD5/SHA1/SHA256/SHA512)，模式由显式选择驱动，选中 HMAC 才显示密钥输入框(必填)；旧图「secret 非空即 HMAC」推导兼容，零迁移
- 输出编码改 shadcn ToggleGroup 三段互斥分段按钮(HEX/Base64/Base64URL)，HEX 大写 Switch 保留
- 协议库新增 `deriveCryptoMode`/`applyCryptoMode`(切回普通摘要强制清空密钥槽位)，单测 +3 至 12；主仓测试基线 81 pass
- 引入 `@reui/cascader` 组件族与 toggle-group/spinner，新增依赖 @tanstack/react-virtual、@radix-ui/react-toggle(-group)；cascader 源码按 React18 类型修补 ref 只读冲突(cascader.tsx/cascader-footer.tsx)

**最新变更(2026-08-23，第三批：crypto 自定义节点)：**
- 新增 `contrib.crypto` 摘要签名节点(引擎+前端全链路)：zen-rule 注册 `crypto` UDF(md5/sha1/sha256/sha512，secret 非空启用 HMAC，hex/base64/base64url 编码，upper 大写 hex；非法值宽容回退不抛异常)，Bun.CryptoHasher 原生实现零新依赖，标准向量测试 7 pass
- 前端双栏编辑器(实例行列表+详情表单)：算法/编码 Select、密钥 CodeEditor、HEX 大写 Switch、多实例支持；表达式协议 `['crypto', input, "algorithm", secret?, "encoding"?, upper?]` 变长尾参，抽取至 `src/lib/crypto-protocol.ts`(9 单测)
- 引擎修复：register 的 jsonT2pyT string 转换器 null 安全(null→'' 而非字符串 "null"，避免空槽位被当作字面量)；string 型参数缺省值显式置空串
- 主仓测试基线 78 pass(`bun test src`)，zen-rule 24 pass；lint/typecheck/build 全绿

**最新变更(2026-08-23，第二批：编辑器功能 C+D)：**
- Monaco 双实例类型冲突修复(子模块 tsconfig):直接 import `monaco-editor` 与 `@monaco-editor/react` 内部解析到两份不同拷贝导致 3 处 TS 冲突;`packages/jdm-editor/tsconfig.json` 增加 paths 钉死工作区副本，子模块 typecheck 归零
- 名单 API 持久化 CRUD(`apps/editor`):新增 `GET/PUT/DELETE /api/lists/{name}` 与 `POST /api/lists`(upsert)，写回 `apps/editor/lists/*.json`(unicode 安全文件名清洗、删除时清理落盘文件);zen-rule 新增 `deleteList`;CRUD 冒烟测试通过；服务端口支持 `PORT` 环境变量覆盖(默认 3000)
- 移除 :3001 admin 存根服务(实验遗留，README 中的 3001 说明已过时)
- http-request 协议库抽取(主项目 `src/lib/http-request-protocol.ts`):parseHttpRequest/toHttpRequestValue/对象字面量行编解码/auth 四态等纯函数从节点组件抽出,`parseOperatorArgs` 一并迁入并由 custom-node-registry 转出保持兼容;根 package.json 新增 `test` script + `@types/bun`,`bun test src` 共 **62 pass**
- zen-rule 测试基建:`tsconfig` 显式引用 bun-types，修复存量 typecheck:apps 对测试文件报错
- Storybook:子模块新增 simulator-request-panel stories(带/不带 InputNode 绑定两个场景),`--smoke-test` 通过

**最新变更(2026-08-23)：**
- HTTP 请求节点 E1+E2(docs/08 §7)：编辑器左表单页签化(Headers/Body/Params/高级，shadcn Tabs)+ 右响应分栏保留；引擎(`apps/zen-rule`)新增 `params` 查询参数合并、`timeout`(100–60000ms)、`retry`(仅网络错/超时/5xx/429，指数退避)、`auth`(Basic/Bearer，显式 Authorization 头优先)；表达式尾参变长序列化，旧图零迁移；bun test 13 pass
- 主 app antd 迁移完成(docs/12):src/ 内 antd 引用 7 文件 → 1(theme.provider ConfigProvider,jdm-editor 硬依赖);`@ant-design/icons` 全部换 lucide;新增 shadcn switch/dropdown-menu/alert-dialog + sonner(替代 message/Modal.confirm/Dropdown/Switch);主 chunk -291 kB
- 主题集成修复:`theme.provider` 双信号 dark 模式(`body[data-theme]` + `html.dark`);`main.css` 补 Tailwind preflight(修复 UA `button{color:buttontext}` 导致暗色按钮文字不可见)与 body 底色

**最新变更(2026-08-09)：**
- query-list 自定义节点(`7dc44d5`)：主项目新增 query-list 节点双栏(Code / Server)编辑器，后端新增 server list API(ListNodesRequest + server `list` 操作)，打通「画布自定义节点 → 后端列表查询」链路
- antd vs shadcn+ReUI 评估存档(`ac905e6` + `3a99c94`)：新增 docs 09/10/11 三份评估文档(见 README 索引)，结论为「antd 核心 + ReUI 增量」，08 Request 节点计划同步补充模拟器重构与测试基线记录(`2852407`)
- 模拟器模块化重构(子模块 `5d73ea6`→`a75fd1e`)：`tab-request.tsx` / `request-schema.ts` 拆分为 `simulator/` 目录(`simulator-nodes-panel.tsx`、`simulator-request-toolbar.tsx`、`use-request-example-persistence`、`use-simulator-request-binding`、`use-simulator-request-editor`)；新增 examples 表格视图 + 抽屉编辑器(`5d73ea6`)；定义默认值在切源时同步(`e254cd7`)；工具栏 tooltip 抖动修复(`6a2fe8d`)；光标在外部同步时保持在末尾(`7133c49`)
- bun test 单测基线(子模块 `f4e972d`)：新增 `@types/bun` + `test` script(`bun test src`)，request-schema helpers 与 json-path-extractor 单元测试，**21 pass / 0 fail**
- 主项目同步(`cf61aee`)：jdm-editor 更新至 `a75fd1e`，带入 Request 节点增强与模拟器 tooltip 修复

**最新变更(2026-08-07)：**
- 开发分支切换(`c0f8d89`)：editor 主项目由 `opencode` 切换到 `zrule` 作为开发分支，`.gitmodules` 中子模块分支同步设为 `zrule`；`.github/workflows/validate.yml` pnpm→bun 迁移并提交(`oven-sh/setup-bun@v2` + bun 1.3.14 + `bun install --frozen-lockfile`，lint / typecheck / typecheck:apps / test:zen-rule)
- 数组化自定义函数表达式 + 旧 `;;` 上传迁移(`760897e` 主项目 + `89dcc30` 子模块)：`CustomNodeExpression.value` 由 `string` 扩展为 `string | string[]`；上传/导入经 `normalizeGraphNodes`(主项目 `src/helpers/graph.ts`)与 `normalizeCustomNodeExpressions`(子模块 `dg-store`)自动把旧 `;;` 字符串拆分为数组；`parseOperatorArgs`/`toFunctionCallValue`/`defaultCustomNodeConfig` 改为数组化；子模块新增 `toOperatorExprArray/String/Display`、`parseOperatorExprInput`(JSON 数组编辑 + 旧格式兼容)，`isFunctionExpressionValue` 接受数组；zen-rule `parseOperatorExpr` 支持数组原样返回，新增 `custom_double_semicolon.json` 夹具
- jdm-editor 单包 workspace 化(`e21bd87` 子模块 + `b0b315c`)：移除 `packages/lezer-zen` / `lezer-zen-template` / `zen-engine-wasm` 源码，三库改为外部 npm 固定版本(0.8.1 / 0.4.0 / ^0.23.1)；root 加 `workspaces` 字段，build/typecheck/test 改 bun 原生脚本(`bun run --cwd packages/jdm-editor ...`)；保留 `pnpm-workspace.yaml` + `lerna.json` 与上游对齐；单独构建 `cd jdm-editor && bun install && bun run build` → `packages/jdm-editor/dist/`
- Monaco 本地化加载(`2e67e55`)：monaco-editor 锁定 0.52.2，从版本化路径 `/monaco-editor@0.52.2/min/vs/**` 加载，`vite-plugin-static-copy` 构建期拷贝；`vite.config.ts` 通过 createRequire + 入口解析 + 向上爬目录定位 monaco 包(兼容 Node ≥18，规避 0.56.0 的 exports map 解析问题)
- Custom node registry + function mode(`0292f98`)：新增 `custom-node-registry.tsx`(`schemaToCustomNodes`/`fetchCustomNodeSchema`，失败回退 `custom-node-schema.json`)、`custom-node-types.ts`、`useCustomNodes` hook、`CustomNodeSummaryCard`；`decision-simple.tsx` 将 schema 的 `customFunctions` 传入 DecisionGraph
- custom function table editor(`3f59467`，子模块)：新增 `custom-function-table/` 组件(函数下拉、参数编辑器、结果浮层、expression-store 状态)；`customFunctions` 经 `DecisionGraphWrapper` 透传 renderTab(`tab-custom-function-table.tsx`)；`expr_asts` smartSplit 回写；`editExpression` 按钮文案本地化

**jdm-editor 库(zrule 分支)：**
- UserResolver 类型 + store + wrapper + exports
- components override 机制(specOverrides in TabContents)
- customNode renderTab 路由(.otherwise() 检查 customNodes by kind)
- Input Schema 扩展 → 完整 Request 节点改造(TabRequest 3-Tab 编辑器)
- request-schema.ts(~1,010 行)+ json-schema.ts(~66 行)
- i18n 基础设施(zh/en 翻译)
- Simulator Request Panel 升级(~700 行，含 Format/Sync/Save/Copy/Run)

**编辑器项目(最近已提交部分)：**
- better-auth 客户端 + UserResolver 工厂
- DecisionGraph 集成 userResolver prop
- Bun 后端 Elysia → Hono 迁移(`hono` + `@hono/zod-openapi` + `@scalar/hono-api-reference` + `zod`，移除 `elysia`/`@elysiajs/*`)
- 新增 `GET /api/auth/get-session`(Mock 开发用户)，打通 better-auth UserResolver 链路
- 新增请求日志中间件 + `onError` 统一错误日志(打印方法/路径/状态/耗时与异常堆栈)
- 修复 `/api/decision` 缓存逻辑 bug(原 `content` 未定义、`decision` 作用域错误)与 `contentType` 校验过严问题
- `.github/workflows/validate.yml`：pnpm→bun 迁移(已随 `c0f8d89` 提交，含 lint / typecheck / typecheck:apps / test:zen-rule)
