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
│                    后端引擎                               │
│  ┌─────────────────────┐  ┌─────────────────────────┐   │
│  │ Rust/Axum (主后端)   │  │ Bun/Hono (替代后端)      │   │
│  │ zen-engine 0.53     │  │ @gorules/zen-engine     │   │
│  └─────────────────────┘  └─────────────────────────┘   │
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
├── jdm-editor/                   # 核心组件库（git submodule）
├── backend/                      # Rust/Axum 后端
│   └── src/main.rs               # 后端入口
├── apps/                         # 替代后端
│   ├── editor/                   # Bun/Hono 后端
│   └── zen-rule/                 # 规则执行工具
├── static/                       # 构建输出
├── vite.config.ts                # Vite 构建配置
├── tsconfig.json                 # TypeScript 配置
├── package.json                  # 项目配置
├── Cargo.toml                    # Rust 工作空间配置
├── Dockerfile                    # Docker 构建文件
└── Makefile                      # Rust 开发命令
```

### 2.2 jdm-editor 组件库

```
jdm-editor/
├── packages/
│   ├── jdm-editor/               # 核心 React 组件库
│   │   ├── src/
│   │   │   ├── components/       # 所有编辑器组件
│   │   │   │   ├── decision-graph/   # 图编辑器（最复杂）
│   │   │   │   ├── decision-table/   # 表格编辑器
│   │   │   │   ├── expression/       # 表达式编辑器
│   │   │   │   ├── function/         # 函数编辑器
│   │   │   │   ├── code-editor/      # 代码编辑器
│   │   │   │   ├── custom-function-table/  # 自定义函数表格
│   │   │   │   ├── request-table/    # 请求表格（opencode 新增）
│   │   │   │   └── shared/           # 共享组件（Diff 控件）
│   │   │   ├── helpers/          # 工具模块（19个文件）
│   │   │   ├── locales/          # 国际化资源
│   │   │   ├── theme.tsx         # 主题配置
│   │   │   └── index.ts          # 库入口
│   │   └── package.json          # v1.52.0
│   ├── lezer-zen/                # Zen 语言语法解析器
│   └── zen-engine-wasm/          # WASM 引擎绑定
├── Cargo.toml                    # Rust 工作空间
├── lerna.json                    # Lerna 配置
└── package.json                  # monorepo 配置
```

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
| Monaco Editor | 4.7 | 代码编辑器（可选） |
| React Router | 7.13 | 路由 |
| Graphology | 0.26 | 图数据结构 |
| Zod | 4.3 | Schema 验证 |
| Axios | 1.13 | HTTP 客户端 |

### 3.2 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Rust | 2021 edition | 主后端语言 |
| Axum | 0.7 | HTTP 框架 |
| Tokio | 1 | 异步运行时 |
| zen-engine | 0.53 | GoRules 决策引擎 |
| Tower HTTP | 0.5 | HTTP 中间件 |
| Bun | 1.3+ | 替代后端运行时 |
| Hono | 4.12 | Bun HTTP 框架 |

### 3.3 WASM 技术栈

| 技术 | 用途 |
|------|------|
| wasm-pack | Rust → WASM 编译 |
| zen-engine-wasm | 决策引擎 WASM 绑定 |
| Lezer | 语法解析器生成 |

---

## 4. 核心设计模式

### 4.1 Strategy 策略模式

双后端实现，共享相同的 API 接口：
- **Rust/Axum**: 生产环境主后端
- **Bun/Hono**: 开发/实验环境替代后端

两者都暴露相同的 `/api/simulate` 端点。Hono 替代后端（`apps/editor`）额外提供：
- `POST /api/decision`：决策推理（支持按 `decisionId` 缓存规则对象复用）
- `GET /api/auth/get-session`：会话查询（当前为 Mock 开发用户，better-auth 兼容格式）
- `GET /openapi/json`：OpenAPI schema；`GET /openapi`：Scalar API Reference 文档页
- `GET /state`、`GET /input`、`GET /?files`（静态目录文件列表）
- 另起 admin 服务（端口 3001，`GET /`、`GET /admin`）
- 每个请求打印方法/路径/状态/耗时日志，未处理异常经 `onError` 统一记录堆栈

### 4.2 Context Provider 模式

React Context 管理全局状态：
- `ThemeContext`: 主题偏好（暗色/亮色/自动）
- `JdmConfigProvider`: 编辑器配置（主题、语言、字典）
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
editor (pnpm workspace root)
└── jdm-editor/packages/* (Lerna monorepo)
    ├── jdm-editor      → workspace:*
    ├── lezer-zen       → npm package
    └── zen-engine-wasm → npm package
```

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
backend/src/main.rs → Cargo build → target/debug/editor
backend/src/main.rs → Cargo build --release → target/release/editor
```

### 6.3 Docker 构建

```
Stage 1: Rust builder → 编译后端二进制
Stage 2: React builder → 构建前端静态文件
Stage 3: Debian slim → 运行时（复制二进制 + 静态文件）
```

---

## 7. CI/CD 架构

### 7.1 工作流

| 工作流 | 触发条件 | 功能 |
|--------|----------|------|
| `validate.yml` | PR / push to master | Lint + Typecheck + Rust 格式检查 |
| `semantic-version.yml` | 手动触发 | 自动版本发布 |
| `build-docker.yml` | release 提交到 master | 构建并推送 Docker 镜像 |

### 7.2 版本管理

- 使用 `semantic-release` 自动管理版本
- 基于 Conventional Commits 规范
- 自动生成 CHANGELOG
- 自动发布到 npm（jdm-editor 包）
