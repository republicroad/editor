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

- **运行**: `bun run --cwd apps/editor dev`(Bun/Hono，唯一后端)
- **端口**: 3000
- **状态**: 正常
- **图持久化**: `/api/graphs`(参考实现，`graphs-store.ts` 存储层；详见 docs/15)

### 5.3 Docker

- **镜像**: 自构建(`docker build -t editor .`，bun 多阶段)
- **平台**: linux/amd64
- **状态**: 正常
- **持久化**: 图/名单落盘于镜像内 `apps/editor/graphs` / `apps/editor/lists`，生产以 volume 挂载

---

## 6. 已知问题与待办

### 6.1 已知问题
- HTTP 协议下 `crypto.randomUUID` 不可用，已通过 polyfill 解决
- lezer-zen / lezer-zen-template / zen-engine-wasm 源码已从工作区移除(opencode 与 zrule 分支均如此)，改为外部 npm 固定版本依赖
- **request 节点 Schema 数据保存丢失**：保存规则时 `contrib.http_request` 节点的 Schema 数据未保存(已定位方向，待处理)**——backlogged**，见 docs/16-deployment-plan(第十五批已知问题项)

### 6.2 待办事项
- [~] Hono 后端生产化(当前为实验状态)：已移除 :3001 admin 存根、名单 API 升级为持久化 CRUD(见 7.3)；env 配置化(PORT/CORS_ORIGINS/LISTS_DIR)、统一 HTTPException 错误处理、调试端点清理、路由单测已完成(第七批)；剩余：真实部署配置
- [x] lezer-zen 源码移除并迁移为外部 npm 依赖(子模块 `e21bd87`)
- [x] zen-engine-wasm 源码移除并迁移为外部 npm 依赖(子模块 `e21bd87`)
- [~] 完善单元测试覆盖(bun test 基线：主仓 **174 pass**；component-tests **38 pass**(自定义节点组件交互，jsdom+RTL)；apps(zen-rule+editor) **67 pass**；子模块模拟器面板组件级交互待补)
- [x] 第十六批(库化质量)：主仓组件交互测试基建(jsdom 单例环境 + jdm-editor 全量桶 mock)+ KV 编辑器/HTTP 请求节点(Tab+画布卡)/查询名单节点(Tab+画布卡)/摘要卡片 38 用例；主仓 Storybook 配置(KV 编辑器 + DecisionGraph 嵌入示范 stories，`build:storybook` 本地验证)；CI 加 test:components；已知问题 request 节点 Schema 保存丢失维持 backlog(docs/16 §4)
- [x] 补充 Storybook 组件文档(simulator-request-panel + simulator-nodes-panel stories，`--smoke-test`/`--ci --smoke-test` 通过；主仓 Storybook 已于第十六批配置：src/stories/ 下 KeyValueEditor 与 DecisionGraph 嵌入示范)
- [x] 修复 vite build 预存在问题(vite-plugin-dts 加载失败；子模块构建已正常产出 dist/)
- [x] CI 迁移提交(`.github/workflows/validate.yml` pnpm→bun，见 `c0f8d89`)
- [~] `/api/auth/get-session` 由 Mock 用户升级为真实会话(better-auth 服务端 + 数据库)——**暂缓**：编辑器定位为通用无状态库，鉴权由宿主应用负责(2026-08-24 决策)
- [x] 第八批：A AuthAdapter 抽取(`515c3f7`) / B ExecCtx 执行上下文通道(`638105f`)——详见 docs/14-batch-eight-plan.md；C 名单 owner 隔离已于第九批实施(`8360714`+`eaadb0c`)
- [x] 库化第二步(第十批)：EditorShell Provider(schemaSource/authAdapter/simulate 注入)+ useCustomNodes 组合选项 + storage 键命名空间化 + docs/14-auth-integration.md 集成指南
- [x] 库化第三步(第十一批)：Graph Persistence 接口契约(`src/shell/persistence.ts`)+ 设计提案(`docs/15-persistence-interface-proposal.md`)——图+配置打包(extensions)、历史版本(revision 必选语义)、乐观锁(baseRevision)
- [x] 第十二批：实施 `/api/graphs` 参考实现(`graphs-store.ts` 存储层 + 六端点路由 + `graphs-http-adapter.ts` 适配器 + 6 集成用例)——参考实现落地、宿主持久化可复用
- [x] 第十三批(方向A)：`EditorShellProvider` 把 `persistence` 暴露进 context(`d529c03`)；页面 open/save 接持久化(`a5dbb0e`)——注入适配器后 Open 出现 "Graph library" 子菜单、Save/Save-as 走宿主存储且带 baseRevision 乐观锁，冲突提示刷新；纯逻辑抽到 `src/lib/graph-persistence.ts` 并补 6 单测
- [x] 第十三批待接线：版本历史子面板——已由第十四批落地（见下）
- [x] 第十四批(方向A)：版本历史子面板 UI——`listRemoteVersions` 纯逻辑(`src/lib/graph-persistence.ts`)+单测；打开宿主图后顶栏 "Versions" 下拉列版本(`adapter.listVersions(id)`)、选中确认后 `adapter.load(id,{revision})` 加载历史、以该版本为 `baseRevision` 乐观锁；契约与参考实现此前已具备，本批闭合第十三批唯一开放项
- [x] 第十五批(部署收尾)：Rust/pnpm 遗留清除(`backend/`、根 `Cargo.toml`/`Cargo.lock`、`pnpm-lock.yaml`)；`apps/editor` 定位唯一后端；Dockerfile 重写为 bun 多阶段 + `.dockerignore`；CI 真门禁(去 `continue-on-error`，加主仓/apps 测试 + build job，push 触发 master/zrule，子模块 checkout)；本地 podman 构建验证

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

**最新变更(2026-08-28，第十六批：库化质量——组件交互测试 + 主仓 Storybook)：**
- 组件测试基建(`b3a638f`)：`component-tests/` 独立目录 + `bun run test:components`(独立进程，避免 bun test 路径子串误捞)；`src/test-utils/setup-jsdom.ts` jsdom 单例环境——**happy-dom v20 + GlobalRegistrator 的 window 绑定类与模块基类品牌割裂(Symbol.hasInstance)，dispatchEvent 不可用**，组件测试弃用 happy-dom；jsdom 全局拷贝保留 native fetch/AbortSignal/定时器(jsdom 计时器在 bun 下递归爆栈)；`src/test-utils/mock-jdm-editor.ts` 以 `mock.module` 桩替换 jdm-editor 全量桶(monaco 在 bun 不可求值)，updateNode 落 store 并通知重渲染
- 测试覆盖(`b41aa6a`+`ca4edbc`)：KeyValueEditor 8 用例(结构化/原始模式、增删改、解析失败回退)、HttpRequestTab+画布卡 14 用例(请求行增删选、URL/输出键持久化、方法徽章、高级 tab 超时重试、basic/raw 认证、模拟响应三态、GET 忽略 body)、QueryListTab+画布卡 9 用例、摘要卡片 5 用例(参数对齐/回退/无参/输出/编辑入口)，**合计 38 用例**；radix Tabs 需 mousedown+click 激活(经验记录)
- 主仓 Storybook(`2ccbe9f`)：@storybook/react-vite 8.6.12 与子模块对齐；`.storybook/` viteFinal 别名(@gorules/jdm-editor→子模块 src)+staticDirs 指向 static/monaco-editor@0.52.2；stories：KeyValueEditor(结构化/原始)、**DecisionGraph 嵌入示范**(真实 customNodes 注册 http_request+query_list，宿主嵌入形态可视化)；`bun run build:storybook` 本地构建通过(3 stories 入索引)
- CI(`c71a25f`)：codequality job 加 `bun run test:components`
- 门禁：lint 0 errors、typecheck×2 绿、主仓 174 + 组件 38 + apps 67 pass、`bun run build` + `build:storybook` ✓

**最新变更(2026-08-27，第十五批：部署收尾)：**
- Rust 遗留清除：删 `backend/`(Cargo.toml + main.rs)、根 `Cargo.toml`/`Cargo.lock`、`pnpm-lock.yaml`、`.gitignore` 的 `/target`；CI 移除 rust-codequality job；`apps/editor` 定位为唯一后端
- 文档清理：README backend 章节(bun/Hono)、docs/02 架构图/技术栈/§4.1/§6.2 双后端→单后端、docs/04 工具链/后端启动/Docker 指引去 Rust；docs/03 §5.2/§5.3 更新
- Dockerfile 重写(`oven/bun` 多阶段)：builder 层缓存安装 → `bun run build` → runner 复制 node_modules + apps + jdm-editor + `static/→apps/editor/public`(serveStatic 目录)，VOLUME 挂载 graphs/lists；`.dockerignore` 排除 node_modules/static/运行时数据目录
- CI 真门禁(`validate.yml`)：去全部 `continue-on-error`；codequality job 加主仓 test + apps test(`bun test apps/zen-rule apps/editor`)；新增 build job；checkout `submodules: recursive`(workspace 含 jdm-editor/packages/*)；push 触发 master **+ zrule**
- 新增 `docs/16-deployment-plan.md`：第十五批范围 + 已知问题 backlog(request 节点 Schema 保存丢失)
- 门禁：lint 0 errors、typecheck/apps 绿、主仓 test 174 pass、apps 67 pass、podman 本地 `docker build` 验证通过

**最新变更(2026-08-27，第十四批方向A：版本历史子面板 UI)：**
- 纯逻辑(`5bbc289`)：`src/lib/graph-persistence.ts` 新增 `listRemoteVersions(adapter,id)`——有 `listVersions` 时透传、否则返回 `[]`(宿主无版本能力则不渲染历史面板)；`loadFromRemote` 已支持 `{revision}` 透传；单测 +3(透传/无实现→[]/load revision 透传)，本套件 9 pass
- 页面 UI(`e79d179`)：打开宿主图后顶栏出现 "Versions" 下拉(仅当 `persistence?.listVersions` 且 `remoteSource` 已设)——打开时 `listRemoteVersions(id)` 列版本、当前加载版本禁用、选中某版 AlertDialog 确认后 `openRemoteGraph(id,revision)` 加载历史，并把 `remoteSource.revision` 记为保存的 `baseRevision` 乐观锁；复用现有 DropdownMenu/AlertDialog 无新 UI 依赖
- 保存语义：打开历史版本后保存以该版本为 baseRevision，head 若已更新→CONFLICT 提示刷新(安全默认，防覆盖)
- 文档：docs/15 §5 状态翻转【版本历史面板已实施】、页头部状态、docs/03 changelog；闭合第十三批唯一开放项
- 门禁：lint 0 errors、typecheck/apps 绿、主仓 test 170 pass、apps 67 pass、build 待跑

**最新变更(2026-08-27，第十三批方向A：把 persistence 接入 shell 与页面)：**
- Shell context 暴露 `persistence?`(`d529c03`)：`EditorShellProvider` 读取 options.persistence 并随 useEditorShell 转发；页面据此在「宿主存储 / 浏览器本地文件」间分支
- 页面接线(`a5dbb0e`)：注入持久化后 Open 菜单新增 "Graph library" 子菜单(`adapter.list()` + `adapter.load(id)`)；Save/Save-as 走宿主——新建由 adapter.save 分配 id，已打开图 upsert 带 `baseRevision` 乐观锁，冲突(lib 返回 `{kind:'conflict'}`)提示「被他人修改，刷新后再存」；未注入时浏览器 File System Access API / 下载行为完全不变；handleNew 重置 remote 来源为本地
- 纯逻辑抽取 `src/lib/graph-persistence.ts`：`saveToRemote`/`loadFromRemote`(从 `shell/persistence` 直连导入避免 monaco 桶，bun 可测)、`GraphLike`/`RemoteSaveResult` 类型
- 单测 +6(`src/lib/__tests__/graph-persistence.test.ts`)：新建不加 baseRevision、upsert 传 baseRevision、CONFLICT 吞掉返回 conflict、非 CONFLICT 原样抛出、load 解包 content、load→null；bun 直测 6 pass
- 文档：docs/15 §5 行为分支表按实际代码路径更新、页头部状态翻为「第十三批已接线」；docs/03 changelog
- 门禁：typecheck/apps 绿、lint 0 errors、bun 用例 6 pass(新增)；版本历史子面板 UI 剩开放项(契约/参考实现已具备)

**最新变更(2026-08-26，第十二批：实施 Graph Persistence 参考实现)：**
- 存储层 `apps/editor/src/graphs-store.ts`(`5576820`)：`GRAPHS_DIR` 布局镜像名单(shared + users/{owner})；head `{id}.json` + 历史版本 `{id}.v{N}.json`(revision 单调 v1→v2…)；owner 由会话注入、PUT 保留原 owner(共享图编辑后仍共享)、他人私有一律 404 防探测；`saveGraph` 支持 `baseRevision` 乐观锁(不匹配抛 CONFLICT)
- `/api/graphs` 六端点(`GET 列表/detail(?revision)/POST 新建/PUT 更新/DELETE/versions`)全部经 `resolveExecContext` 取 actor；409 返回结构体 `{error:{code:'CONFLICT',message}}`
- HTTP 适配器 `src/shell/graphs-http-adapter.ts`(`6c3a5bc`)：`createGraphsHttpAdapter(baseUrl)` 将端点封装为 `GraphPersistenceAdapter`(404→load null/delete false、409→GraphPersistenceError CONFLICT)；shell 桶导出
- 集成用例 +6(apps/editor 测试 21→27)：owner 注入落盘 users/{owner}/、他人私有 404 与列表隐藏、版本递增 v1→v3 与历史读、乐观锁 409、共享图保留 owner、删除清历史版本文件
- 文档：docs/15 状态翻转为【已实施】(§6 布局/端点/适配器/用例)；
- 门禁：typecheck/apps 绿、apps/editor 27 pass；主仓 155 维持；lint/build 正常

**最新变更(2026-08-26，第十一批：Graph Persistence 接口设计提案)：**
- 新增 `src/shell/persistence.ts`(`f3b0d87`)：定义 `GraphRecordMeta`(id/name/description/owner/tags/extensions/revision/timestamps) / `GraphRecord extends Meta {content}` / `GraphPersistenceAdapter`(list?/load/save/delete?/listVersions?) / `GraphPersistenceError`(NOT_FOUND/CONFLICT/FORBIDDEN)；`load` 返回 null(404 语义防探测)、`save` 支持 `baseRevision` 乐观锁、`extensions` 为图+配置打包预留字段；`EditorShellOptions` 新增 `persistence?`(未注入时 shell 回退浏览器 File System Access API)
- 新增 `docs/15-persistence-interface-proposal.md`：设计原则(宿主管存储·宿主管身份·404 防探测·最小接入) / 契约逐项说明 / Shell 行为分支(有 persistence→打开另存为版本历史面板走宿主；无→现状本地文件) / 服务端参考路线(`/api/graphs`+`GRAPHS_DIR`，owner 语义同名单，待实施) / 并发策略(revision 单调+baseRevision 乐观锁+last-write-wins 默认) / 安全红线 / 五个开放问题(含已拍板的 Rust 遗留删除决策)
- 测试/lint/typecheck/build 无变化(纯类型+文档增量)；主仓 155 pass 维持

**最新变更(2026-08-25，第十批：库化第二步 —— EditorShell Provider + 残余解耦)：**
- EditorShell Provider 第一版(`e0c3a40`)：新建 `src/shell/`——`EditorShellOptions{schemaSource, authAdapter, simulate}` 三注入点 + `EditorShellProvider`/`useEditorShell` Context；默认 simulate 从 decision-simple 抽出为 `createDefaultSimulate`(axios 错误映射为 Simulation 信封+errorMessage，行为零变)；decision-simple 改走 shell(506→约 470 行)，页面级状态(graph 值/文件对话框)保留在页
- Provider 渲染测试因 jdm-editor 全量桶(monaco)在 bun 下不可渲染而调整为针对 `createDefaultSimulate` 的 Bun.serve 集成用例(+3：成功信封 snapshot 透传/失败不抛出返回 errorMessage/网络不可达降级)；Provider 薄胶水由 tsc 与页面实际使用覆盖
- 残余解耦(`11c6c3d`)：`useCustomNodes` 选项扩展 `{extraNodes?, excludeDemoNodes?}`(组合逻辑抽 `composeBaseNodes`,默认行为不变)；localStorage 键命名空间化——`src/lib/storage-key.ts`(`jdm:` 前缀+历史键回退读)，迁移 summary-card 开关与主题偏好两处，用户既有状态不丢失；+4 单测
- 文档(`e6fe571` 后续)：新增 `docs/14-auth-integration.md` 宿主鉴权集成指南(npm 嵌入/iframe/网关三模式 + AuthAdapter/ExecCtx 用法 + 五条安全红线)
- 根 devDeps 新增 @testing-library/react@16.3.0(为后续组件测试预留)；测试基线 **148→155 pass**(含子模块 37)；lint 0 错误

**最新变更(2026-08-25，第九批：名单 owner 用户级隔离)：**
- C 项落地(计划存档 docs/14-batch-eight-plan.md，语义经用户拍板：共享名单任意登录用户可写可删、新建默认私有)
- zen-rule(`8360714`)：`NamedList` 增加 `owner?`；存储改双层作用域 Map(''=共享/其余=owner)，**同名跨用户互不覆盖、自有遮蔽共享**；五访问器加可选 `actor`(不传=管理员全可见，既有测试零改动)；`query_list` UDF 经 B 批 ALS 读 `getExecContext()?.userId` 并发安全取 actor；测试 **35→40 pass**
- apps/editor(`eaadb0c`)：名单存储布局升级为 `shared/` + `users/{owner}/` 子目录(存量扁平文件视为共享兼容读取、写回原位更新防重复)；CRUD 全部按会话 actor 过滤——POST 服务端注入 owner(客户端字段被 schema 剥离防伪造)、PUT 保留原 owner、他人私有一律 404 防名字探测；GET 响应形状 `{name,size}[]` 不变前端零改动；测试 **16→21 pass**
- 安全边界：owner 由服务端会话注入不可伪造；无 actor 视角仅限内部直调(引擎/CLI)，API 路径恒有 ExecCtx
- lint 0 错误/17 警告；typecheck×2 绿

**最新变更(2026-08-24，第八批：鉴权适配层 + ExecCtx 执行上下文通道)：**
- 计划先行(`cd7ea65`)：完整方案存档于 docs/14-batch-eight-plan.md；C 项(名单 owner 隔离)仅设计存档、暂缓实施，待单独放行
- A AuthAdapter 抽取(`515c3f7`)：新增 `src/lib/auth/adapter.ts`——`AuthAdapter = () => Promise<AuthUser|null>` 接口 + `createAnonymousAdapter`/`createBetterAuthAdapter` 内置实现(宿主自定义直接传函数)；`user-resolver.ts` 改为薄封装 `createUserResolver(adapter)`，`createBetterAuthResolver` 保留兼容别名；decision-simple 经 useMemo 稳定 resolver 引用(顺带修复每 render 重建导致的 effect 反复触发)；better-auth 从硬依赖降为可选实现；+5 单测
- B ExecCtx 通道(`638105f`)：ALS spike 验证 Bun 下 AsyncLocalStorage 并发隔离 PASS；zen-rule 新增 `exec-context.ts`(`getExecContext`/`runWithExecContext`)并从包入口转出——**禁用实例字段**(ZenRule 单例并发竞态)，UDF 直接 import getter，engine.ts 签名不变；apps/editor 新增 `resolveExecContext`：`TRUST_PROXY_HEADERS=true` 时信任网关 `X-User-Id`/`X-Request-Id`(缺省回退 Mock 用户 mock-user-1)，simulate/decision 两处 evaluate 以 `runWithExecContext` 包裹；+4 zen-rule 用例(含并发交错与 UDF 探针)+3 editor 用例
- 测试基线更新：主仓 **126→136 pass**(+5 auth adapter/+4 exec-context/+3 resolveExecContext... 净增 10)，zen-rule **31→35 pass**，apps/editor **13→16 pass**；lint 0 错误/17 警告
- 安全边界：不信任客户端明文 userId(网关头需显式开启信任开关)；凭证不出编辑器——http_request 出站携带用户 token 明确不做(见 docs/14)

**最新变更(2026-08-24，第七批：生产化打磨 + 质量补全 + 库化第一步)：**
- 定位校准：编辑器以「通用无状态库」为目标(未来作为库发布、可被其他应用引用)，暂缓真实会话/鉴权与规则持久化；本批按此目标做生产化与可复用性改造
- 后端生产化(apps/editor)：新增 env 配置(`PORT`/`CORS_ORIGINS` 白名单，未设则全放行；`LISTS_DIR` 名单目录可覆盖)；hono/cors 中间件接入；simulate/lists/decision 的散落错误响应统一改抛 `HTTPException` 走 onError(响应形状不变)；删除调试端点 `/state`、`/input`、根路由 `files=` 目录列表及 store 内存泄漏日志；服务启动加 `import.meta.main` 守卫并导出 app 供测试
- apps/editor 首个路由单测 `index.test.ts`(13 pass)：openapi/CORS 头/preflight/simulate 信封与 zod 校验/lists CRUD 全链路(临时 LISTS_DIR)/mock session/schema 下发
- 模拟器 hooks 单测(jdm-editor 子模块 `44102b4`)：use-simulator-request-binding/use-request-example-persistence/use-simulator-request-editor 三 hooks 全覆盖，子模块测试基线 **21→37 pass**；引入 happy-dom GlobalRegistrator(bunfig preload)并在注册后还原 fetch/AbortSignal 等原生全局，避免污染真实网络用例
- Storybook：新增 simulator-nodes-panel stories(空态/成功 trace/错误 trace/loading 四场景)，`storybook dev --ci --smoke-test` 通过(`48f1b8a`)
- 库化第一步(主仓 `c50aea4`)：schema 加载拆出轻量模块 `custom-node-schema-source.ts`——`fetchCustomNodeSchema(source)` 支持 URL 字符串或宿主注入加载函数(默认同源 `/api/custom-nodes/schema` 不变，失败回退离线夹具)；`useCustomNodes({ schemaSource })` 可选注入；registry tsx 转出保持既有导入路径兼容；+6 单测
- 测试基线更新：根仓库 `bun test src` 因路径子串过滤连带运行子模块用例，根 bunfig.toml 复用同一 DOM 预加载脚本，基线 **93→126 pass**(含子模块 37)；lint 0 错误/17 警告(均为节点文件 react-refresh 既有类别)

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
