# 项目状态

> 快照时间：2026-08-09

---

## 1. 当前环境

### 1.1 分支状态

| 仓库               | 当前分支 | 基于分支 | 说明                                                |
| ------------------ | -------- | -------- | --------------------------------------------------- |
| editor(主项目)     | `reui`   | `zrule`  | shadcn/ReUI 统一技术栈 + appshell 独立包开发分支    |
| jdm-editor(子模块) | `reui`   | `master` | 内核重构分支（ReactFlow 12 + shadcn/ReUI，去 antd） |

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

- [x] 第六十一批(页面拆分 + 版本按天保留)：decision-simple 863→372 行(hooks/工具条组件抽取 + lib 纯函数)；顺带修复 `listRemoteVersions` 剥 `auto`/`versionName` 字段缺陷(Pin 面板此前恒空态)；auto 版本保留策略升级为 滚动 20 条 ∪ 按天检查点(`AUTO_VERSIONS_DAILY_KEEP`，纯逻辑 `auto-version-retention.ts`)——见 7.3 第六十一批
- [x] 第六十二批(决策请求日志落盘)：simulate/decision 逐行 JSONL 落盘(日频滚动 + `DECISION_LOG_KEEP_DAYS` 清理)；Dockerfile/compose 增 logs 卷；`deploy/vector-oss/` Vector→对象存储归档示例——见 7.3 第六十二批
- [x] 第六十三批(工具链升级)：vite 7→8(Rolldown 默认打包器)+ typescript 5.9→6.0(TS 7 过渡版)+ storybook 家族 10.6.0 + react-swc 4.3.3 + wasm 插件 3.6.0；TS 6 `types` 显式化(根/node 工程)——见 7.3 第六十三批
- [x] 第六十四批(内核消费接线批)：前置(gitlink 推进 91e8e8f + catalog 对齐：补 unplugin-dts ^1.1.0/删 vite-plugin-dts 残留)；命名版本接线(面板 onRename→adapter renameVersion→既有 PATCH，本地模式同享；修复 pruneAutoVersions 未豁免「auto+命名」版本缺口+路由级集成测试)；S004 diff 消费(computeGraphDiff 逐版基线喂 diffs prop)；B4 在途编辑快照验证归档(链路闭合，宿主零改动)——见 7.3 第六十四批
- [x] 第六十五批(S008 消费收尾)：gitlink 推进 91e8e8f→98d79d3(内核消费 S008：删 monaco 类型映射 + MarkerSeverity 字面量化，随批 6 个 UI 回归修复)；vite.config/.storybook 切原生 resolve.tsconfigPaths + 卸载 vite-tsconfig-paths——见 7.3 第六十五批
- [x] 第六十六批(部署硬化)：A3 容器 USER 硬化(/data 预置 bun 属主 + USER bun，存量卷自愈迁移)；A4 冒烟链固化(scripts/smoke-deploy.ts，复刻 59 批全链+非零退出码+卷属主自动迁移)；podman 网络恢复后实机全链 PASS(exit 0)——见 7.3 第六十六批补验
- [x] 第六十七批(D1 旧图 kind 迁移)：映射纯函数(node.content.kind：contrib.*→裸名/http 例外、roster.roster 与 risk.query_list→roster)+normalizeGraphNodes 在线接线+批量脚本(--dry-run)；验收口径修正：撞库图无 namespaced kind（恢复靠 D2），真实样本为 mock-user-1 例外保留图——见 7.3 第六十七批
- [x] 第六十八批(B 轨道第二轮接线)：restoreVersion 接线(恢复变立即落盘，消除双实现分叉)+diffBaseline 消费(恢复前快照画布标记，编辑即清)+I18nProvider locale=zh-CN(面板 vh.* 中文)+组件测试桩补 useT——见 7.3 第六十八批
- [x] 第六十九批(D2 函数域重建)：custom_list_query(复用 queryRoster)/rate_1h+group_distinct_1h(进程内滑动窗口)/ip_location(可插拔数据集)重建于 contrib/；schema fixture 7→10 namespaces(在途同步待内核入库)；撞库攻击防御.json 仿真验收恢复(双路径 trace 断言)——见 7.3 第六十九批
- [x] 第七十批(S007 版本钉住消费收口)：后端 pinned 契约(patch 键+保留豁免+透传+OpenAPI)+前端 onPin 接线(updateVersionMeta)+退役 PinVersionsSheet/直连 PATCH 双实现——见 7.3 第七十批
- [x] 开发任务规划落档 `docs/17-development-plan.md`(三轨道：宿主自主/内核依赖/上线期，随批次回填执行状态)
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

**最新变更(2026-09-07，第六十四批：内核消费接线——命名版本 + 版本 diff + 快照验证归档)：**

- **前置(3cc250f)**：gitlink 0020247→91e8e8f(appshell 0.2.0/kernel 0.3.3+) + catalog 跨树对齐(补 `unplugin-dts ^1.1.0`——缺失即 `bun install` not-in-catalog 实证复现；删 `vite-plugin-dts ^5.0.3` 残留；内核 catalog 已自对齐宿主 vite `^8.2.2`/storybook `10.6.0` 同款数值)
- **命名版本接线(B1a)**：`use-remote-graph` 增 `renameVersion(revision, versionName|null)` → adapter `renameVersion` → 既有 PATCH `{versionName}`(第五十七批端点，零后端改动)；`VersionHistoryPanel` 按 `persistence.renameVersion` feature-detect 传 `onRename`(内核 66cb38a 的面板重命名/按名过滤入口点亮；IndexedDB 本地适配器同款实现，本地模式亦可重命名)。**钉住直连 PATCH 维持**——面板 Pin 入口属 S007 范围，交付后收敛
- **保留策略契约修复**：`pruneAutoVersions` 增豁免——治理对象收窄为「无命名 auto」(`!graph?.auto || graph.versionName` 跳过)，堵住「auto 版本被命名后仍被滚动窗口折叠删除」的契约缺口(appshell 0.2.0「命名版本豁免 auto 保留」)。路由级集成测试：POST manual + 21 auto PUT + PATCH 命名最旧归档 + 1 次溢出保存 → 命名 v2 存活且总量 23(无豁免则 22)
- **S004 diff 消费(B2)**：打开版本历史时以 adapter 返回序为时间序逐版 `load`、以前一版为基线跑 `computeGraphDiff`(内核 barrel 导出)，键 = revision 喂面板 `diffs` prop——+/−/~ 摘要与展开明细由内核 DiffSummary 渲染(宿主只算不算语义，第五十七批裁决不变)；换图/新建时清空。逐版全量加载的量级受保留策略约束(≤20+命名)，本地存储可接受
- **B4 快照验证(登记归档，宿主零改动)**：链路闭合确认——内核 `tab-request.tsx:154` 注册 `useRequestSessionDraftSerializer`(700ms 防抖捕获 schema 草稿/活动源/活动示例 JSON/描述四类在途编辑)→ `GraphRef.serialize()` 聚合 → 宿主 `persistToRemote` 写入 `GraphRecord.session` → 双适配器往返(内核 57106d3 修复)→ `restore(loaded.session)` 恢复(第五十七批已通)。结论：input 在途编辑已进历史快照，内核 0.3.2 交付 + 宿主通道既有，无需新代码
- **诚实标注**：本批未做浏览器手工冒烟——rename/diff 链路由内核组件测试(version-history-panel 8 例)+ http 适配器测试(12 例)+ 宿主保留策略集成测试覆盖，UI 实机验证随下次部署冒烟(A4 固化后一并)
- 门禁：typecheck(root+apps)/lint 0-0/主仓 117/组件 46/apps 92/build/storybook/sync:schema:check/单实例守卫 全绿；S007(Pin 半边)提案已交付待内核会话消费

**最新变更(2026-09-09，第七十批：S007 版本钉住消费收口——pinned 契约 + 双实现退役)：**

- **后端 pinned 契约（apps/editor）**：`graphs-store` patch 扩展 `pinned` 键（内核 66fbf87
  裁决 pinned 为**独立正交维度**——auto 来源/versionName 命名/pinned 保留意图三键组合表达，
  不复用 auto 升格【升格丢来源信息且不可逆】，裁决依据全文见 libsuggest/S007 追记）；
  `pruneAutoVersions` 治理对象收窄为
  「无命名且未钉住的 auto」；versions 列表与 PATCH 响应透传 pinned；GraphVersionSchema/
  GraphVersionMetaPatch/PATCH 响应 OpenAPI 同步
- **前端收敛（双实现退役）**：`use-remote-graph` 增 `setVersionPinned(revision, pinned)` 走
  adapter.updateVersionMeta（HTTP PATCH {pinned} / IndexedDB 原生，两种存储模式同享），删除
  直连 PATCH workaround；**退役自研 PinVersionsSheet 与顶栏钉住入口**（内核面板已带 Pin/Unpin
  控件 + pinned 徽标 + pinned 过滤）；`listRemoteVersions` 透传 pinned（61 批剥字段教训的
  口径延续）；storageMode 自 hook 选项移除（唯一消费者消失）
- 内核 66fbf87 同批携带 S001/S002 落地（react18 合规检查 + zod 4.3.6 钉版），libsuggest
  S001/S002/S007 三提案已加追记段（状态回填留内核会话）
- 门禁：typecheck/lint/主仓 131/组件 46/apps 48(editor)/build/storybook/schema 10ns/单实例
  全绿；诚实标注：Pin/Unpin 浏览器实机走查顺延（IAB webview 不可用，同 66/68 批）；
  fixture 10ns 在途待内核入库（push 前暂红项，同 69 批标注）

**最新变更(2026-09-09，第六十九批：D2 函数域重建——撞库仿真验收恢复)：**

- **四函数重建（apps/zen-rule/src/contrib/，docs/13 §8.3 落定）**：`custom-list-query.ts`
  （裸名 `custom_list_query`，复用 roster 存储 queryRoster，actor 隔离，返回图内 returnSchema
  的 `{result}`）；`rate-window.ts`（`rate_1h`/`group_distinct_1h`，进程内 60min 滑动窗口，
  返回图内声明的 RateCommonResult/GroupDistinctCommonResult 形态——字段语义按字段名与风控
  语义重构【原实现已随重设计移除，注释明示】，导出 `__resetRateWindows()` 供测试；生产
  多副本 Redis 化留宿主层）；`ip-location.ts`（`ip_location`，env `IP_LOCATION_DATASET`
  可插拔 JSON 数据集最长前缀匹配，未配置/未命中返回空字段+ip 回显；**数据集不捆绑**）
- **engine.ts** contrib import 区补三文件；裸名 UDF 经 `funcBindParams` 按 parametersSchema
  声明序绑定位置参数（对齐图内 `custom_list_query;;"名单";;值` 调用形态）
- **撞库仿真验收（D2 闭环）**：ZenRule 装载撞库内容 + 注册测试名单 → 双路径执行断言——
  白名单命中路径（`result.reason` 含「白名单」+ trace 中 `"result":true`）；非白名单路径
  （trace: true 验证 `"counter":1`/`"pv":1`/`"ip":"9.9.9.9"` 且无 udf not found）。
  unit 6 例（计数递增/独立/去重/空回退/actor 隔离）
- **schema fixture 7→10 namespaces**（sync:schema 重新生成）：新增 custom-list-query/
  rate-window/ip-location 三域。**诚实标注（在途同步）**：fixture 属内核仓跟踪文件
  （apps/ell src/assets），变更留在子模块工作区待内核会话入库；gitlink（2998cc6→da22f52）
  随 fixture 一并 bump——此前 push 会让 CI sync:schema:check 暂红（fixture 与 gitlink 联动的
  既有跨仓同步节奏）
- 门禁：typecheck(root+apps)/lint/主仓 129/组件 46/apps(zen-rule+editor) 92→107/build/
  storybook/schema/单实例 全绿

**最新变更(2026-09-09，第六十八批：B 轨道第二轮接线——restoreVersion + 画布 diff + i18n)：**

- **restoreVersion 接线（行为变化）**：`use-remote-graph` 增 `restoreVersionToHead(revision)`——调
  appshell `restoreVersion`（库标准恢复即前进：load(revision)→save() 立即固化为新 head，支持
  versionName/head 兜底/NOT_FOUND）→ toast → refreshVersions → 重载 head 进画布；`onRestore`
  确认对话框更新（Open historical version → Restore version）。**行为变化**：恢复从「载入画布随
  下次保存落盘」变「立即落盘」，消除宿主自实现与库入口的语义分叉（appshell-plan §4 闭合）
- **diffBaseline 消费（S004-P2 画布 diff）**：恢复前画布内容存为 `diffBaseline` 传
  `DecisionGraph.diffBaseline`（画布投影差异标记，store 数据与 onChange 干净）；清除时机 =
  用户开始编辑（DecisionGraph onChange，与 autosave.markDirty 同点）或新建图 reset
- **i18n 接线（内核 9d56a16 消费）**：宿主补 `I18nProvider locale="zh-CN"`（VersionHistoryPanel
  文案 vh.* 17 键 zh 环境显示中文；I18nProvider 尚未进内核 barrel，走源码直通相对导入，
  barrel 导出跟进内核侧）
- **配套修复（组件测试）**：内核 i18n 化后 `installJdmEditorMock` 部分桩缺 `useT`——`mock.module`
  进程级粘性，全量跑时 version-history 文件拿到残缺桩（单文件跑正常，全量跑 "Export named
  'useT' not found"）。桩补行为等价 `useT: () => createT('en')`（内核 createT + en catalog，
  与无 Provider 回退一致，测试的真实文案断言保持有效）
- 门禁：typecheck/lint/主仓 123/组件 46/apps 92/build/storybook/schema/单实例 全绿
- i18n 浏览器实机走查仍顺延（IAB webview 不可用，同 66 批标注）

**最新变更(2026-09-09，第六十七批：D1 旧图 kind 迁移——在线恢复路径)：**

- **映射纯函数(`src/lib/graph-kind-migration.ts`)**：迁移落点为 `node.content.kind`（实测定锚，
  非 node.kind）——精确映射 `roster.roster`/`risk.query_list`→`roster`；`contrib.<fn>`→`<fn>`
  （例外：`contrib.http_request` 不迁移——http 已由 http_request 专属节点取代，customNode 壳
  无法转型，保持原 kind 走「配置不符合规范」占位卡，数据无损）。幂等：迁移结果再跑零变化，
  零改写路径返回原节点引用
- **在线接线**：`normalizeGraphNodes` 统一先过迁移（打开/导入全覆盖，`;;` 数组化迁移同款
  先例位置）；用户导入旧图即自动恢复，无需手工跑工具
- **批量脚本(`scripts/migrate-legacy-graphs.ts`)**：`bun scripts/migrate-legacy-graphs.ts
  [路径...] [--dry-run]`——缺省扫 apps/editor/graphs，有变化才写盘；dry-run 与实迁移双模式
  经合成旧图验证
- **诚实标注（验收口径修正）**：撞库攻击防御.json 实查**无 namespaced kind 可迁**——其 4 个
  UDF 节点为 generic customNode + expressions.value 首段函数名（`custom_list_query;;...`，
  现行模型），加载/渲染/编辑本就通过，仿真恢复靠 D2 函数域重建（非 D1）。真实迁移样本为
  mock-user-1 存量图 `contrib.http_request`（恰为例外保留类）。单测 6 例：合成映射/例外/
  幂等 + 真实文件回归（contrib.http_request 保留断言）
- 门禁：typecheck(root+apps)/lint 0-0/主仓 123(+6)/组件 46/apps 92/build 2.8s/schema/单实例 全绿

**最新变更(2026-09-09，第六十六批补验：podman 网络恢复 + 冒烟全链 PASS + 卷属主自愈迁移)：**

- **环境恢复确认**：VM 出站 TCP 恢复（github/npm 双目标 HTTPS 200，1.1.1.1 单点过滤无关痛痒）；
  镜像全量重建成功（含 A3 的 chown/USER 层）
- **实机全链 PASS（exit 0）**：up --build → 卷属主自愈迁移（历史 root 卷 → bun）→ healthz
  ok+graphsDirWritable=true → 签名 cookie 建图 v1 → auto v2/v3 → PATCH 钉住 v2 → 容器重启 →
  healthz/版本表/钉住标记/head 内容持久化复核全部通过——**A3 非 root 运行 + A4 冒烟链正式落验**
- **真发现（A3 配套缺口）**：硬化镜像只对**新卷**生效，存量卷（59 批时代以容器 root 创建）
  属主仍为 root → `graphsDirWritable:false`。解法入脚本：waitHealthz 检测到不可写时自动执行
  一次性 `chown 1000:1000 /data`（`--user 0 --volumes-from jdm-editor` 借挂载，幂等仅触发一次，
  SMOKE_CONTAINER 可调）；存量部署升级硬化镜像走同一迁移路径（docs/16 §6.2 已更新）
- 第六十四批遗留的 rename/diff UI 实机验证：数据链（版本表/PATCH versionName）已在容器实测通过；
  浏览器走查因 IAB webview 不可用顺延（UI 接线由 46 例组件测试 + 类型契约覆盖）

**最新变更(2026-09-08，第六十六批：部署硬化——容器 USER 硬化 + 冒烟链固化)：**

- **A3 容器 USER 硬化(Dockerfile)**：runner 阶段预建 `/data/{graphs,rosters,logs}` 并 `chown bun:bun`
  ——named volume 首次挂载时 Podman/Docker 会把镜像内目录内容(含属主)拷入卷，非 root 进程
  直接可读写，不再依赖「rootless 下容器 root 恰好映射宿主用户」的偶然语义（docs/16 §6.2
  未来项落定）；`USER bun` 置于 CMD 前（HEALTHCHECK 同随 USER 执行）；`/app` 构建产物保持
  root 只读，进程仅需 /data 写权限
- **A4 冒烟链固化(`scripts/smoke-deploy.ts` + `bun run smoke:deploy`)**：完整复刻第五十九批
  手工链——compose up -d --build → 轮询 healthz(ok+graphsDirWritable，120s 超时) → 签名 cookie
  建图(bun `getSetCookie` 捕获 gid 会话复用) → auto 保存 v2/v3 → PATCH 钉住 v2
  (versionName=smoke-pinned, auto=false) → compose restart → 版本表/钉住标记/head 内容持久化
  复核；任一步失败非零退出。环境变量：SMOKE_COMPOSE/SMOKE_PORT/SMOKE_KEEP(留栈供 UI 验证)/
  SMOKE_CLEAN(down -v 连卷删)
- **诚实标注：容器实机验证被环境阻塞**——podman machine(WSL2) 硬中断恢复后 VM 出站 TCP
  完全死亡（DNS/默认路由正常、TCP 1.1.1.1:443 与 registry.npmjs.org 全断；宿主同刻到 npm
  200/1.04s 正常）。已试并无效：定点 terminate+start、WSL 全量 shutdown、machine 干净重启、
  HNS 服务重启(管理员)。疑似 VPN/安全软件劫持 WSL NAT 子网或需 Windows 重启（用户级动作）。
  A3/A4 代码与 lint 全就绪；环境恢复后 `bun run smoke:deploy` 一条命令补验证（SMOKE_KEEP=1
  留栈 + 浏览器走查即同时补第六十四批遗留的 rename/diff UI 实机验证）
- 门禁：typecheck/lint(含新脚本)/主仓 117/组件 46/apps 92/build/storybook/schema/单实例 全绿
  （65 批同基线，66 批改动不触前端构建面）；冒烟链未跑（见上）

**最新变更(2026-09-08，第六十五批：S008 消费收尾——原生 tsconfigPaths 迁移)：**

- **gitlink 推进 `91e8e8f→98d79d3`**：内核消费 S008——删 `packages/jdm-editor/tsconfig.json` 的
  monaco-editor 类型映射（包 typings 字段指向同一文件，typecheck 零变化）+ `function.tsx` 的
  `MarkerSeverity` 值导入改本地字面量常量（monaco 在内核内降级为纯类型依赖）；随批带入 6 个
  UI 回归修复（edit-expression 按钮恢复、图面板停靠回底行、业务模式表格高度对齐、
  CustomFunctionTable tab fallback + storybook 内核源码透传、rolldown 下 dist i18n catalogs
  修复）与 4 个 docs 提交。`bun install` 零 lockfile 增量（内核 deps 变化不影响宿主解析）
- **原生 tsconfigPaths 迁移**：vite.config 与 .storybook/main.ts 切 `resolve.tsconfigPaths: true`
  并卸载 vite-tsconfig-paths——此前 19 错误的根因（monaco 映射被应用于运行时解析）随 S008
  消除，informational 告警归零；双 tsconfig 语义由原生「按 importer 就近 tsconfig」承担
  （宿主 `@/*`/`@republicroad/jdm-appshell*` 走根 tsconfig，内核 `#*` 走内核 tsconfig）
- 工具链跟踪清单清零：`__dirname` ✓（99ea0fd）、`resolve.tsconfigPaths` ✓（本批）
- 门禁：typecheck(root+apps)/lint 0-0/主仓 117/组件 46/apps 92/build 4.4s/storybook/
  sync:schema:check/单实例守卫/preview 200(告警 0) 全绿

**最新变更(2026-09-07，第六十三批：工具链升级——Vite 7→8(Rolldown) + TypeScript 5.9→6.0)：**

- **升级清单**：`vite ^7.3.1→^8.2.2`(Rolldown 成默认打包器，替代 esbuild+Rollup 双引擎，插件 API 兼容旧 rollupOptions 自动转换)；`typescript 5.9.3→6.0.2`(TS 7 原生编译器铺路的过渡版)；`@vitejs/plugin-react-swc ^4.2.3→^4.3.3`(peer 声明 vite 8)；`vite-plugin-wasm ^3.5.0→^3.6.0`(3.5.0 peer 不含 vite 8，3.6.0 起 ^2–^8 全放行)；storybook 家族 `10.5.10→10.6.0`(5 处：storybook/@storybook/react/@storybook/react-vite/@storybook/addon-docs，10.6 起明确 peer vite ^8)；`@typescript-eslint/* ^8.55.0→^8.69.0`(peer `>=4.8.4 <6.1.0`，官方支持 TS 6，issue #12123 闭环)
- **TS 6 适配(仅 2 处)**：根 `tsconfig.json` 补显式 `types: ["bun", "wicg-file-system-access"]`、`tsconfig.node.json` 补 `types: ["node"]`——TS 6 将 `types` 默认从自动枚举 @types 改为 `[]`，凡依赖全局类型注入(如 bun:test 模块声明、FileSystemAccess API、node:fs)的工程必须显式声明；apps 子工程本就有 `types: ["bun-types"]` 未受影响。宿主 `tsconfig.base` 本就符合 TS 6 方向(ES2022/ESNext/bundler/strict/esModuleInterop)，无 baseUrl/`module Foo`/`asserts {}` 弃用语法命中
- **免升级确认(前置核实)**：vitest 4.1.11 peer 已含 `^6.0||^7||^8`(主仓测试走 bun test，vitest 仅子模块树使用)；`vite-plugin-static-copy 4.1.1`/`vite-plugin-dts ^5`/`vite-tsconfig-paths 6.1.1`/`@tailwindcss/vite 4.3.3` peer 均放行 vite 8
- **Vite 8 迁移提示(后续项，暂不动)**：vite.config.ts `__dirname` 在 `configLoader: 'native'`(未来默认)下不受支持，届时改 `import.meta.dirname`(Vite 8 本身要求 Node ≥20.19，无版本顾虑)；`vite-tsconfig-paths` 可被内置 `resolve.tsconfigPaths` 替代，但宿主双 tsconfig 项目(根+内核)逐 importer 解析语义需先验证，暂保留插件
- **分支说明**：规划分支名 `reui/vite8` 因 git 引用前缀冲突(已有 `reui` 分支占用 `refs/heads/reui`)不可创建，实际分支 **`reui-vite8`**
- **冒烟**：vite preview + 浏览器实测——编辑器完整渲染(工具栏/画布控制面板/组件面板含全部自定义节点)，Rolldown 产物无运行时异常；构建 4.25s，chunk 体积告警为 monaco 大包固有(与升级无关)
- **范围边界**：子模块自有 pnpm 树版本未动(内核工具链对齐属内核会话)；在途子模块指针变更(kernel 0.3.3/appshell 0.1.1，npm 已发布)单独先行提交，不混入本批
- 门禁：typecheck(root+apps)/lint 0-0/主仓 116/组件 46/apps 91/build/storybook/sync:schema:check/单实例守卫 全绿

**最新变更(2026-09-07，第六十二批：决策请求日志落盘 + Vector→OSS 归档示例)：**

- **决策请求日志(apps/editor)**：新增 `decision-request-log.ts`——`/api/simulate` 与 `/api/decision` 每次请求完成后逐行落盘 JSONL(`$LOGS_DIR/decision-requests-YYYY-MM-DD.jsonl`，UTC 日频滚动)；记录 `{ts, requestId, userId, route, method, status, durationMs, ok[, error]}`。写入经串行队列保证行序、失败仅 console.warn 绝不影响 API；跨日顺带执行滚动清理(`DECISION_LOG_KEEP_DAYS` 默认 14 天，0 = 永久保留)
- **中间件接线**：日志中间件挂在身份中间件之后，仅命中两条决策路由；requestId 由中间件统一生成存入 context(`identityRequestId`)，路由内 `execContextOf` 复用同一值——日志行与请求链路可关联。400 校验类(short-circuit 不抛错)照常落盘 `ok:false`；异常路径捕获后重抛、状态取 HTTPException.status
- **测试 +3(apps 88→91)**：simulate 200 落盘字段齐全(mock 用户/耗时/时间戳)；400 落盘 ok=false + 非决策路由不落盘；`pruneDecisionLogs` 注入式清理(恰好 7 天边界属保留窗口)。陷阱：`bun test` 单进程模块缓存——`LOGS_DIR` 与 GRAPHS_DIR 同款必须在顶层动态 import 之前就绪
- **部署**：Dockerfile 增 `ENV LOGS_DIR=/data/logs` + VOLUME；根 docker-compose.yml 增 `logs-data` 卷；新增 `deploy/vector-oss/`(vector.toml：file source(device_and_inode 指纹/防回读) + remap 拍平 + s3 sink(按日分区 key_prefix/gzip/256MiB 落盘缓冲) + compose 双服务编排 + README 含 OSS 最小授权 RAM 策略与 MinIO 联调指引)
- **诚实标注**：Vector→OSS 配置为可运行起点，本批未实机联调 OSS(签名兼容性需测试 bucket 验证一次，README 兼容性提示已写明)
- 门禁：typecheck(root+apps)/lint 0-0/主仓 105/组件 46/apps 91 全绿

**最新变更(2026-09-07，第六十一批：decision-simple 页面拆分 + auto 版本按天保留策略)：**

- **A1 页面拆分(主)**：`src/pages/decision-simple.tsx`(863 行)→ 目录模块 `src/pages/decision-simple/`——页面壳 `index.tsx`(372 行) + `use-remote-graph`(宿主存储分支：persist/open/library/versions/pin) + `use-autosave`(idle 门控整体迁入，触发判定抽 `src/lib/autosave.ts` 纯函数) + `use-local-file`(浏览器文件 IO) + `use-confirm-dialog` + `page-toolbar`(顶栏工具条纯展示) + `pin-versions-sheet`(钉住面板) + `editable-title`；图环检测抽 `src/lib/graph-cycle.ts`(`assertAcyclic`)。行为零变化原则，`git mv` 保留文件历史
- **顺带修复真实缺陷**：`listRemoteVersions`(src/lib/graph-persistence.ts)此前 map 只挑 `revision/updatedAt`，把 adapter 契约的 `auto`/`versionName` 剥掉——页面 Pin 面板 `v.auto` 过滤恒空、版本面板 auto 徽标永不显示(第五十二批引入 Pin 数据链时的集成缺口，第五十九批冒烟走 API 未暴露)。修复为全量透传 + 透传用例
- **React 编译期 lint 适配**：`react-hooks/refs` 不识别经 hook 返回对象中转的 ref(file input 回通道改页面自建传入)；`react-hooks` 新规禁 effect 内同步 setState——模板直开(`?template=`)由 mount effect 改惰性 `useState` 初始化器(行为等价)
- **A2 按天保留(辅)**：保留策略升级为 **滚动条数 ∪ 按天检查点**——纯逻辑独立成 `apps/editor/src/auto-version-retention.ts`(`pickAutoVersionsToPrune`：保留最近 `AUTO_VERSIONS_KEEP`=20 条 + 此前每个 UTC 日最新一条，检查点窗口 `AUTO_VERSIONS_DAILY_KEEP` 默认 30 天，0 关闭；今天的 auto 不参与折叠)。独立模块的原因：graphs-store 模块加载期捕获 GRAPHS_DIR，bun test 单进程内被其他测试文件先加载会污染路由级测试的存储路径(实证后抽离，零环境依赖任何加载顺序安全)；graphs-store 转发导出保持公共面
- **测试**：主仓 96→105(+graph-cycle 4/autosave 4/listRemoteVersions 透传 1)；apps 80→91(+保留策略纯函数 7/按天折叠路由级集成 1)。集成测试实证 union 语义：滚动窗口内(≤20 条)不折叠，溢出后检查点救回跨日条目、同日以最新替代——初版测试场景(4 条 auto 期待同日折叠)即栽在未过滚动窗口，探针驱动 store 层定位后重写
- 门禁：typecheck(root+apps)/lint 0-0/主仓 105/组件 46/apps 91/build/storybook/sync:schema:check/单实例守卫 全绿；文档：docs/17 规划落档

**最新变更(2026-09-06，第六十批：内核 6 提交跟进——pnpm catalog 跨工具对齐 + gitlink bump)：**

- **内核会话恢复**（reui +6 提交：8db9920）：S003 修复（appshell 补 @storybook/react-vite devDep——根因是前次 OOM 崩溃会话丢失声明）；**pnpm catalog 13 项共享依赖**（pnpm-workspace.yaml 定义，成员改 `catalog:` 声明）；consumer-smoke 修复；docs-site wasm；prettier 对齐
- **跨工具 catalog 对齐（本批核心）**：bun 的 catalog 读根 package.json、pnpm 读 pnpm-workspace.yaml——内核成员 `catalog:` 声明在 bun 树直接报错 `is not in the catalog`。解法：根 catalog 补齐 13 项（与 pnpm 数值逐字一致）；根 deps 中 7 项同范围依赖（react-virtual/cva/clsx/lucide/sonner/tailwind-merge/ts-pattern）+ vite 一并切 `catalog:`（声明层统一）；**例外**：根 `@storybook/react-vite` 保持 8.6.12 字面量（根 storybook 是 v8 世代，内核 catalog 钉 10.5.10——双世代跨树并存，不可互切）
- **版本收敛**：vite catalog 切换后 bun 对根重解析出 7.3.1（与内核成员 7.3.6 双份）——`bun update vite` 收敛至单解析 7.3.6；全量重装清 store 孤儿目录（vite/react/@lezer 全部 =1）
- **陷阱存档**：PowerShell `.Replace()` 做"声明切 catalog:"时把 catalog **定义本身**也替换（定义与 deps 字符串完全相同）→ catalog 自指涉报错——批量字符串替换必须避开定义区
- 门禁全绿：typecheck（root+apps）/lint 0-0/root 96/组件 46/apps 80/build/storybook/sync:schema:check/单实例守卫；gitlink bump（78dcca2 → 8db9920）
- docs/04 §6 重写：podman compose 工作流 + 认证环境变量表（AUTH_SECRET/TRUST_PROXY_HEADERS/CORS_ORIGINS）+ GHCR 镜像说明；gorules/editor 上游镜像标注退役

### 7.3 zrule/reui 分支变更摘要

**最新变更(2026-09-06，第五十九批补丁：保留策略 Linux 删除随机版本 bug——CI 首次暴露)**

- **真 bug（第五十二批引入，本地+CI 一直潜伏）**：`pruneAutoVersions` 正则组 `(v\d+)` 捕获带 `v` 前缀 → `Number("v22")` = **NaN** → 升序比较器失效 → 退化为 readdir 顺序删"第一个"。Windows NTFS 目录名字母序返回（v2 恰在首）掩盖；Linux ext4 顺序任意 → **随机删除最新 auto 版本**（本次 CI 实删 v22）。保留策略在 Linux 生产环境从未正确工作过
- 修复：捕获组改为 `\.v(\d+)\.` 纯数字 → n 有效整数；正则自证（v2/v22 解析 + 升序删除 v2 最旧，字典序 v10<v2 陷阱同时消除）
- 教训入档：**`Number("vNN")` 型 NaN 静默失效靠"目录返回恰好有序"存活**——排序比较器必须以真实数据类型为前提；跨平台 FS 的 readdir 顺序不保证（NTFS 字母序 vs ext4 任意序）

**最新变更(2026-09-06，第五十九批：本地 Podman 部署落地——镜像/编排/实机验证全链)：**

- **Dockerfile 硬化**：bun 1.4.2 对齐；**补 appshell 成员清单 COPY**（appshell 迁入内核仓后旧文件缺失该项，镜像内 frozen-lockfile 必炸——上游遗产陈旧缺陷）；`bunfig.toml` 提前 COPY（isolated linker 镜像内生效）；数据目录 `/data/{graphs,rosters}` + VOLUME + HEALTHCHECK（bun fetch 探 /healthz）
- **build-docker.yml 全面改造**（原为上游遗产 master+chore(release)+gorules/editor）：reui push / workflow_dispatch → `ghcr.io/republicroad/editor`（latest+sha）→ GHCR GITHUB_TOKEN → gha 缓存
- **docker-compose.yml**：单服务（宿主 `${PORT:-3000}`→容器 3000；AUTH_SECRET/CORS_ORIGINS env；named volumes graphs-data/rosters-data；compose 级 healthcheck 兜底 OCI 格式忽略 Dockerfile HEALTHCHECK 的问题）
- **实机验证全链通过**：podman compose build → up（healthy）→ healthz `{ok,graphsDirWritable:true}` → 签名 cookie 身份建图 → auto 保存 v2/v3 → PATCH 钉住 v2（versionName=smoke-pinned）→ **容器重启后版本表与钉住标记完整保留**（卷持久化证据）
- **部署陷阱存档**：① podman-compose 环境值必须字符串（YAML 整数进插值字典报 expected str instance, int found）；② OCI 镜像格式忽略 Dockerfile HEALTHCHECK；③ AUTH_SECRET 态 API 客户端必须自持 cookie（会话即身份）
- 冒烟脚本教训：跨工具调用丢失 PowerShell 会话变量（$jar/WebSession）——依赖登录态的验证链必须单次调用完成
- docs/16 §6 运行手册（构建/启动/备份/升级回滚/容器 root 取舍说明）
- 用户决策：compose 形态 = podman-compose（`podman compose` 委托）；域名/反代上线期再议；better-auth 备案 docs/14 §5.2

**最新变更(2026-09-06，第五十八批：签名 cookie 身份认证（方案 B）+ healthz + 兼容式分页)：**

- **认证落地（封堵 x-user-id 伪造越权）**：新增 `apps/editor/src/auth.ts`——HMAC-SHA256 签名 cookie `gid`（`<userId>.<mac>`，timingSafeEqual 比对 + userId 形态兜底）。`AUTH_SECRET` 未设 → 历史行为零变化（TRUST_PROXY_HEADERS/mock 回退，既有测试全兼容）；设置后 `/api/*` 中间件验证签名 cookie，缺失/篡改即签发新匿名身份（HttpOnly/SameSite=Lax/一年），**x-user-id header 不再被信任**；身份经 hono context 变量 `identityUserId` 传递，14 处路由统一改走 `execContextOf(c)`
- **两处实现陷阱存档**：① `resolveExecContext(c.req.header)` 直接传方法引用丢失 `this` 绑定（`this.raw` undefined 全线 500）——必须箭头包裹；② hono 的 `c.req.cookie()` 在本组合下 undefined——cookie 读写统一走 `hono/cookie` 的 `getCookie/setCookie`
- **`/healthz`**：`probeGraphsWritable()`（GRAPHS_DIR 探针文件写删）+ `{ok, graphsDirWritable}`；不在 /api/\* 下，天然匿名可达（容器/反代探针）
- **兼容式分页**：`listGraphs` 支持 `page/pageSize`（updatedAt 降序切片，缺省全量）；`GraphsQuerySchema = RosterQuerySchema.extend`（z.coerce.number）；HTTP adapter 契约不动
- **OpenAPI 清债**：`GraphVersionSchema` 补 `auto` 字段
- **docs/14「五、认证演进备案」**：方案 B 实施记录 + better-auth 升级方向（触发条件四条 + 迁移路径：session 接管身份源 + userId 映射脚本 + AuthAdapter 接 useSession，编辑器组件层零改动）
- 测试 +4（healthz 匿名探测 / 分页缺省+切片+排序一致 / 部署态三段式：Set-Cookie 签发→cookie 身份可见→伪造 header 不可见→篡改重签发）；测试教训：test 内 POST 显式带 `content-type: application/json`（无头时 body 解析 undefined 的环境差异）
- 门禁：typecheck/lint 0-0/root 96/组件 46/apps 80

**最新变更(2026-09-06，第五十七批：自动保存增强（idle 检测 + dirty 门控）+ 版本钉住服务端 + libsuggest 扩容)：**

- **自动保存重设计（宿主 decision-simple）**：第五十二批的固定 30s 防抖存在两处缺陷——①保存推进 remoteSource.revision 后 effect 重新布防，无编辑也每 30s 空转保存（版本表被无变化 auto 版本刷屏）；②"dirty 签名比对"注释与实现不符（从未比对）。第五十七批重写为 **dirty 门控 + idle 检测**：`dirtySinceSaveRef` 仅编辑器 onChange 置位（加载/恢复/模板路径不置位，防加载后空保存），persistToRemote 成功即清位；布防后 tick 轮询——用户停止交互满 10s（pointerdown/keydown/wheel 三事件采样，不监听 move）即保存，持续无停顿由 90s max-wait 兜底；面板打开暂停不变
- **版本钉住服务端（apps/editor）**：`updateGraphVersionMeta(id, owner, revision, {auto?, versionName?})`——head 与归档版本均可升格/命名，content 不动，revision 严格 `v\d+` 形态校验防穿越；路由 `PATCH /api/graphs/{id}/versions/{revision}` + CORS allowMethods 补 PATCH；测试 +1（归档升格+命名 / head 升格 / 版本表复核 / content 无损 / 未知 404 / 穿越尝试 404）
- **升格 UI 缺口 → S006**：VersionHistoryPanel 无 per-version 操作槽、adapter 契约无 updateVersionMeta——面板按钮 + adapter 扩展 + 宿主接线以 libsuggest S006 移交内核会话（服务端契约已定并上线）
- **libsuggest 扩容**：S004 版本历史 diff 视图（computeGraphDiff 纯函数 + 面板对比——宿主不做避免双 diff 语义）、S005 换肤布局槽位（SkinDefinition.layout：工具栏/面板/头部注入，需求级）、S006 版本钉住接线；README 队列更新至 6 条
- **双树所有权互斥（重大运维教训）**：本批在子模块跑 `corepack pnpm install`（S002 验证 + 还原）把编辑器树内成员 node_modules 改指向内核 .pnpm store（react 19 类型回归，宿主 typecheck 全面 JSX 失配）；`bun install` 重跑即收回（零包变更、只修 junction）。规则已写入 bun-workspaces §1.4：任一树跑过对方 installer 后必须重跑自家 installer
- 门禁全绿：typecheck（root+apps）/lint 0-0/主仓 93(+1 钉住)/组件 46/apps 77(+1)/build/storybook/sync:schema:check/单实例守卫

**最新变更(2026-09-06，第五十六批：libsuggest 建议队列建立——宿主→内核单向协作通道)：**

- **新目录 docs/libsuggest/**：存放宿主对 jdm-\* 库的改动建议，内核会话周期读取；README 定义文档格式（S 编号/状态机 proposed→accepted→done/rejected）与分工边界（宿主只新增，内核改状态）
- **初始队列 3 条**：S001 跨 react 主版本消费类型合规（dt-empty.tsx 全局 JSX.Element 整改 + dist 消费守卫 CI 立项——内核保持 react 19 决策下的 18 兼容自证方案）/ S002 zod 4.3.6 对齐（附第五十六批中断前的完整迁移证据：362/362 绿）/ S003 appshell stories 内核 pnpm 树 typecheck 断链（Meta/StoryObj 重导出链中断，疑 peer-hash 变体）
- **背景**：内核侧 react/zod 对齐实验（第五十六批）经用户决策中止并完整还原（内核仓零残留）；'内核保持 19'为既定方向，兼容机制转为建议文档流转
- docs/README 索引新增 libsuggest 节

**最新变更(2026-09-06，第五十五批：仓内共享依赖 catalog 化——声明层分叉清零)：**

- **catalog 建立**：根 package.json 顶层 `"catalog"` 四项——`typescript 5.9.3` / `zod 4.3.6` / `@gorules/zen-engine 0.51.5` / `bun-types 1.4.2`（全部**精确钉版**）；根与 apps/editor、apps/zen-rule 的对应声明改写为 `"catalog:"`
- **消除的声明分叉**（catalog 前的范围现状）：typescript 根 ^5.9.3 vs apps/zen-rule ^5.7.0；zod 根 ^4.3.6 vs apps/editor ^4.4.3；bun-types 双 app `latest`（非确定性，解析出 1.4.0/1.4.2 双份）；zen-engine 双 app 重复声明
- **关键实证：catalog 范围不收敛**——`^4.3.6` 仍允许 apps/editor 保留已解析的 4.4.3（范围内合法，bun 不动）；改精确 `4.3.6` 后才强制重解析为单版本。**catalog 条目必须精确钉版**已写入最佳实践
- **第三方嵌套副本辨析**（非 workspace 分叉，无需消除）：typescript 5.8.2 = @microsoft/api-extractor 内嵌；bun-types 1.4.0 = @types/bun 内嵌；zod 3.25.71 = **内核 jdm-editor 自声明 zod 3.x**（宿主 4.x）——跨仓分叉记录在案，内核侧声明对齐待批准（与 react 对齐同批处理）
- 门禁全绿：typecheck（root+apps）/lint 0-0/主仓 92/组件 46/apps 76/build/storybook/单实例守卫（apps/editor zod 4.4.3→4.3.6 降级无破坏）
- 文档：bun-workspaces §1.3 重写（catalog/overrides 双工具分工表 + 精确钉版守则）、§8 +2 行；docs/03 本批全录

**变更(2026-09-06，第五十四批：isolated 单实例收敛——overrides 穿透实证 + 单实例守卫进 CI)：**

- **问题显性化**：isolated 切换后宿主 react 18.3.1 与内核 jdm-editor 钉版 devDep react 19.2.8 在 store 中并存两份（react/react-dom 各 2，@floating-ui/react-dom、@monaco-editor/react 等沿 peer 链各出 2 个 hash 变体）——hoisted 时代被"提升盖掉"的双实例显性化
- **根 overrides 强制统一**：package.json overrides 补 `"react": "^18.3.1"` + `"react-dom": "^18.3.1"`（与既有 @types/react×2 并列）→ 内核成员本地 react 从 19.2.8 **重链到 18.3.1**；全量重装后 store 四关键依赖全部 =1（react/react-dom/@types/react/@lezer+common，孤儿条目一并清除）
- **重要结论修正**：bun 1.4.2 下 overrides **穿透 workspace 成员**（含成员 devDeps）——第四十二批"不穿透"结论作废；bun 与 pnpm 收敛能力无差距；多候选 paths 与"类型层钉实例"手段随之彻底退役
- **单实例守卫**：`scripts/check-single-instance.ts`（扫 store 断言 react/@types/react/@lezer×3/@codemirror×3 共 10 项版本数 =1）→ `bun run check:single-instance` → validate.yml 两 job 在 install 后各插一步；分叉在 PR 期暴露而非运行期
- **原理沉淀**：isolated 下单实例 = lockfile 解析到同一版本 → 同一 store 条目双方 symlink；隔离不制造双实例，声明分叉才制造
- 门禁全绿：typecheck（root+apps）/lint 0-0/主仓 92/组件 46/apps 76/build/storybook/守卫脚本 ✓
- 文档：bun-workspaces §1.3/§3.4 重写（收敛阶梯换序）、§4 表两行修正、§8 +2 行；link-runtime §8 +2 行；docs/03 本批全录

**变更(2026-09-06，第五十三批：双仓安装语义统一——isolated linker 切换 + CI bun 版本对齐 1.4.2)：**

- **isolated linker 启用**：bunfig.toml `[install] linker = "isolated"`（bun 1.4.2）——与内核仓 pnpm 安装语义对齐；重装后 appshell 成员本地 junction 实装全部声明依赖（react/@types/react/vitest/fake-indexeddb），根 react 仍 18.3.1 物理唯一；锁文件重装零漂移（linker 只改布局不改解析）
- **CI bun 版本对齐**：validate.yml 两处 1.3.14 → 1.4.2（本地与 CI 漂移清零；用户已升级本地 bun）
- **两笔连带修复**（isolated 将历史暗债暴露为显性错误——恰为切换的收益验证）：① `src/main.tsx` 幽灵导入 `@gorules/zen-engine-wasm` → 补根 deps 显式声明 ^0.23.1（store 已有同版本，锁文件 +1 条目）；② `@lezer/common` 双实例（store 并存 1.2.3/1.5.2——内核直连 1.5.2 而 `@lezer/lr`/`@gorules/lezer-zen` 被陈旧锁文件嵌套钉版 1.2.3，类型不兼容 5 处报错）→ `bun update @lezer/common` 刷新统一 1.5.2（与内核 pnpm-lock 一致）
- **paths 补丁退役**：根 tsconfig 删除 hoisted 时代 6 条压平映射（react/jsx-runtime、@lezer/common|lr、monaco×2——均为悬空路径），保留 4 条源码直通映射（`@/*` + 3 条 `@republicroad/*`）；多候选 paths 数组时代结束
- **bun script shell 陷阱（新坑存档）**：package.json scripts 由 bun 自带 shell 执行，未加引号的 `**` 会被 glob 展开——`test` script 的 `--path-ignore-patterns '**/jdm-editor/**'` 补引号（否则 Windows 下 "File name too long"）
- **门禁全绿**：typecheck（root+apps）/lint 0-0/主仓 92/组件 46/apps 76/build/storybook/dev 冒烟（API 200 + VITE 200 + monaco 静态资源 200 + vite-plugin-static-copy 103 项穿 junction 正常）
- **文档**：bun-workspaces §3.5 备案→启用（实证表 + 回滚预案）、§7 CI 段更新、§8 +2 行；ts-compile-link-runtime §4 布局表更新 + 两笔连带修复记录
- 冒烟进程教训：`Start-Job` 后台作业绑定当次 pwsh 进程，调用结束即被回收（dev server 随之死亡）——跨调用存活须用 `Start-Process` 分离式启动 + 文件日志重定向

**变更(2026-09-04，第五十二批：自动保存 + 版本治理——快照历史闭环（方案 A）)：**

- **自动保存（宿主 decision-simple）**：dirty 签名比对（`JSON.stringify(graph)` 缓存）+ **30s 防抖**触发 `persistToRemote({auto:true})`——手动/自动保存共用持久化纯函数；auto 失败静默、成功推进 `remoteSource.revision` 乐观锁基线（关键细节：不推进则手动保存必 CONFLICT 误报）；面板打开（historyOpen）时暂停不干扰查看
- **版本标记契约**：appshell `GraphRecordMeta.auto?: boolean` + adapter（HttpGraphMeta/toMeta/listVersions）三处透传；服务端 `StoredGraphMeta.auto`、`GraphSaveSchema.auto`、`GraphVersionSchema.auto`、`GraphMetaSchema.auto` 全链放行
- **保留策略治理（服务端）**：`AUTO_VERSIONS_KEEP=20`（导出可测）；`pruneAutoVersions`——全部 manual 保留 + 最近 20 条 auto，超限删最旧 auto 归档文件；每次 saveGraph 尾部执行
- **测试**：apps +4（保留策略：21 归档=1 manual+20 auto、v2 治理删除、auto 标记在 head 与归档）+ 组件 +1（auto 徽标/manual 无徽标）+ graph-persistence ±（session round-trip 已有）——注意归档时序语义：PUT(N) 归档的是 **v(N-1) 旧 head**（auto 标记随旧 head 走）
- **门禁**：tsc/lint 0-0/主仓 92(+3 auto 徽标用例)/组件 46(+1)/apps 76(+3 治理+透传)/build/storybook/sync:schema 全绿
- **约束遵守**：本批**全部提交仅存本地**（editor 仓），不推送远程（用户指令）；doc 数字修正——宿主测试现为 92
- **Backlog 登记**：idle 检测触发、按天合并版本、auto→manual 升格、diff 对比——待真实使用反馈
- 教训存档：**PUT(N) 归档的是 v(N-1) 旧 head**（auto 标记随旧 head 走）——断言/治理都要按"归档滞后一拍"推演；空 nodes 图 wasm 会 500（诊断时的预期行为）

**最新变更(2026-09-04，第五十一批：C1 遗留收口（TabRequest 快照）+ editor 版本线独立（0.1.0）+ reui 转正默认分支)：**

- **TabRequest 快照收口（内核 99e48c6）**：新增 `request-session-draft.ts`（build/apply 纯逻辑 + `useRequestSessionDraftSerializer` 封装）；TabRequest 注册 `'request'` tab slice——序列化 700ms 防抖窗口的在途编辑（schema 草稿/示例 JSON 草稿/描述/活动页签），保存入库、重开恢复；内核 vitest 三用例（编辑器树跑内核 vitest 为已知双 React 基线失败，新用例单独跑绿）；docs/16 遗留观察项关闭
- **editor 版本线独立（0.1.0）**：semantic-release 退役（删 `semantic-version.yml` + `.releaserc.json` + 7 个 devDeps，bun.lock 同步 −856 行）；package.json 版本 `1.16.1`→`0.1.0`（0.x 家族：内核 0.3.1/appshell 0.1.0/editor 0.1.0——硬分叉独立线，不与上游 1.16.x 混淆）；CHANGELOG.md 归档注记（1.x = 上游继承记录）
- **reui 转正**：tag `v0.1.0` + GitHub release（fork 独立版本线起点声明）；**default branch → reui**（gh api PATCH，master 退役冻结于上游 1.16.1 不删除）；README 版本叙事更新（版本线/分支策略改写）
- 门禁：本地全链绿——typecheck/lint 0-0/主仓 89/组件 45/apps 73/build/storybook；**双 CI 绿**——editor Validate（33879465651）+ 内核 Validate（33839861246 起的系列，TabRequest 提交 99e48c6 后首跑绿）；**待用户**：npm login 后发布 appshell 0.1.0 + dev 实机手验清单

**最新变更(2026-09-04，第五十批：规则历史重设计——快照化历史（1a+4b）+ 版本历史面板（3b）+ C1 关闭)：**

- **需求确认**：历史 = 完整现场快照（1a+4b）；UI = 版本历史面板（3b）；自动保存与 diff 对比记 backlog；C1（request Schema 保存丢失）**复现取消**（该节点实现历经三轮重写，旧记录已无代码继承），由重设计吸收关闭
- **上游 serializer 契约接入**：内核 `GraphRef.serialize()/restore()`（上游 PR #239 设计）返回 `DecisionGraphSnapshot`——UI 现场半边（viewport/页签/各页签 slice），与图数据（受控 value）刻意分离；本批宿主首次接入该公开 API
- **保存链**：`content.session = graphRef.serialize()`（兄弟键存储，图数据仍走受控 value）；**加载链**：`setGraph(content)` 后 `graphRef.restore(session)` 恢复现场（viewport/页签/滚动），旧记录无 session 降级跳过
- **服务端**：`GraphContentSchema` 放行 `session` 兄弟键；**simulate 链路（DecisionContentSchema）明确不接收 session**——zen-engine wasm 对 content 未知键敏感（InvalidArg 实证），session 仅存存储链路
- **appshell**：新增 `ui/sheet.tsx`（radix dialog 侧滑，@radix-ui/react-dialog 新入 deps）+ `components/version-history/version-history-panel.tsx`（受控组件：versions/currentRevision/loading/onRestore 由宿主喂入，adapter 装配留宿主）；barrel 导出
- **宿主 decision-simple**：Versions 下拉 → 面板触发按钮 + Sheet 面板（恢复沿用确认对话框语义）；保存/加载链接 session
- **测试**：component-tests +5（面板列表/当前版标记/恢复回调/空态/加载态）、apps +1（session 透传落盘+detail 原样）、graph-persistence +3（session round-trip/无 session 降级/content 内嵌剥离）
- **C1 关闭记录**：docs/16 状态翻转（历史记录保留 + 处置方式 + 遗留观察项：TabRequest 未注册 useTabSerializer，快照不覆盖 input 在途编辑窗口——内核会话单点任务 ~30 行，需则交接）；docs/15 新增 §7.5 快照持久化
- 门禁：本地全链绿——typecheck/lint 0-0/主仓 89(+3)/组件 45(+5)/apps 73(+1)/build/storybook/sync:schema:check；**未推送部分随本批一并推送**

**最新变更(2026-09-03，第四十七批：appshell 迁入内核仓——jdm-editor/packages/appshell 同仓共发布)：**

- **架构决策**：appshell 与内核强耦合（peer 依赖 + 协同设计 + 同节奏），迁入内核仓对齐 Nx/Turbo"同仓拥有全部可发布包"流派；editor 仓回归"app + 子模块消费"形态
- **内核侧**（b4fe3d9/9fc7784，85 文件）：`packages/appshell` 全量迁入（src/scripts/README/LICENSE/配置）；`validate.yaml` 增 Appshell typecheck/build 门禁（pnpm --filter 按包名）；pnpm-lock 吸收 appshell 依赖树（corepack pnpm 10.34.5 `--lockfile-only` 更新，本地无全局 pnpm 的替代手法）；`lerna publish from-package` 天然识别未发布的 appshell 0.1.0——同仓共发布
- **appshell tsconfig 简化**：去 extends（消除双仓 tsconfig.base 歧义）自包含；paths 仅剩一条内核源码直通 `../jdm-editor/src/index.ts`（兄弟包语义，editor/内核两布局同指）；react/@lezer/monaco 映射全删——改常规就近解析，两棵树（editor bun 树 / 内核 pnpm 树）天然单实例
- **editor 侧 rewiring**：`git rm packages/appshell`；workspaces 删 `packages/*`（`jdm-editor/packages/*` 自动收编 appshell）；根 tsconfig appshell 双映射/include 重指子模块路径；`sync:schema` OUT_FILE、`.storybook/preview.ts` css、component-tests ×4 深路径全部重指；eslint 删 appshell 作用域（appshell 归内核仓 eslint——其全局 eslintrc 规则宽松，appshell 代码零配置合规）
- **归属原则实证**：appshell 的 67 个测试随包归内核（宿主 src 测试 152→85）；appshell 的 lint 归内核仓 eslint；宿主 CI 只验证宿主消费假设
- **历史语义化重写（appshell 迁移收口）**：内核 reui 的 9fc7784..b31de5b（7 提交，含 prettier 3.8 错误探索往返）以软重置法重写为 4 个语义提交——`feat(appshell) 入仓`（全部修正折叠）/ 并行会话 storybook 修复 ×2（cherry-pick 原样保留）/ `style: prettier 3.5.3 全仓对齐`（e82aa6f+a4371c3 净值，3.8 探索从历史消失）；**树等价断言通过**（`git diff b31de5b HEAD` 为空 = 纯历史语义化零内容变化）；`--force-with-lease` 推送 + editor gitlink 紧随 bump（3597db2）；回滚备案分支 `backup/reui-pre-squash`（本地保留）。教训：**跨仓 force-push 后必须同会话完成 gitlink 联动**，避免子模块悬空窗口
- 门禁：本地全链绿——typecheck/lint 0-0/主仓 85（=152−67 随包归内核）/组件 40/apps 72/build/storybook/sync:schema:check（新路径 ✓）；内核侧 build ✓（bun 树验证）；**双 CI 最终全绿**——editor Validate（33839880057）+ 内核 Validate 重写后首跑（33839861246，5m22s 全套）
- 教训存档：PowerShell 单对数组扁平化（守卫 `$pair.Count -ge 2` 拦截破坏但静默跳过替换——批量改写后必须 grep 残留复核）

**最新变更(2026-09-03，第四十六批：内核 0.3.0 同步 + 方案 D（`#` subpath imports）+ 宿主源码直通切换)：**

- **内核 0.3.0 同步**：嵌套子模块检出 v0.3.0→987d55c（0.3.0 后 A-D 批：npm-smoke registry 模式、storybook GitHub Pages、CF 拖拽 sortable、operator-expression 单测、CI 缓存）；lockfile 零漂移（workspace 成员版本不入锁，frozen 幂等）
- **方案 D 落地（内核 246a058，81 文件）**：内核 76 文件 `@/` → `#`（Node subpath imports，按最近 package.json 解析、规范级 per-package 零碰撞）；内核 package.json 新增 `imports` 字段（`#icons`/`#components/ui/*`/`#lib/*`/`#reui/icons/*`，**显式扩展名**——TS 对 imports 通配目标不做扩展探测，响亮失败优于静默）；内核 tsconfig paths `@/*`→`#*`（双声明：shadcn CLI aliases 校验对 paths，代码实际走 imports 字段，同指零分歧）；两处 components.json aliases→`#...`（CLI 写入口径）；.storybook 删 `'@'` alias（vite 5.1+ 原生解析 `#`）
- **Spike 结论先行**：TS 类型解析 ✓ / vite lib build ✓ / dist 零 `#` 残留 ✓（构建期消化，外部宿主无感知）/ 内核 vitest 156 failed = 迁移前基线完全一致（宿主树双 React 结构问题，对照实验已证与 `#` 无关）
- **宿主源码直通切换（类型桥退役）**：根 tsconfig `@republicroad/jdm-editor`→内核 src/index.ts；删 `tsconfig.kernel.json` 与 `typecheck:kernel` 链；桥内三项保护映射上收根 tsconfig（react/jsx-runtime 压平 18、`@lezer/common|lr` 钉单实例、monaco 保留）+ include 补内核 5 个 ambient d.ts；appshell tsconfig 内核映射同步改 src/index.ts（bun mock 绑定一致性）；appshell peerDeps `>=0.3.0`（monaco peer 正式化）
- **A2/L2/2.3 未随 0.3.0**（gru-hl-view 仍在/`--grl-*` 契约未动）——登记 0.4.0 观察项，appshell 自定义节点全用 shadcn token，届时预期零成本
- **文档**：alias-mechanisms 篇新增方案 D 章节 + 四方案对照 + 决策记录修订；新增[决策复盘：Subpath Imports](./bestpractice/decision-retrospective-subpath-imports.md)（六轮演进 + 为什么 D 不是第一推荐 + 五条可迁移教训）；bun-workspaces 篇新增；新增[TS imports 字段解析语义](./bestpractice/ts-imports-field-resolution.md)（扩展探测/通配字面填充/不回落 paths）
- **文档收尾（D 事件闭环）**：docs/06 §7 重写（tsc 行改回"类型来自源码"；配置清单/排障表按方案 D 更新——`#` TS2307 = imports 映射缺失）；multi-package 构建篇 §3 类型桥降级为备案注记；appshell README 宿主要求 `>=0.3.0` + 消费契约（dist = 公共承诺）
- **dev 实机冒烟（首次实跑）**：`bun run dev` 两轮——HTTP 200 + root div ✓；`/src/main.tsx` 转换 200（首触 6s 预构建，10.7KB）✓；dev 日志零错误 ✓（内核 `#` 导入 dev 链解析首次实跑通过）；进程树 taskkill 清理 ✓。**留手验**：7 节点渲染/模拟器/三皮肤切换/ocean 接管/暗亮（体验面）
- **发布工程（B 轨）**：appshell 新增 `scripts/npm-smoke.mjs`（借内核模式，pack/registry 双模式，17 项契约断言）+ LICENSE + `test:npm-smoke` 脚本。**三实战发现**：① npm pack **不应用** publishConfig 字段重写（pnpm 特性）→ 形态反转——main/types/exports 正式指 dist，dev 直通全走 tsconfig paths（与内核形态统一，零场景受损）；② exports map 封锁子路径暴露根 tsconfig 通配模板双写 src 笔误（此前靠 node_modules 兜底侥幸绿）→ 模板修正 `["./packages/appshell/*"]`；③ api-extractor bundleTypes 分析跨包闭包崩溃（内置 TS 5.8.2 vs 项目 5.9.3）→ 回退多文件声明 + smoke 聚合断言（dist/**/\*.d.ts）。npm-smoke **17/17 PASS\*\*（1 WARN：浏览器产物 node 求值依赖 monaco 无 node 入口，非 appshell 契约，设计内降级）
- **发布动作待用户**：`npm login` → `cd packages/appshell && npm publish --access public` → `bun run test:npm-smoke 0.1.0`（registry 模式复验已发布版本）
- 门禁：本地全链绿——typecheck（源码直通一次通过）/ lint 0-0 / 主仓 152 / 组件 40 / apps 72 / build 27s（较桥时代 1m39s 显著提速）/ storybook 43s / 内核 build ✓ dist 零 `#` 残留 / CI Validate 绿（33770373760）+ 本批随推复验

**最新变更(2026-09-03，第四十五批：同步内核 1c072ef + editor reui 首推 + A′ 决策落档)：**

- **子模块同步**：reui tip 16bcd05→1c072ef（并行会话 0.3.0 路线图批次 B1-B3/R2-R4：lib-mode manualChunks 实验结论、custom-function 键盘拖拽、simulator story 离线、Playwright probes 收编、expression-store 单测；19 文件 +818/−29）——**宿主可见面零变动**（barrel/theme 未动、`@/` 仍 76 文件、components.json/tsconfig 未动）
- **editor reui 首推**：`git push -u origin reui` 建立远端分支——本地 6+2 提交首次过 CI reui 门禁（此前远端无 reui 引用，本地孤本=门禁豁免缺口，已修）
- **CI 首跑暴露并修复 4 项（门禁价值实证）**：
  1. _lockfile 漂移_（a4e5faa）：内核新批次 devDep 增 rollup-plugin-visualizer，`--frozen-lockfile` 失败——指针提升后须重跑 `bun install` 同步 lockfile
  2. _@lezer 双实例_（9f9cf3a）：CI 全新安装布局下 `@lezer/lr` 嵌套 `@lezer/common@1.2.3` 与顶层 `1.5.2` 形成 Tree/ParseWrapper 类型冲突（本地增量安装恰为旧布局故绿）——桥 tsconfig paths 钉顶层单实例（与 react 手法一致）
  3. _内核 vitest 门禁归位_（ba8344e）：宿主树内嵌 react 19 devDep 致双 React 实例，宿主 CI 结构性不可绿；内核仓 validate.yaml（pnpm 树 vitest 全套）已权威覆盖——宿主 CI 移除该步骤，内核消费假设由宿主桥 typecheck + build 验证
  4. _schema-sync 路径遗漏_（ef879b6）：Phase 2 搬走 `src/assets/custom-node-schema.json` 未同步脚本路径（独立 bun 程序在 tsc 程序外，typecheck 抓不到；本地 gates 当时漏跑此项）——OUT_FILE 改指 packages/appshell/src/assets/
- **A′ 决策落档**：内核处于 0.3.0 活跃冲刺期（1 天 7 commits），**维持类型桥（C）为现行架构，`@kernel/*` 命名空间别名（A′）缓期至内核 0.3.0 发布后作为协调变更项**——业界实践：活跃开发期的共享包不做集成机制变更，跨仓重构在发布边界执行（届时一次 PR 完成 76 文件 + components.json + tsconfig paths + 宿主侧源码直通切换）
- 门禁：本地全链绿（新内核 1c072ef）+ **CI Validate 首次全绿**（33754834500）

**最新变更(2026-09-03，第四十四批：换肤体系——SkinDefinition + 节点UI槽位劫持 + 切换示范)：**

- **skin 模块（appshell）**：`skin/types.ts`（`SkinDefinition { id, label, seeds?, tokens?, nodeOverrides? }` + `NodeUiOverride { renderTab?, renderNode? }`；ThemeSeeds 内核 barrel 未导出，按公开形状本地镜像为 SkinSeeds）+ `skin/apply.ts`（`applyNodeOverrides` 纯函数：按 kind 只替换显式槽位、未命中保原引用、不改入参）+ 5 单测
- **theme.provider 升级**：props 增 `options { skins?, defaultSkinId? }`，context 暴露 `skins/skinId/setSkinId/activeSkin`；activeSkin.seeds→`JdmConfigProvider seeds`、tokens→`theme.token`（seeds 派生与显式 token 共存，token 优先）；无 skins 时与纯主题模式逐字节一致
- **useCustomNodes 接线**：合成 customNodes 后经 `applyNodeOverrides(nodes, activeSkin?.nodeOverrides)` 应用——皮肤劫持对专属节点与 schema 容器节点一体生效；无 Provider 兜底空覆写
- **宿主示范（decision-simple）**：三套皮肤——default / 品牌紫(#7c3aed) / 海洋蓝(#0369a1 + `current_date.renderNode` 劫持)；`src/components/skins/ocean-current-date-node.tsx` 宿主接管组件（GraphNode 蓝调卡 + 接管标识 + key/仿真值回显）；顶栏 Palette 下拉一键切换（skins 由 main.tsx 宿主注入）
- 门禁：typecheck:kernel/typecheck/typecheck:apps、lint 0 err/0 warn、主仓 152(+5)/组件 40/apps 72 全 pass、build ✓、build:storybook ✓；**未提交，待安排**

**最新变更(2026-09-03，第四十三批：appshell 独立包抽取——@republicroad/jdm-appshell)：**

- **建包**：`packages/appshell`（`@republicroad/jdm-appshell` v0.1.0）——main/types 直指 `src/index.ts`（monorepo 内源码直通），`publishConfig` 发布态切 dist；peerDeps = react/react-dom/内核(>=0.2)；vite lib 构建（react+内核外部化，产物 index.js 828KB + index.d.ts + style.css）；根 workspaces 增 `packages/*`
- **纯搬移（git mv 保历史，73+ 文件）**：shell 全家、useCustomNodes、custom-node 9 组件、UI kit（components/ui 18 + components/reui 14 + components/icons 2 + reui/icons 4 + custom-node.module.css）、lib 11（plans/registry/schema-source/types/user-resolver/storage-key/三协议/auth+auth-client/utils）、theme.provider、JSON 夹具 assets/custom-node-schema.json——app 页面反向消费包（deep path 导 ui、barrel 导 shell/nodes/theme）
- **`@/` 别名清零**：包内 34 文件 `@/components|lib|reui` 相对化（发布包零工具链耦合）；根 eslint 豁免作用域同步迁至 packages/appshell/\*\*
- **接线与断点**：根 tsconfig paths 增 `@republicroad/jdm-appshell(/*)` 双映射 + include 增包 src；.storybook preview.css 路径、stories×2、component-tests 深路径、graph-persistence(+test) 深导入 `@republicroad/jdm-appshell/src/shell/persistence`（barrel 会拉内核运行时，bun test 必须走深路径）
- **bun 就近 tsconfig 断点**：组件测试经 packages/\*\* 加载后 bun 取 appshell tsconfig（无内核映射）→ 内核真实源码被解析、monaco d.ts 当 JS 执行崩溃——appshell tsconfig 补 `paths: @republicroad/jdm-editor → ../../tmp/kernel-types/index.d.ts` 后恢复（mock 按解析路径绑定，两端必须一致）
- 门禁：typecheck:kernel/typecheck/typecheck:apps、lint 0 err、主仓 147/组件 40/apps 72 全 pass、build ✓、build:storybook ✓、appshell lib build ✓（style.css 命名与 exports 对齐）；**未提交，待安排**

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
