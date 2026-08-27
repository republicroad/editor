# 项目架构文档

## 1. 系统架构总览

GoRules Editor 采用三层架构设计：

```
┌─────────────────────────────────────────────────────────┐
│                    前端 SPA (React)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  页面组件    │  │  UI 组件    │  │  状态管理       │  │
│  │  (src/)     │  │  (antd)     │  │  (zustand)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────┤
│              jdm-editor 组件库 (git submodule)           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │DecisionGraph│  │DecisionTable│  │  Expression     │  │
│  │  (ReactFlow)│  │  (TanStack) │  │  (CodeMirror)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  Function   │  │ CodeEditor  │  │ zen-engine-wasm │  │
│  │  (Monaco)   │  │  (CM/Monaco)│  │  (Rust→WASM)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                    后端引擎 (Bun/Hono)                    │
│  ┌───────────────────────────────────────────────────┐   │
│  │ apps/editor · zen-rule(@gorules/zen-engine)       │   │
│  │ simulate / decision / graphs / lists / openapi    │   │
│  └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 目录结构详解

### 2.1 主项目 (editor)

```
editor/
├── src/                          # 前端应用源码
│   ├── main.tsx                  # 应用入口
│   ├── pages/                    # 页面组件
│   │   ├── decision-simple.tsx   # 主编辑器页面
│   │   └── not-found.tsx         # 404 页面
│   ├── components/               # 可复用 UI 组件
│   │   ├── page-header.tsx       # 页面头部
│   │   └── stack.tsx             # 布局组件
│   ├── context/                  # React Context
│   │   ├── theme.provider.tsx    # 主题上下文
│   │   └── customnode.tsx        # 自定义节点定义
│   ├── helpers/                  # 工具函数
│   │   ├── graph.ts              # 图类型定义
│   │   └── error-message.ts      # 错误处理
│   └── assets/                   # 静态资源
│       └── decision-templates.ts # 决策模板
├── jdm-editor/                   # 核心组件库(git submodule)
├── apps/                         # 后端与应用
│   ├── editor/                   # Bun/Hono 后端(唯一后端)
│   └── zen-rule/                 # 规则执行工具
├── static/                       # 构建输出
├── vite.config.ts                # Vite 构建配置
├── tsconfig.json                 # TypeScript 配置
├── package.json                  # 项目配置
└── Dockerfile                    # Docker 构建文件
```

### 2.2 jdm-editor 组件库

```
jdm-editor/
├── packages/
│   └── jdm-editor/               # 核心 React 组件库(@gorules/jdm-editor)
│       ├── src/
│       │   ├── components/       # 所有编辑器组件
│       │   │   ├── decision-graph/   # 图编辑器(最复杂)
│       │   │   ├── decision-table/   # 表格编辑器
│       │   │   ├── expression/       # 表达式编辑器
│       │   │   ├── function/         # 函数编辑器
│       │   │   ├── code-editor/      # 代码编辑器
│       │   │   ├── custom-function-table/  # 自定义函数表格
│       │   │   ├── request-table/    # 请求表格
│       │   │   └── shared/           # 共享组件(Diff 控件)
│       │   ├── helpers/          # 工具模块(19个文件)
│       │   ├── locales/          # 国际化资源
│       │   ├── theme.tsx         # 主题配置
│       │   └── index.ts          # 库入口
│       └── package.json          # v1.52.0
├── pnpm-workspace.yaml           # 与上游对齐(bun 读根 workspaces 字段)
├── lerna.json                    # Lerna 配置
└── package.json                  # monorepo 配置
```

> zrule 分支为单包 workspace：`@gorules/lezer-zen`(0.8.1)、`@gorules/lezer-zen-template`(0.4.0)、
> `@gorules/zen-engine-wasm`(^0.23.1)三个库已移除源码，改为外部 npm 固定版本依赖。

---

## 3. 技术栈

### 3.1 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3 | UI 框架 |
| TypeScript | 5.9 | 类型系统 |
| Vite | 7.3 | 构建工具 |
| SWC | - | 快速编译 |
| Ant Design | 5.29 | UI 组件库 |
| React Flow | 11.11 | 图编辑器 |
| Zustand | 4.5 | 状态管理 |
| Immer | 10.1 | 不可变状态 |
| CodeMirror | 6 | 代码编辑器 |
| Monaco Editor | 4.7 | 代码编辑器(可选) |
| React Router | 7.13 | 路由 |
| Graphology | 0.26 | 图数据结构 |
| Zod | 4.3 | Schema 验证 |
| Axios | 1.13 | HTTP 客户端 |

### 3.2 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Bun | 1.3+ | 后端运行时 |
| Hono | 4.12 | HTTP 框架 |
| Zod | 4 | 请求/响应校验(OpenAPI) |
| zen-rule | - | GoRules 决策引擎(纯 TS) |

### 3.3 WASM 技术栈

| 技术 | 用途 |
|------|------|
| wasm-pack | Rust → WASM 编译 |
| zen-engine-wasm | 决策引擎 WASM 绑定 |
| Lezer | 语法解析器生成 |

---

## 4. 核心设计模式

### 4.1 Strategy 策略模式

Bun/Hono 后端(`apps/editor`)是唯一后端，暴露统一的 `/api` 端点：

- `POST /api/simulate`：决策仿真
- `POST /api/decision`：决策推理(支持按 `decisionId` 缓存规则对象复用)
- `GET /api/auth/get-session`：会话查询(当前为 Mock 开发用户，better-auth 兼容格式)
- `GET /api/graphs`：图持久化(**第五批**，宿主管存储，revision + baseRevision 乐观锁)
- `GET /openapi/json`：OpenAPI schema；`GET /openapi`：Scalar API Reference 文档页
- `GET /state`、`GET /input`、`GET /?files`(静态目录文件列表)
- 每个请求打印方法/路径/状态/耗时日志，未处理异常经 `onError` 统一记录堆栈

### 4.2 Context Provider 模式

React Context 管理全局状态：
- `ThemeContext`: 主题偏好(暗色/亮色/自动)
- `JdmConfigProvider`: 编辑器配置(主题、语言、字典)
- `DictionaryProvider`: 自定义字典
- `I18nProvider`: 国际化

### 4.3 Plugin 插件模式

自定义节点扩展通过 `createJdmNode()` API 实现：

```typescript
const customNodes = [
  createJdmNode({
    kind: 'counter',
    displayName: 'Counter',
    group: 'counter',
    icon: <ApartmentOutlined />,
  }),
];
```

通过 `customNodes` prop 传入 `DecisionGraph` 组件。

### 4.4 Monorepo 工作空间模式

```
editor (bun workspace root, workspaces: ["apps/*", "jdm-editor/packages/*"])
├── apps/editor            → Hono API 后端
├── apps/zen-rule          → zen-engine 自定义函数处理库(workspace:* 被 apps/editor 引用)
└── jdm-editor/packages/jdm-editor   → @gorules/jdm-editor(workspace:*)
```

> zrule 分支统一使用 **bun** 管理依赖(单一 `bun.lock`，bun ≥1.3 可识别 pnpm 元数据)。
> `@gorules/lezer-zen`、`@gorules/lezer-zen-template`、`@gorules/zen-engine-wasm` 三个库已外部化为 npm 固定版本依赖，
> 不再作为源码包维护；`pnpm-workspace.yaml` + `lerna.json` 仍保留与上游对齐。

---

## 5. 数据流架构

### 5.1 编辑流程

```
用户操作 → React Flow 事件 → Zustand Store 更新 → 组件重渲染
    ↓
onChange 回调 → 父组件状态更新 → 图数据持久化
```

### 5.2 模拟执行流程

```
用户点击"运行" → GraphSimulator 收集输入上下文
    ↓
POST /api/simulate → 后端接收请求
    ↓
zen-engine 解析 DecisionContent → 执行 DAG 遍历
    ↓
返回 SimulationResult → 前端渲染结果/轨迹
```

模拟器前端(jdm-editor 子模块 `simulator/` 目录)职责划分：

```
SimulatorRequestPanel(编排)
├── useSimulatorRequestBinding      节点 → requestValue 派生链(responseExpressionMap 等)
├── useSimulatorRequestEditor       requestValue 编辑 + 外部同步 + 切源默认值同步
├── useRequestExamplePersistence    用例数据源持久化
└── SimulatorRequestToolbar         运行 / 停止 / 加载用例 / 步进

SimulatorNodesPanel                  节点列表 / 选择与状态图标(独立于请求面板)
```

### 5.3 WASM 客户端执行

```
编辑器加载 → ensureWasmLoaded() 初始化 WASM
    ↓
表达式编辑 → zen-engine-wasm 实时求值
    ↓
Intellisense → WASM 提供类型推断与自动补全
```

---

## 6. 构建架构

### 6.1 前端构建

```
src/ → Vite (SWC) → static/ (HTML + JS + CSS + WASM)
```

- 输出到 `static/` 目录
- 支持 WASM 资源内联
- TypeScript 路径别名解析

### 6.2 后端构建

```
apps/editor/src/index.ts → bun src/index.ts   # Bun/Hono 后端
```

### 6.3 Docker 构建

```
Stage 1: Bun builder → bun install + bun run build(前端静态产物)
Stage 2: Bun slim → 运行时(复制后端源码 + node_modules + 前端静态产物)
```

---

## 7. CI/CD 架构

### 7.1 工作流

| 工作流 | 触发条件 | 功能 |
|--------|----------|------|
| `validate.yml` | PR / push to master, zrule | Bun 流水线(`setup-bun` 1.3.14)：lint + typecheck + typecheck:apps + test(主仓) + apps 测试 |
| `semantic-version.yml` | 手动触发 | 自动版本发布 |
| `build-docker.yml` | release 提交到 master | 构建并推送 Docker 镜像 |

### 7.2 版本管理

- 使用 `semantic-release` 自动管理版本
- 基于 Conventional Commits 规范
- 自动生成 CHANGELOG
- 自动发布到 npm(jdm-editor 包)
