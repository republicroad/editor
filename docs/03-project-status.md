# 项目状态

> 快照时间：2026-08-07

---

## 1. 当前环境

### 1.1 分支状态

| 仓库 | 当前分支 | 基于分支 | 说明 |
|------|----------|----------|------|
| editor（主项目） | `zrule` | `master` | 前后端 TypeScript monorepo 开发分支 |
| jdm-editor（子模块） | `zrule` | `master` | 外部化改造分支（与主项目同分支开发） |

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
| monaco-editor | 0.52.2 | 锁定版本（Monaco 本地化加载） |
| vite-plugin-static-copy | 4.1.1 | 稳定（构建期拷贝 Monaco 静态资源） |

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
| `opencode` | 定制化开发分支 | 历史（功能已并入 zrule） |
| `mono_v1` | Monorepo 实验 | 历史 |
| `workspace_v1/v2/v3` | 工作空间实验 | 历史 |

### 4.2 jdm-editor 分支

| 分支 | 说明 | 状态 |
|------|------|------|
| `master` | 上游发布分支 | 活跃 |
| `zrule` | 外部化改造 + 前后端 TS 开发分支 | **当前** |
| `standalone` | 开源发布分支 | 活跃 |
| `opencode` | 定制化开发分支 | 历史（功能已并入 zrule） |

---

## 5. 构建状态

### 5.1 前端

- **构建命令**: `bun run build`（= `tsc && vite build`）
- **输出目录**: `static/`
- **状态**: 正常
- **类型检查**: 根 tsconfig 启用 `noImplicitAny: true`（全项目严格检查，含 paths 映射引入的子模块源码）；`@gorules/lezer-zen`/`@gorules/lezer-zen-template` 无内置类型，由子模块 `src/lezer-zen.d.ts`（声明 `parser: LRParser`）+ `zen.ts` 顶部 triple-slash 引用解决
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
- lezer-zen / lezer-zen-template / zen-engine-wasm 源码已从工作区移除（opencode 与 zrule 分支均如此），改为外部 npm 固定版本依赖

### 6.2 待办事项
- [ ] Hono 后端生产化（当前为实验状态）
- [x] lezer-zen 源码移除并迁移为外部 npm 依赖（子模块 `e21bd87`）
- [x] zen-engine-wasm 源码移除并迁移为外部 npm 依赖（子模块 `e21bd87`）
- [ ] 完善单元测试覆盖
- [ ] 补充 Storybook 组件文档
- [x] 修复 vite build 预存在问题（vite-plugin-dts 加载失败；子模块构建已正常产出 dist/）
- [x] CI 迁移提交（`.github/workflows/validate.yml` pnpm→bun，见 `c0f8d89`）
- [ ] `/api/auth/get-session` 由 Mock 用户升级为真实会话（better-auth 服务端 + 数据库）

---

## 7. 最近活动

### 7.1 主项目最近提交

```
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

**最新变更（2026-08-07）：**
- 开发分支切换（`c0f8d89`）：editor 主项目由 `opencode` 切换到 `zrule` 作为开发分支，`.gitmodules` 中子模块分支同步设为 `zrule`；`.github/workflows/validate.yml` pnpm→bun 迁移并提交（`oven-sh/setup-bun@v2` + bun 1.3.14 + `bun install --frozen-lockfile`，lint / typecheck / typecheck:apps / test:zen-rule）
- 数组化自定义函数表达式 + 旧 `;;` 上传迁移（`760897e` 主项目 + `89dcc30` 子模块）：`CustomNodeExpression.value` 由 `string` 扩展为 `string | string[]`；上传/导入经 `normalizeGraphNodes`（主项目 `src/helpers/graph.ts`）与 `normalizeCustomNodeExpressions`（子模块 `dg-store`）自动把旧 `;;` 字符串拆分为数组；`parseOperatorArgs`/`toFunctionCallValue`/`defaultCustomNodeConfig` 改为数组化；子模块新增 `toOperatorExprArray/String/Display`、`parseOperatorExprInput`（JSON 数组编辑 + 旧格式兼容），`isFunctionExpressionValue` 接受数组；zen-rule `parseOperatorExpr` 支持数组原样返回，新增 `custom_double_semicolon.json` 夹具
- jdm-editor 单包 workspace 化（`e21bd87` 子模块 + `b0b315c`）：移除 `packages/lezer-zen` / `lezer-zen-template` / `zen-engine-wasm` 源码，三库改为外部 npm 固定版本（0.8.1 / 0.4.0 / ^0.23.1）；root 加 `workspaces` 字段，build/typecheck/test 改 bun 原生脚本（`bun run --cwd packages/jdm-editor ...`）；保留 `pnpm-workspace.yaml` + `lerna.json` 与上游对齐；单独构建 `cd jdm-editor && bun install && bun run build` → `packages/jdm-editor/dist/`
- Monaco 本地化加载（`2e67e55`）：monaco-editor 锁定 0.52.2，从版本化路径 `/monaco-editor@0.52.2/min/vs/**` 加载，`vite-plugin-static-copy` 构建期拷贝；`vite.config.ts` 通过 createRequire + 入口解析 + 向上爬目录定位 monaco 包（兼容 Node ≥18，规避 0.56.0 的 exports map 解析问题）
- Custom node registry + function mode（`0292f98`）：新增 `custom-node-registry.tsx`（`schemaToCustomNodes`/`fetchCustomNodeSchema`，失败回退 `custom-node-schema.json`）、`custom-node-types.ts`、`useCustomNodes` hook、`CustomNodeSummaryCard`；`decision-simple.tsx` 将 schema 的 `customFunctions` 传入 DecisionGraph
- custom function table editor（`3f59467`，子模块）：新增 `custom-function-table/` 组件（函数下拉、参数编辑器、结果浮层、expression-store 状态）；`customFunctions` 经 `DecisionGraphWrapper` 透传 renderTab（`tab-custom-function-table.tsx`）；`expr_asts` smartSplit 回写；`editExpression` 按钮文案本地化

**jdm-editor 库（zrule 分支）：**
- UserResolver 类型 + store + wrapper + exports
- components override 机制（specOverrides in TabContents）
- customNode renderTab 路由（.otherwise() 检查 customNodes by kind）
- Input Schema 扩展 → 完整 Request 节点改造（TabRequest 3-Tab 编辑器）
- request-schema.ts（~1,010 行）+ json-schema.ts（~66 行）
- i18n 基础设施（zh/en 翻译）
- Simulator Request Panel 升级（~700 行，含 Format/Sync/Save/Copy/Run）

**编辑器项目（最近已提交部分）：**
- better-auth 客户端 + UserResolver 工厂
- DecisionGraph 集成 userResolver prop
- Bun 后端 Elysia → Hono 迁移（`hono` + `@hono/zod-openapi` + `@scalar/hono-api-reference` + `zod`，移除 `elysia`/`@elysiajs/*`）
- 新增 `GET /api/auth/get-session`（Mock 开发用户），打通 better-auth UserResolver 链路
- 新增请求日志中间件 + `onError` 统一错误日志（打印方法/路径/状态/耗时与异常堆栈）
- 修复 `/api/decision` 缓存逻辑 bug（原 `content` 未定义、`decision` 作用域错误）与 `contentType` 校验过严问题
- `.github/workflows/validate.yml`：pnpm→bun 迁移（已随 `c0f8d89` 提交，含 lint / typecheck / typecheck:apps / test:zen-rule）
