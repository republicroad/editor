# 项目状态

> 快照时间：2026-08-09

---

## 1. 当前环境

### 1.1 分支状态

| 仓库               | 当前分支 | 基于分支 | 说明                                              |
| ------------------ | -------- | -------- | ------------------------------------------------- |
| editor(主项目)     | `reui`   | `zrule`  | shadcn/ReUI 统一技术栈 + appshell 独立包开发分支  |
| jdm-editor(子模块) | `reui`   | `master` | 内核重构分支（ReactFlow 12 + shadcn/ReUI，去 antd）|

### 1.2 版本信息

| 组件                | 版本    | 说明          |
| ------------------- | ------- | ------------- |
| @gorules/editor     | v1.16.1 | 主项目版本    |
| @gorules/jdm-editor | v1.52.0 | 组件库版本    |
| zen-engine          | 0.53    | Rust 决策引擎 |
| zen-engine-wasm     | ^0.23.1 | WASM 引擎绑定 |

---

## 2. 版本历史里程碑

| 版本    | 日期       | 关键变更                |
| ------- | ---------- | ----------------------- |
| v1.0.0  | 2023-12-04 | 初始发布                |
| v1.1.0  | 2023-12-12 | 更新 zen-engine         |
| v1.2.0  | 2024-01-31 | 升级 gorules editor     |
| v1.3.0  | 2024-01-31 | 添加暗色模式            |
| v1.4.0  | 2024-02-06 | 可选的宽松 CORS         |
| v1.5.0  | 2024-05-17 | 更新 jdm-editor         |
| v1.6.0  | 2024-07-05 | 升级 zen v0.23          |
| v1.7.0  | 2024-07-17 | 升级 zen engine v0.24.x |
| v1.8.0  | 2024-08-07 | 升级 gorules deps       |
| v1.9.0  | 2024-08-28 | 更新 editor             |
| v1.10.0 | 2024-09-23 | 添加 Intellisense       |
| v1.11.0 | 2024-10-25 | 升级 zen 0.33.0         |
| v1.12.0 | 2024-12-07 | 更新 packages           |
| v1.13.0 | 2025-04-15 | 升级依赖                |
| v1.14.0 | 2025-05-15 | 更新 zen                |
| v1.15.0 | 2025-05-23 | 更新 zen                |
| v1.16.0 | 2026-01-22 | 更新引擎和编辑器        |
| v1.16.1 | 2026-02-13 | 降级到 React 18         |

---

## 3. 依赖快照

### 3.1 前端核心依赖

| 依赖                            | 版本    | 状态     |
| ------------------------------- | ------- | -------- |
| react / react-dom               | ^18.3.1 | 稳定     |
| react-router / react-router-dom | ^7.13.0 | 稳定     |
| reactflow                       | 11.11.4 | 锁定版本 |
| zustand                         | ^4.5.5  | 稳定     |
| immer                           | 10.1.1  | 锁定版本 |
| @codemirror/\*                  | ^6.x    | 稳定     |
| @monaco-editor/react            | ^4.7.0  | 稳定     |
| graphology                      | ^0.26.0 | 稳定     |
| graphology-dag                  | ^0.4.1  | 稳定     |
| axios                           | ^1.13.5 | 稳定     |
| zod                             | ^4.3.6  | 稳定     |

### 3.2 开发依赖

| 依赖                     | 版本    | 状态                             |
| ------------------------ | ------- | -------------------------------- |
| typescript               | ^5.9.3  | 最新                             |
| vite                     | ^7.3.1  | 最新                             |
| @vitejs/plugin-react-swc | ^4.2.3  | 稳定                             |
| eslint                   | ^10.0.0 | 最新                             |
| prettier                 | ^3.8.1  | 稳定                             |
| semantic-release         | ^25.0.3 | 稳定                             |
| monaco-editor            | 0.52.2  | 锁定版本(Monaco 本地化加载)      |
| vite-plugin-static-copy  | 4.1.1   | 稳定(构建期拷贝 Monaco 静态资源) |

### 3.3 后端依赖

| 依赖       | 版本 | 状态 |
| ---------- | ---- | ---- |
| zen-engine | 0.53 | 最新 |
| axum       | 0.7  | 稳定 |
| tokio      | 1    | 稳定 |
| tower-http | 0.5  | 稳定 |

---

## 4. Git 分支结构

### 4.1 主项目分支

| 分支                 | 说明                        | 状态                   |
| -------------------- | --------------------------- | ---------------------- |
| `master`             | 上游同步分支                | 活跃                   |
| `standalone`         | 开源发布分支                | 活跃                   |
| `zrule`              | 前后端 TS monorepo 开发分支 | **当前**               |
| `opencode`           | 定制化开发分支              | 历史(功能已并入 zrule) |
| `mono_v1`            | Monorepo 实验               | 历史                   |
| `workspace_v1/v2/v3` | 工作空间实验                | 历史                   |

### 4.2 jdm-editor 分支

| 分支         | 说明                            | 状态                   |
| ------------ | ------------------------------- | ---------------------- |
| `master`     | 上游发布分支                    | 活跃                   |
| `zrule`      | 外部化改造 + 前后端 TS 开发分支 | **当前**               |
| `standalone` | 开源发布分支                    | 活跃                   |
| `opencode`   | 定制化开发分支                  | 历史(功能已并入 zrule) |

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
- [x] 第十七批(应用层去 antd 收尾)：`theme.provider.tsx` 冗余 antd ConfigProvider 删除(JdmConfigProvider 已内置同款主题算法)；根依赖移除 `antd`/`@ant-design/icons`——主仓 src/ 零 antd 引用，antd 仅存于 jdm-editor 核心库
- [x] lezer-zen 源码移除并迁移为外部 npm 依赖(子模块 `e21bd87`)
- [x] zen-engine-wasm 源码移除并迁移为外部 npm 依赖(子模块 `e21bd87`)
- [~] 完善单元测试覆盖(bun test 基线：主仓 **174 pass**；component-tests **38 pass**(自定义节点组件交互，jsdom+RTL)；apps(zen-rule+editor) **67 pass**；子模块模拟器面板组件级交互待补)
- [x] 第十六批(库化质量)：主仓组件交互测试基建(jsdom 单例环境 + jdm-editor 全量桶 mock)+ KV 编辑器/HTTP 请求节点(Tab+画布卡)/查询名单节点(Tab+画布卡)/摘要卡片 38 用例；主仓 Storybook 配置(KV 编辑器 + DecisionGraph 嵌入示范 stories，`build:storybook` 本地验证)；CI 加 test:components；已知问题 request 节点 Schema 保存丢失维持 backlog(docs/16 §4)
- [x] 补充 Storybook 组件文档(simulator-request-panel + simulator-nodes-panel stories，`--smoke-test`/`--ci --smoke-test` 通过；主仓 Storybook 已于第十六批配置：src/stories/ 下 KeyValueEditor 与 DecisionGraph 嵌入示范)
- [x] 修复 vite build 预存在问题(vite-plugin-dts 加载失败；子模块构建已正常产出 dist/)
- [x] CI 迁移提交(`.github/workflows/validate.yml` pnpm→bun，见 `c0f8d89`)
- [~] `/api/auth/get-session` 由 Mock 用户升级为真实会话(better-auth 服务端 + 数据库)——**暂缓**：编辑器定位为通用无状态库，鉴权由宿主应用负责(2026-08-24 决策)
- [x] 第八批：A AuthAdapter 抽取(`9e13933`) / B ExecCtx 执行上下文通道(`1f31d9c`)——详见 docs/14-batch-eight-plan.md；C 名单 owner 隔离已于第九批实施(`f63e6c5`+`4bd678f`)
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

### 7.3 zrule/reui 分支变更摘要
**最新变更(2026-09-03，第四十二批：appshell 适配 jdm-editor reui 内核——改名 + 类型桥 + spec 组合器)：**

- **子模块换轨**：`.gitmodules` branch `zrule`→`reui`（b922227）；指针两连跳至 reui tip（0c1ca71→46733003、31cadcf→16bcd05）。内核 reui 分支 = `@republicroad/jdm-editor` v0.2.x 重构（ReactFlow 12、shadcn/ReUI 栈去 antd、seeds 主题、`.grl-root` 作用域注入、monaco 转 peer）
- **全局改名**：`@gorules/jdm-editor`→`@republicroad/jdm-editor`（21 文件：src 导入族 + package.json workspace 依赖 + 根 tsconfig + .storybook 别名 + 组件测试 mock 键）；`bun install` 重链接 + 清 `.vite` 缓存
- **类型桥（新架构）**：内核 reui 用自身 `@/*` 别名（与宿主 `@/*` 真实撞车于 button/label/lib-utils）且 devDep @types/react 19（宿主 18）——bun overrides 不穿透 workspace 成员，遂新建 `tsconfig.kernel.json`：以内核 tsconfig 为基 emitDeclarationOnly 生成 `tmp/kernel-types/`，根 paths 指向该 d.ts——内核源码退出宿主编译程序，冲突双消解；`typecheck`/`build` 脚本链式再生类型桥（零陈旧窗口）；内核侧 react 类型经 paths 强制对齐根 18
- **内核一行修复(16bcd05)**：`expression-item` 的 `useRef<HTMLDivElement|null>`（18/19 双兼容可变 ref；内核 peer 声明 `>=18` 的类型兑现）
- **spec 组合器**：reui 内核 `createJdmNode` 入参收窄为 BaseNode（无 renderTab/calculateDiff/inferTypes）——registry 新增 `createSpecNode`（createJdmNode 结果 + spec 级字段附加），6 个专属节点文件机械切换；`UserResolver` 内核 barrel 未导出，按 0.2.x host 契约在 `lib/user-resolver.ts` 本地镜像
- **测试基建跟进**：bunfig 移除死 preload（zrule 的 setupBunDom 不复存在）；`test` 脚本加 `--path-ignore-patterns **/jdm-editor/**`（内核 31 个测试文件已 vitest 化）；storage-key 测试自备 Storage 桩；setup-jsdom 补 rAF 兜底（happy-dom preload 移除后 bun 无此全局）
- **CI**：validate.yml push 分支加 `reui`；jdm-editor 测试步骤改 `bun run test`（vitest）
- 门禁：typecheck:kernel/d.ts 桥、typecheck、typecheck:apps、lint 0 err/0 warn、主仓 147/组件 40/apps 72 全 pass、zen-rule 冒烟 exit 0、sync:schema:check 绿、build ✓（主 chunk 7.38MB，低于 zrule 源码直通基线 8.44MB——antd 移除红利）、build:storybook ✓（本机偶发 esbuild OOM 一次，重试通过）；**未提交，待安排**

**最新变更(2026-09-01，第三十九~四十一批：库化收口——CI 库测试门禁 + 独立构建验证 + 文档)：**
- **CI 库测试门禁(f9872f5)**：validate.yml 增 `Test (jdm-editor)` 步骤(working-directory 指向包目录 + bun test src)——库 58 测试首次纳入 CI 门禁
- **barrel 导出补全(9347c43)**：`resolveFunctionScope`/`healExpressionsForScope`/`buildDefaultFunctionExpression`/`LEGACY_CUSTOM_FUNCTION_KIND`/`FunctionScope` 类型 + `useSimulatorAutoSync`/`AUTO_SYNC_DEBOUNCE_MS`(库级 API 面完成)；hook 声明转 function 形式
- **独立构建复现验证(docs/06 §3.6)**：bun install + build 多次复现(42~58s)、同形式测试 58/58——独立链路稳定；**主仓消费体积记录**(源码直通：JS 8.44MB/87 文件，CSS 273KB；dist 对比方法附注)
- **主仓推送**：a795423..d613cd9 已推(zrule)；子模块远端此前已同步(含 force-with-lease 处理 35c9c39 重写)——CI 首跑待 GitHub Actions 页确认，红了即治理
- 门禁：lint 0 err/0 warn、typecheck×2、全测试套件绿、build ✓；docs/03 本条


**最新变更(2026-09-01，第四十批：源码直通消费链文档化 + 最佳实践独立文档)：**

- **docs/06 新增第 7 章「源码直通消费链」**：三端解析表(vite/bun/tsc)、关键配置清单(paths/tsconfigPaths/allowImportingTsExtensions/wasm/monaco/dedupe)、样式链(src/index.ts 自引 scss，主仓无需 dist/style.css)、排障表(.vite 缓存/TS5097/双 React)、dist 定位(仅外部消费方兜底)
- **新增 `docs/bestpractice/monorepo-source-passthrough.md`**：monorepo 源码直通通用最佳实践(三层解析链/配置清单/双向同步与防回灌/何时不该直通/排障速查/本仓库映射)
- **重要修正**：根 tsconfig `paths` + `vite-tsconfig-paths` 早已实现 dev/build 源码直通——此前「主仓解析 dist 需先 build 子模块」的判断不准确；跨包未生效的真实原因是 vite 预构建缓存/HMR 粒度(整页刷新)，排障为删 `node_modules/.vite`
- docs/04 §3.2 加交叉引用(docs/06 §7 + bestpractice 文档)；无代码改动

**最新变更(2026-09-01，第三十九批：跨平台开发配置补齐——VS Code/Git/ESLint 最佳实践)：**

- **新增 3 个配置文件**：`.vscode/settings.json`(合并既有代理配置；files.eol=lf/formatOnSave/eslint fixAll)、`.vscode/extensions.json`(推荐 ESLint/Prettier/EditorConfig)、`.editorconfig`(UTF-8 无 BOM/LF/2 空格缩进；md 保留尾随空格；cmd/bat/ps1 走 CRLF)
- **docs/04 新增 §11「跨平台开发配置与最佳实践」**：配置文件一览、日常守则(禁 BOM/不手切行尾/prettier 自检)、常见故障排查表(Insert␍/Delete␍/vite 缓存/CRLF 警告语义)、ESLint 作用域豁免先例
- 背景：`.prettierrc` 已切 `endOfLine: lf` 与 `.gitattributes` 同向；VS Code 报 `Insert ␍` 为编辑器服务旧配置缓存(Restart ESLint Server/Reload Window 即愈)
- 门禁：lint 0 errors/0 warnings、typecheck 绿、vscode json 校验通过；**未提交，待安排**

**最新变更(2026-09-01，第三十八批：自动同步逻辑抽 hook + 单测 + locale 死键清理)：**

- **use-simulator-auto-sync.ts 抽取**：panel 内联的防抖(700ms 静默)/签名守卫/flush 逻辑抽为独立 hook(参数化 debounceMs)；单测 5 用例(去抖单发/连续键入重置/外部推送同签名跳过/flush 立即持久化/disabled 全静默)
- **locale 死键清理**：`requestSaveDataSource`(按钮已删)自 en/zh 移除并修复同行挤键畸形；`requestDataSourceSaved`/`requestSelectDataSourceFirst` 保留(仍被 persist 引用)
- **docs/06 同步**：simulator 结构块+hook 表补 `use-simulator-auto-sync.ts`
- 门禁：子模块 typecheck/53 测试/build ✓、zen-rule 45 pass、apps 72 pass、lint 0 err/0 warn；**未提交，待安排**

**最新变更(2026-09-01，第三十七批：Simulator 用例数据自动同步——移除手动保存按钮)：**

- **保存按钮移除**：simulator toolbar 删除「保存用例数据」按钮(onSave/SaveOutlined/requestSaveDataSource)
- **自动同步(simulator → schema)**：编辑器变更 700ms 防抖后自动持久化至 input 节点 schema.examples——静默(无 toast/错误弹窗，输入中 JSON 未完成静默跳过)、类型冲突**不阻断**(经 normalizeRequestExampleDataByDefinitions 归一后照存)、skip-unchanged 防重；triggeredBy 扩展 'auto-sync'
- **反向同步(schema → simulator)**：request 子tab 编辑 schema.examples 后 700ms 内推送至 simulator 编辑器(签名比对守卫防回灌)——双向保持一致
- **源切换冲刷**：切换数据源前先冲刷未落盘编辑(旧 binding 立即持久化，防串源)
- 测试：persistence 增 auto-sync 静默用例(53 pass)；typecheck/build ✓

**最新变更(2026-09-01，第三十六批：current_date UI 迭代——输出 key 可编辑 + 仿真取值修正)：**

- **修复 [object Object]**：画布卡/Tab 此前直接 String(trace.output)——改为按 expressions[0].key 从输出对象取值
- **输出 key 可由客户输入**：Tab 增「输出 key」Input(font-mono，blur/Enter 提交)——`updateNode` draft 原位改写 `expressions[0].key`(**locked 保留**，不整写 config)；画布卡同步显示 key 标签+对应值
- **专属 UI 范式确认**：Tab 内 draft 原位变更 + return draft(DraftUpdateCallback 契约)；测试 7 用例(key 提交保留 locked/按 key 取值/角标有无/占位)
- 门禁：组件 40 pass、typecheck×2 绿、lint 0 errors/0 warnings；**未提交，待安排**

**最新变更(2026-09-01，第三十五批：debugui 专属 UI 示范——current_date spec)：**

- **首个「专属 UI 节点」最小模板**：新建 `src/components/custom-node/current-date-node.tsx`(kind=`current_date`，ns=debugui)——renderTab 只读信息卡(说明+仿真日期大字回显/空态)、renderNode 画布卡(Badge kind+日期值+动效锁角标)、inferTypes string+passThrough、generateNode 播种 `locked: true`
- **接管注册**：`overriddenFunctions` + `current_date`(过滤 debugui singleton 生成的同 kind plan)；侧边栏 debugui 组显示「当前日期」专用节点
- **测试**：`component-tests/.../current-date-node.test.tsx` 6 用例(Tab 空态/仿真回显、画布卡 kind/日期/编辑、角标 locked 有无、未仿真占位)；修复 CurrentDateTab 缺 export 导致的 element undefined
- 门禁：组件 39 pass(33+6)、typecheck×2 绿；**未提交，待安排**

**最新变更(2026-09-01，第三十四批：CI 夹具门禁 + lint 告警清零 + multi2.json 归位)：**

- **CI 夹具门禁挂载**：validate.yml codequality job 增 `bun run sync:schema:check`——ext 变更未刷新夹具时 CI 直接失败
- **lint 告警清零**：eslint 新增作用域(custom-node/** + useCustomNodes + custom-node-registry + editor-shell.context + ui/** + reui/\*\* + theme.provider)关停 `react-refresh/only-export-components`——spec/hook/context 文件导出节点规格与常量属既定模式(与 reui vendored 先例一致)；18→0 warnings
- **multi2.json 归位**：`apps/editor/src/multi2.json`(决策图数据)→`apps/editor/graphs/`
- 门禁：lint 0 errors/0 warnings、typecheck×2 绿、主仓 199/apps 72/组件 33 pass、smoke exit 0；**未提交，待安排**

**最新变更(2026-09-01，第三十三批：移除域裁决落档)：**

- **aho-corasick(lexicon 词表匹配)**：未来按需重新实现(backlog 已记录，文件名建议 `aho-corasick.ts`)
- **legacy_http 不重建**：`http_call`/`http_call_with_headers` 已被 `http_request`(http 域专属节点)替代；迁移映射同步——旧 `http`/`legacy_http` 容器节点不迁移，落入「配置不符合规范」占位卡(数据无损)
- 文档：docs/13 §8.3 重建清单扩充+迁移映射修订；无代码改动(两域文件已于第二十九批清库移除)

> 历史注记（2026-09-01）：singleton 档与 setNamespaceType 已于第二十九批（type 档位移除）整体移除——下文较早批次条目中的 singleton/setNamespaceType 相关描述均为**当时机制的记录**，现状以第二十九批起条目与 docs/13 §7.2 为准。
> **最新变更(2026-09-01，第三十二批：放弃撞库依赖函数重建任务)：**

- **裁决**：`custom_list_query`/`rate_1h`/`group_distinct_1h`/`ip_location` 的重建任务**放弃**（第三十二批规划撤销）——未来按需重新实现（backlog 已记录，含实现路径备注：queryRoster 复用/内存窗口计数/geo 数据集）
- **影响**：撞库攻击防御.json 验收降级——保留加载/渲染/编辑（legacy 表格完好），仿真暂缓（UDF not found 属预期）；注册表维持 7 ns/8 工具不变
- 文档：docs/13 §7.3 验收降级说明 + §8.3 backlog 条目；docs/03 本条；无代码改动

**最新变更(2026-09-01，第三十一批：全仓行尾 LF 归一)：**

- **行尾基线切换**：`.gitattributes` `* text=auto eol=lf`(仓库+工作区双端 LF) + `.prettierrc` `endOfLine: 'lf'`(原 crlf)；新增 `.prettierignore`(jdm-editor/storybook-static/tmp/public/static/dist/graphs/rosters/graph 运行时与数据文件除外)；`git add --renormalize .` 一次性归一(42 文件)
- 此后 eslint(prettier) 与 gitattributes 不再互搏；BOM 禁令(utf8-no-bom)不变

**最新变更(2026-09-01，第三十批：ext/ 更名 contrib/——与上游 python zen-rule 对齐)：**

- **目录更名**：`apps/zen-rule/src/ext/`→`contrib/`（git mv，与上游 python zen-rule 项目结构对齐）；engine.ts 挂载路径同步；createExtRegister/registerUdf API 不变
- **注册表**：15→**7 ns/8 工具**(承接第二十九批清库终态)，夹具同步+check 全绿；docs/13 §1/§2/§8 全部 ext 引用改 contrib
- 门禁：zen-rule 45 pass、typecheck:apps 绿、lint 0 errors(18 warnings)、smoke exit 0、sync:schema:check 全绿；**未提交，待安排**

**最新变更(2026-09-01，第二十八批：ext 清库——移除 stub/legacy 域 + 平台硬化)：**

- **平台重新设计裁决**：ext/ 移除 8 个 stub/legacy 域(legacy_http/legacy_roster/aho-corasick/counter/ip/notification/phone/shared_counter)——基础 UI 模式已全覆盖，节点按需添加，**历史图整体由迁移工具处理**(不再逐域兼容)；engine 挂载同步清理
- **注册表收缩**：15→**7 ns/8 工具**——crypto/debugui/json_path/template:singleton(1，专属 UI override)+roster:singleton(1，专属 UI override)+debug:namespace(2，inout/func_without_args 容器)+http:namespace(1，override)；夹具同步+`sync:schema:check` 全绿
- **平台硬化①——同名碰撞警告**：`UDFManager.warnNamespaceCollision`(注册时三方向：函数名=自身 ns[singleton 档豁免]/函数名=现有 ns/ns=现有函数)；单测 4 用例(`register.test.ts`)；实测命中 roster/lexicon 两个真实自撞→两文件补 `setNamespaceType(singleton)` 消音并对齐语义
- **平台硬化②——夹具漂移门禁**：`sync:schema` 增 `--check` 模式(不落盘、漂移非零退出)+`bun run sync:schema:check`；可入 CI
- **roster 域档位**：namespace→**singleton**(单函数+专属 UI，与 crypto 对齐；同步消除同名碰撞警告)
- 门禁：zen-rule 45 pass(+4)、typecheck×2 绿、lint 0 errors(20 warnings)、registry dump 7 ns 确认；**未提交，待安排**
  **最新变更(2026-09-01，第二十九批：type 档位移除——两档模型 + 导入容错)：**
- **模型收敛(docs/13 §7.2 重写)**：singleton/namespace 两档 → **容器 + 专属 UI 节点/legacy 两档**；schema 下发 `type` 恒 `'namespace'`(契约字段保留供未来场景)；registry 全 ns 生成集合容器(kind=ns 名)，无 UI 函数一律落容器(1 行容器 ≈ 锁定节点，行为等价)
- **generic locked UI 移除**：`resolveFunctionScope` 删 locked 分支与 singleton 排除(`mode` = scoped/legacy/free)；`FunctionScopeMode` 收窄；`healExpressionsForScope` 仅 scoped 治愈；expression-item/list 删 chip/金色 Tag/isLocked 逻辑；scss 删 `.function-lock-chip`；locales 删 `locked` key；scope 单测重写
- **导入容错(graph.tsx)**：未知 kind customNode 卡从「红色 node not found」改为「配置不符合规范」琥珀警示卡(kind 可见、数据无损往返、Tab 仍可开通用表格)——对齐 n8n/Node-RED unknown-node placeholder 实践；locales 增 `nodeSpecMismatch`
- **摘要卡退役**：`CustomNodeSummaryCard` + `summaryCard`/`summaryCustomNodes` API + 5 个摘要卡测试删除(type 移除后无 plan.tool，非 override 函数摘要视图回落默认卡片)
- **ext 收敛终态**：7 域——crypto/json_path/template/roster/debugui:singleton(1) + debug/http:namespace；docs/13 §8.1 重写
- 门禁：zen-rule 45 pass、apps 72 pass、组件 33 pass、子模块 typecheck/52 测试/build ✓、主仓 typecheck×2/lint 0 err/build ✓、registry 9 pass、smoke exit 0、`sync:schema:check` 全绿；**未提交，待安排**

**最新变更(2026-09-01，第二十七批：sum 假设修正 + 旧图 debug 迁移)：**

- **事实修正(docs/13 §7.3)**：3 个旧图(custom\*.json/custom_fullnode.json)的 kind `sum` 为前约定时代节点标签，表达式**实调 `inout`/`foo`**，与求和函数无关
- **debugui 增加 `current_date`**(singleton 档，服务器本地日期 YYYY-MM-DD)+ 测试；随后按裁决**移除 sum 实现与测试**(旧图 kind sum 与求和无关，sum 无存在必要)
- **旧图迁移**：custom.json / custom_double_semicolon.json 的 customNode kind `sum`→`debug`(实调 inout ∈ debug 集合 → scoped 解析表达式完好)；custom_fullnode.json 的 kind `sum`→`UDF`(实调 foo 未注册——UDF legacy 档**不治愈**，foo 表达式原样保留，优于 debug 档会改写为 inout)；夹具同步(15 ns/48 工具)
- 门禁：zen-rule 41 pass、typecheck:apps 绿、lint 0 errors(20 warnings)；**未提交，待安排**

**最新变更(2026-09-01，第二十六批：主仓样式规范 shadcn + ReUI)：**

- **样式规范定案**：主仓 UI 样式统一 **shadcn(Tailwind v4) + ReUI registry(@reui)**，禁 antd(仅存于 jdm-editor 子模块)；工具链实测全通(components.json @reui registry + `bunx shadcn add` + registry search 593 项)
- **ReUI Motion Icon 首装**：`src/reui/icons/animated/duotone/lock.tsx`(REUI_LICENSE_KEY 经 .env.local 注入单次命令安装；注意 CLI 不自动读 .env.local)
- **config.locked 消费点落地**：共享 `LockedCornerBadge` 组件(ReUI 动效 lock 图标，画布卡右上角、title=专属 UI 节点)；5 个专用节点画布卡 + CustomNodeSummaryCard 接入(`config?.locked` 条件渲染，GraphNode 传 `className="relative"`)
- **连带修复**：5 个 Tab 的 persist 路径补 `locked: config?.locked`(原整体覆写 config 会抹除标记)
- **首个 Badge 应用**：新增 `src/components/ui/badge.tsx`(shadcn Badge)；6 个画布卡手写 `css.kind` span → `<Badge variant="outline" font-mono>`；summary-card kind 显示修正为裸函数名
- 门禁：组件 38 pass、typecheck×2 绿、lint 0 errors(20 warnings)、build ✓；**未提交，待安排**

**最新变更(2026-09-01，第二十五批：debug 拆域 + 专属 UI 函数独立建文件)：**

- **`ext/debug.ts` 收缩**：仅保留 `inout`/`func_without_args`，且 debug 改为 **namespace 档**(移除 singleton 声明)——侧边栏出现 `debug` 集合容器(2 行锁定调用)
- **专属 UI 函数独立建文件**(文件名即 namespace，均 singleton 档 + setNamespaceType)：`crypto.ts`、`json_path.ts`、`template.ts`(原 debug.ts 内迁移；asRecord/resolveTemplatePath 等助手随域自含)；engine 增挂载；crypto/jsonpath-template 测试 side-effect 同步
- **专用节点 group 对齐 namespace**：crypto→`crypto`、json_path→`json_path`、template→`template`、http_request→`http`
- **注册表**：14 ns/47 工具——`debug:namespace(2)` + `crypto/json_path/template:singleton(1)` + `http(1)` + `legacy_http(2)` + 8 集合域；夹具同步
- 门禁：zen-rule 40 pass、apps 67 pass、typecheck×2 绿、lint 0 errors(19 warnings)；**未提交，待安排**

**最新变更(2026-09-01，第二十四批：contrib→debug 更名 + http_request 拆域)：**

- **http_request 拆域**：从 contrib.ts 拆出至新建 `ext/http.ts`(ns=`http`，文件名即 namespace，helper 全套自含)；contrib 剩 5 函数；测试随迁 `ext/http.test.ts`(mock server 11 用例)
- **contrib→debug**：`ext/contrib.ts`→`ext/debug.ts`(文件名即 namespace，`setNamespaceType('debug','singleton')`)；crypto/jsonpath-template 测试 side-effect 导入同步；4 个专用节点 sidebar group `contrib`→`debug`；registry 测试名同步
- **注册表**：11 ns/47 工具——`debug:singleton(5)` + `http:namespace(1)` + `legacy_http(2)` + 8 stub/集合域；夹具同步
- 门禁：zen-rule 40 pass、typecheck×2 绿、lint 0 errors(19 warnings)、smoke exit 0；**未提交，待安排**

**最新变更(2026-09-01，第二十三批：锁定节点裸 kind + config.locked 数据约定)：**

- **kind 单 token 定案**：锁定节点 kind 放弃 `ns.function` 复合名 → **裸函数名**(UDF 名全局唯一)；kind 恒为单 token ∈ {函数名, ns 名}——5 个专用节点 spec 裸名化(`contrib.crypto`→`crypto`、`contrib.http_request`→`http_request`、`contrib.json_path`→`json_path`、`contrib.template`→`template`、`roster.roster`→`roster`)
- **`config.locked: true` 数据约定**：锁定节点图 JSON config 显式携带 locked(generateNode 播种：singleton config + 5 个专用节点 + stories)；UI 组件解析仍按 kind→宿主 spec；scope 权威仍是 kind→registry 推导；**旧节点缺省=通用锁定表格 UI，零回填**；`CustomNodeConfig.locked?: true` 类型化(zod config 为 z.any 零改动)
- **子模块 resolveFunctionScope 简化**：删 `ns.tool` 历史兼容分支；locked=kind 匹配**任意档**函数名(全局唯一)；scope 单测更新(`contrib.inout`→free、补跨档函数名命中)
- **override 按函数名**：`overriddenKinds`→`overriddenFunctions`(裸名 Set)；`isOverridden` 去 singleton 前置条件(修复 roster namespace 档容器不被过滤→与专用 spec 撞 kind 的隐患)；撞名裁决：roster 域容器由专用节点取代(无通用容器)
- 文档：docs/13 §7.2 表修订+config.locked 约定；README wire 表 5 行 kind 更新；docs/03 本条
- **ext 文件名语义化(用户并行手改收录)**：`http.ts`→`legacy_http.ts`(切 createExtRegister，ns 随文件名=`legacy_http`)、`roster_legacy.ts`→`legacy_roster.ts`(显式 ns `name_list` 保持)；夹具同步(10 ns：http→legacy_http)；graph/http_call_old.json 旧 kind=`http` 需手工改为 `legacy_http`(用户测试图自行处置)
- **http_request 域独立**：`http_request` 从 contrib.ts 拆出至新建 `ext/http.ts`(ns=`http`，文件名即 namespace；含全部 helper 自含)；contrib 剩 5 函数(inout/func_without_args/crypto/json_path/template)，`asRecord` 共享助手在 contrib 内补回(template 用)；测试随迁 `ext/http.test.ts`(mock server + 11 用例)；engine 增挂载；注册表 11 ns/47 工具(contrib:singleton(5)+http:namespace(1))，夹具同步；http_request 被 override(专用节点)故侧边栏无 http 容器
- 门禁：子模块 scope 单测 19 pass、apps 67 pass、组件 38 pass、registry 14 pass、typecheck×2 绿、lint 0 errors(19 warnings)、smoke exit 0；**未提交，待安排**

**最新变更(2026-09-01，第二十二批：query_list→roster 更名 + ext 命名约定机制)：**

- **UDF `query_list` → `roster`**：`ext/risk.ts`→`ext/roster.ts`(文件名=namespace='roster')；仓库图文件零引用(已扫描)，无迁移负担
- **ext 命名约定(docs/13 §8.1)**：**ext 下文件名即 namespace**；`createExtRegister(import.meta.url)` 缺省取文件名，显式 namespace 走全局 `registerUdf(name, ns, schema)`(语义化文件名分支：roster_legacy→name_list、aho-corasick→lexicon)；contrib+6 个同名词文件全部切换绑定式注册
- **kind 级联**：专用节点 `risk.query_list`→`roster.roster`(overriddenKinds/QueryListTab/stories/组件测试/README/main.ts 同步)；wire 值 `['roster', 名单名, 值表达式]`
- **并行手改收录**：`aho-corasick.ts` 函数/域更名 `lexicon`(用户显式指定，保持)
- 门禁：apps 67 pass、组件 38 pass、typecheck×2 绿、夹具刷新(roster ns in/lexicon in/risk out)、lint 0 errors；**未提交，待安排**

**最新变更(2026-09-01，第二十一批：名单概念全链路更名 list→roster)：**

- **红线保持**：UDF 函数名 `query_list`、kind `risk.query_list`、`name_list` 域函数名(custom*list*\*)、实体 `name` 字段、中文文案「名单」均不动——存量图 `value[0]` 位置实参引用零迁移
- **zen-rule**：`lists.ts`→`roster.ts`(`Roster`/`registerRoster`/`getRoster`/`listRosters`/`deleteRoster`/`queryRoster`；查询返回字段 `list`→`roster`)；`ext/risk.ts` 参数键 `listName`→`roster`(funcBindParams 按序绑定，图 JSON 安全)；测试随迁 `roster.test.ts`/`ext/risk.test.ts`
- **API**：`/api/lists`→`/api/rosters`(GET/POST/PUT/DELETE 全族)；schema 名 `RosterSummary/RosterQuery/Roster/RosterUpdate`；持久化 `ROSTERS_DIR`(env 同名更名)+`registerRosterFile/loadRosters/findRosterFile/writeRosterFile`
- **数据/部署**：数据目录 `apps/editor/lists`→`rosters`(种子 json git rename)；Dockerfile VOLUME、`.dockerignore`、README、docs/16 同步
- **前端**：`query-list-node.tsx` fetch `/api/rosters`、`roster` 标识、`RosterOption/useRosterOptions/handleRosterChange`；wire 格式(`['query_list', quoted, value]`)不变
- **夹具**：`sync:schema` 刷新(query_list params=`["roster","value"]`)
- `ext/default.ts` 已移除(default 域 5 函数不在 zen-rule 内置注册)，注册表现 10 ns/47 工具；`ext/name_list.ts`→`ext/roster_legacy.ts`(文件名语义化：老名单/花名册函数 schema 定义；注册名 `name_list` 与函数名 custom*list*\* 不变，存量图零影响)；`ext/lexicon_list.ts`→`ext/aho-corasick.ts`(文件名取实现算法；注册名 `lexicon_list` 不变)
- 门禁：zen-rule+editor 67 pass、组件 38 pass、主仓 214 pass(24 个既有环境性 fail 与基线一致)、typecheck×2 绿、lint 0 errors(19 warnings)、build ✓；**未提交，待安排**
- 收尾：`zen-rule` 根部 5 个图文件(custom*.json/http*.json)归位 `graph/`(tracked 用 git mv；PLAN.md 本就预期该布局)，main.ts 图路径同步；**main.ts 纳入 typecheck**(tsconfig include + 去 rootDir)，修复 4 处 buildContent `unknown`→`object` 潜在类型错误；main.ts `registerList`→`registerRoster` 漏网更名补齐(smoke 抓住)；`sync:schema` 幂等化(产物经 prettier 格式化，消除短数组行尾格式漂移)

**最新变更(2026-08-31，第二十批：zen-rule ext/ 扩展层 + namespace.type 权威下发)：**

- **ext/ 扩展层(扁平，函数实现专属区)**：`contrib.ts`(6 UDF 整体迁入，`setNamespaceType('contrib','singleton')`)、`risk.ts`(query_list 注册迁入，storage 原语留 roster.ts)、8 个 stub 域(counter/http/ip/lexicon_list/name_list/notification/phone/shared_counter，schema 完整、实现抛 not implemented，待补真实实现)；contrib.test.ts 随迁；zen-rule 框架(register/engine/roster/exec-context)在 ext 之外
- **register.ts**：`CustomNodeNamespace.type?` 放宽 `'namespace'|'singleton'`；`UDFManager.setNamespaceType(ns,type)`(后注册覆盖，缺省 namespace)；`udfFunctionSchemaNamespaces()` 按 type 下发——前端三档零硬编码
- **API 数据源定案 A'(每请求实时聚合)**：`custom-node-schema.ts` 快照常量 → `getCustomNodeFunctionSchema()`；为未来宿主 app 层 ext/ 融合留缝(宿主向同一 udfManager 注册即合并，运行期注册不丢)
- **sync:schema 角色升级**：合并注册表镜像导出(含 type，11 ns/52 工具)；夹具刷新与 API 完全一致；`zen_custom_node_function.json` 临时契约文件已移除(移入 git 忽略的 tmp 目录，等价删除)
- 文档：docs/13 新增 §8「ext 两层扩展模型」(结构/setNamespaceType/宿主融合/backlog：define.ts + ext/index.ts 插件化演进，刻意不进本次)；§1/§2 路径更新(ext/\*.ts)；docs/03 本条
- **修复 executeExpr 吞错**：兜底 `catch { return null }` 把 UDF 抛错(含 stub not implemented)无痕吞成 null → 改为返回结构化 `{error: message}`(对齐既有 `udf xxx not found` 与 http_request 错误对象约定)，simulator trace/输出可见；实证 http_call_old.json 复现→修复后输出 `asd:{error:'UDF http_call not implemented yet'}`
- 门禁：zen-rule 40 pass(lists.test 补 ext/risk side-effect 导入)、apps editor 27 pass、typecheck×2 绿；**未提交，待安排**

**最新变更(2026-08-31，第十九批：自定义节点粒度三档 + 函数作用域锁定)：**

- **修复 generic 节点函数漂移**：schema 驱动节点缺 `renderTab` 落兜底 `CustomFunctionTable`，其函数下拉列全部函数且可改写 `value[0]`，运行时按 `value[0]` 调 UDF → 漂移实例执行错误函数。子模块新增 `resolveFunctionScope(kind, customFunctions)` 四档解析(locked/scoped/legacy/free) + `healExpressionsForScope` 打开节点即治愈并立即持久化(`;;` 字符串形经 `toOperatorExprArray`)
- **粒度三档定稿(docs/13 §7 修订，取代第十八批 §7「1 节点 = 1 函数」)**：调用平铺红线不变；`namespace.type` 承载粒度——`singleton`(每函数一节点，kind=函数名，锁 chip/单行/code tab 隐藏/禁增删拖)、`namespace`(缺省，集合容器多行，kind=命名空间名，下拉限定集合)、legacy(主仓固定注册 `kind='UDF'` 自由节点+徽标，不治愈)；`sum`×3 旧实例待服务端补 sum UDF(singleton 档、名恰为 sum)自动复活
- **极简兼容路线定案**：全仓扫描实证 `ns.tool` 派生形从未上线(仅 UDF×4 + sum×3)→ 不生成旧 spec、不做 paletteHidden；`contrib` 模板标记 `singleton`(兼容 `contrib.inout` 历史派生形解析)；模板 `zen_custom_node_function.json`(10 命名空间)同步离线夹具
- **Phase 0 demo 清理**：7 个 demo 节点移出默认注册(`src/context/customnode.tsx`→`src/demo/custom-nodes.tsx`，仅手动 `extraNodes` 引用)，消除 demo `counter` kind 与 schema 命名空间撞名；`excludeDemoNodes` 选项移除(零外部消费者)
- **registry 拆层**：纯逻辑 `src/lib/custom-node-plans.ts`(uid/toFunctionCallValue/defaultCustomNodeConfig/三档 plan 工厂，无 jdm-editor 依赖、bun 可测) + UI 组装 `custom-node-registry.tsx`(plan→createJdmNode)；容器节点播种空表达式、无 inferTypes(Backlog)
- **编辑 UI**：函数模式纵向布局(选择器全宽+参数行纵列)、参数名 label+必填 `*`+description 悬浮；locked 只读 chip(锁图标)+隐藏 code tab、scoped 限定下拉、legacy 徽标(表头)；locale 补 `legacy`/`locked`
- 门禁：主仓 lint 0 errors(19 warnings)、typecheck×2 绿、bun test 214 pass(+8，24 个既有环境性 fail 与基线一致)、组件 38 pass、zen-rule 冒烟 ✓、build ✓；子模块 typecheck(1 个既有 stories 报错)、bun test 41 pass(+18 新增 scope/heal 单测)、build + build:storybook ✓；**未提交，待安排**

**最新变更(2026-08-28，第十八批：自定义节点结构设计决策)：**

- 结构决策已沉淀(docs/13 §7)：**1 节点 = 1 自定义函数，不支持嵌套**——序列化保持极简数组模型 `["fn","a","b","c"]`，画布 body 渲染 `inout(a, b, c)`；主题分类由「命名空间/group」层承担(不改 1节点=1函数，不做节点内多函数/嵌套解析)
- 理由：嵌套破坏原子性(无法对单个调用独立 trace/diff/类型推断/输出探针)，与数组模型相悖，且不符业界惯例(n8n/Coze/Dify/LangGraph/AWS Step Functions/Blueprints 均单节点=单操作、边做数据流、容器/子图归类)
- 「图级 SubGraph / 纯视觉组容器」记入 Backlog(docs/13 §7.4)，刻意不进实现，保持 `["fn",...]` 模型长期极简

**最新变更(2026-08-28，第十七批：应用层去 antd 收尾)：**

- `theme.provider.tsx` 删除外层 antd `ConfigProvider`——`JdmConfigProvider`(jdm-editor)内部已按 `mode` 应用同一套 dark/default algorithm(含 prefixCls 隔离)，外层包装冗余；暗/亮切换行为不变
- 根依赖移除 `antd ^5.29.3` + `@ant-design/icons ^6.1.0`(后者自 f2f0aa4 后零引用)；主仓 `src/` **零 antd 引用**，并消除与 jdm-editor(antd 5.21.2)的双版本并存；antd 此后仅作为 jdm-editor 核心库自身依赖存在(docs/09-11 评估结论「antd 核心 + ReUI 增量」最终态)
- 门禁：lint 0 errors、typecheck×2 绿、主仓 174 + 组件 38 + apps 67 pass、`bun run build` + `build:storybook` ✓
- 待手验：:5173 暗/亮主题切换(jdm-editor 组件跟随 JdmConfigProvider)

**最新变更(2026-08-28，第十六批：库化质量——组件交互测试 + 主仓 Storybook)：**

- 组件测试基建(`dfb831d`)：`component-tests/` 独立目录 + `bun run test:components`(独立进程，避免 bun test 路径子串误捞)；`src/test-utils/setup-jsdom.ts` jsdom 单例环境——**happy-dom v20 + GlobalRegistrator 的 window 绑定类与模块基类品牌割裂(Symbol.hasInstance)，dispatchEvent 不可用**，组件测试弃用 happy-dom；jsdom 全局拷贝保留 native fetch/AbortSignal/定时器(jsdom 计时器在 bun 下递归爆栈)；`src/test-utils/mock-jdm-editor.ts` 以 `mock.module` 桩替换 jdm-editor 全量桶(monaco 在 bun 不可求值)，updateNode 落 store 并通知重渲染
- 测试覆盖(`dfb831d`)：KeyValueEditor 8 用例(结构化/原始模式、增删改、解析失败回退)、HttpRequestTab+画布卡 14 用例(请求行增删选、URL/输出键持久化、方法徽章、高级 tab 超时重试、basic/raw 认证、模拟响应三态、GET 忽略 body)、QueryListTab+画布卡 9 用例、摘要卡片 5 用例(参数对齐/回退/无参/输出/编辑入口)，**合计 38 用例**；radix Tabs 需 mousedown+click 激活(经验记录)
- 主仓 Storybook(`a19a361`)：@storybook/react-vite 8.6.12 与子模块对齐；`.storybook/` viteFinal 别名(@gorules/jdm-editor→子模块 src)+staticDirs 指向 static/monaco-editor@0.52.2；stories：KeyValueEditor(结构化/原始)、**DecisionGraph 嵌入示范**(真实 customNodes 注册 http_request+query_list，宿主嵌入形态可视化)；`bun run build:storybook` 本地构建通过(3 stories 入索引)
- CI(`dfb831d`)：codequality job 加 `bun run test:components`
- 门禁：lint 0 errors、typecheck×2 绿、主仓 174 + 组件 38 + apps 67 pass、`bun run build` + `build:storybook` ✓

**最新变更(2026-08-27，第十五批：部署收尾)：**

- Rust 遗留清除：删 `backend/`(Cargo.toml + main.rs)、根 `Cargo.toml`/`Cargo.lock`、`pnpm-lock.yaml`、`.gitignore` 的 `/target`；CI 移除 rust-codequality job；`apps/editor` 定位为唯一后端
- 文档清理：README backend 章节(bun/Hono)、docs/02 架构图/技术栈/§4.1/§6.2 双后端→单后端、docs/04 工具链/后端启动/Docker 指引去 Rust；docs/03 §5.2/§5.3 更新
- Dockerfile 重写(`oven/bun` 多阶段)：builder 层缓存安装 → `bun run build` → runner 复制 node_modules + apps + jdm-editor + `static/→apps/editor/public`(serveStatic 目录)，VOLUME 挂载 graphs/lists；`.dockerignore` 排除 node_modules/static/运行时数据目录
- CI 真门禁(`validate.yml`)：去全部 `continue-on-error`；codequality job 加主仓 test + apps test(`bun test apps/zen-rule apps/editor`)；新增 build job；checkout `submodules: recursive`(workspace 含 jdm-editor/packages/\*)；push 触发 master **+ zrule**
- 新增 `docs/16-deployment-plan.md`：第十五批范围 + 已知问题 backlog(request 节点 Schema 保存丢失)
- 门禁：lint 0 errors、typecheck/apps 绿、主仓 test 174 pass、apps 67 pass、podman 本地 `docker build` 验证通过

**最新变更(2026-08-27，第十四批方向A：版本历史子面板 UI)：**

- 纯逻辑(`23f611c`)：`src/lib/graph-persistence.ts` 新增 `listRemoteVersions(adapter,id)`——有 `listVersions` 时透传、否则返回 `[]`(宿主无版本能力则不渲染历史面板)；`loadFromRemote` 已支持 `{revision}` 透传；单测 +3(透传/无实现→[]/load revision 透传)，本套件 9 pass
- 页面 UI(`ec91b8a`)：打开宿主图后顶栏出现 "Versions" 下拉(仅当 `persistence?.listVersions` 且 `remoteSource` 已设)——打开时 `listRemoteVersions(id)` 列版本、当前加载版本禁用、选中某版 AlertDialog 确认后 `openRemoteGraph(id,revision)` 加载历史，并把 `remoteSource.revision` 记为保存的 `baseRevision` 乐观锁；复用现有 DropdownMenu/AlertDialog 无新 UI 依赖
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

- EditorShell Provider 第一版(`c4944fb`)：新建 `src/shell/`——`EditorShellOptions{schemaSource, authAdapter, simulate}` 三注入点 + `EditorShellProvider`/`useEditorShell` Context；默认 simulate 从 decision-simple 抽出为 `createDefaultSimulate`(axios 错误映射为 Simulation 信封+errorMessage，行为零变)；decision-simple 改走 shell(506→约 470 行)，页面级状态(graph 值/文件对话框)保留在页
- Provider 渲染测试因 jdm-editor 全量桶(monaco)在 bun 下不可渲染而调整为针对 `createDefaultSimulate` 的 Bun.serve 集成用例(+3：成功信封 snapshot 透传/失败不抛出返回 errorMessage/网络不可达降级)；Provider 薄胶水由 tsc 与页面实际使用覆盖
- 残余解耦(`5454c21`)：`useCustomNodes` 选项扩展 `{extraNodes?, excludeDemoNodes?}`(组合逻辑抽 `composeBaseNodes`,默认行为不变)；localStorage 键命名空间化——`src/lib/storage-key.ts`(`jdm:` 前缀+历史键回退读)，迁移 summary-card 开关与主题偏好两处，用户既有状态不丢失；+4 单测
- 文档(`b110bbd` 后续)：新增 `docs/14-auth-integration.md` 宿主鉴权集成指南(npm 嵌入/iframe/网关三模式 + AuthAdapter/ExecCtx 用法 + 五条安全红线)
- 根 devDeps 新增 @testing-library/react@16.3.0(为后续组件测试预留)；测试基线 **148→155 pass**(含子模块 37)；lint 0 错误

**最新变更(2026-08-25，第九批：名单 owner 用户级隔离)：**

- C 项落地(计划存档 docs/14-batch-eight-plan.md，语义经用户拍板：共享名单任意登录用户可写可删、新建默认私有)
- zen-rule(`f63e6c5`)：`NamedList` 增加 `owner?`；存储改双层作用域 Map(''=共享/其余=owner)，**同名跨用户互不覆盖、自有遮蔽共享**；五访问器加可选 `actor`(不传=管理员全可见，既有测试零改动)；`query_list` UDF 经 B 批 ALS 读 `getExecContext()?.userId` 并发安全取 actor；测试 **35→40 pass**
- apps/editor(`4bd678f`)：名单存储布局升级为 `shared/` + `users/{owner}/` 子目录(存量扁平文件视为共享兼容读取、写回原位更新防重复)；CRUD 全部按会话 actor 过滤——POST 服务端注入 owner(客户端字段被 schema 剥离防伪造)、PUT 保留原 owner、他人私有一律 404 防名字探测；GET 响应形状 `{name,size}[]` 不变前端零改动；测试 **16→21 pass**
- 安全边界：owner 由服务端会话注入不可伪造；无 actor 视角仅限内部直调(引擎/CLI)，API 路径恒有 ExecCtx
- lint 0 错误/17 警告；typecheck×2 绿

**最新变更(2026-08-24，第八批：鉴权适配层 + ExecCtx 执行上下文通道)：**

- 计划先行(`bca8723`)：完整方案存档于 docs/14-batch-eight-plan.md；C 项(名单 owner 隔离)仅设计存档、暂缓实施，待单独放行
- A AuthAdapter 抽取(`9e13933`)：新增 `src/lib/auth/adapter.ts`——`AuthAdapter = () => Promise<AuthUser|null>` 接口 + `createAnonymousAdapter`/`createBetterAuthAdapter` 内置实现(宿主自定义直接传函数)；`user-resolver.ts` 改为薄封装 `createUserResolver(adapter)`，`createBetterAuthResolver` 保留兼容别名；decision-simple 经 useMemo 稳定 resolver 引用(顺带修复每 render 重建导致的 effect 反复触发)；better-auth 从硬依赖降为可选实现；+5 单测
- B ExecCtx 通道(`1f31d9c`)：ALS spike 验证 Bun 下 AsyncLocalStorage 并发隔离 PASS；zen-rule 新增 `exec-context.ts`(`getExecContext`/`runWithExecContext`)并从包入口转出——**禁用实例字段**(ZenRule 单例并发竞态)，UDF 直接 import getter，engine.ts 签名不变；apps/editor 新增 `resolveExecContext`：`TRUST_PROXY_HEADERS=true` 时信任网关 `X-User-Id`/`X-Request-Id`(缺省回退 Mock 用户 mock-user-1)，simulate/decision 两处 evaluate 以 `runWithExecContext` 包裹；+4 zen-rule 用例(含并发交错与 UDF 探针)+3 editor 用例
- 测试基线更新：主仓 **126→136 pass**(+5 auth adapter/+4 exec-context/+3 resolveExecContext... 净增 10)，zen-rule **31→35 pass**，apps/editor **13→16 pass**；lint 0 错误/17 警告
- 安全边界：不信任客户端明文 userId(网关头需显式开启信任开关)；凭证不出编辑器——http_request 出站携带用户 token 明确不做(见 docs/14)

**最新变更(2026-08-24，第七批：生产化打磨 + 质量补全 + 库化第一步)：**

- 定位校准：编辑器以「通用无状态库」为目标(未来作为库发布、可被其他应用引用)，暂缓真实会话/鉴权与规则持久化；本批按此目标做生产化与可复用性改造
- 后端生产化(apps/editor)：新增 env 配置(`PORT`/`CORS_ORIGINS` 白名单，未设则全放行；`LISTS_DIR` 名单目录可覆盖)；hono/cors 中间件接入；simulate/lists/decision 的散落错误响应统一改抛 `HTTPException` 走 onError(响应形状不变)；删除调试端点 `/state`、`/input`、根路由 `files=` 目录列表及 store 内存泄漏日志；服务启动加 `import.meta.main` 守卫并导出 app 供测试
- apps/editor 首个路由单测 `index.test.ts`(13 pass)：openapi/CORS 头/preflight/simulate 信封与 zod 校验/lists CRUD 全链路(临时 LISTS_DIR)/mock session/schema 下发
- 模拟器 hooks 单测(jdm-editor 子模块 `44102b4`)：use-simulator-request-binding/use-request-example-persistence/use-simulator-request-editor 三 hooks 全覆盖，子模块测试基线 **21→37 pass**；引入 happy-dom GlobalRegistrator(bunfig preload)并在注册后还原 fetch/AbortSignal 等原生全局，避免污染真实网络用例
- Storybook：新增 simulator-nodes-panel stories(空态/成功 trace/错误 trace/loading 四场景)，`storybook dev --ci --smoke-test` 通过(`48f1b8a`)
- 库化第一步(主仓 `542f45f`)：schema 加载拆出轻量模块 `custom-node-schema-source.ts`——`fetchCustomNodeSchema(source)` 支持 URL 字符串或宿主注入加载函数(默认同源 `/api/custom-nodes/schema` 不变，失败回退离线夹具)；`useCustomNodes({ schemaSource })` 可选注入；registry tsx 转出保持既有导入路径兼容；+6 单测
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
