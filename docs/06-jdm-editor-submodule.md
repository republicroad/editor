# jdm-editor 子仓库文档

> 本文档详细描述 `jdm-editor` 子模块的架构、组件体系，以及 opencode 分支与 master 分支的差异分析。

---

## 1. 子仓库概述

### 1.1 基本信息

| 项目 | 值 |
|------|-----|
| 仓库名 | `@gorules/jdm-monorepo` |
| 包管理 | 本地默认 **bun**（root `package.json` 的 `workspaces` 字段）；保留 `pnpm-workspace.yaml` + Lerna 与上游对齐 |
| 当前版本 | v1.52.0 |
| 开源协议 | MIT |
| 上游仓库 | https://github.com/gorules/jdm-editor |
| 本地路径 | `editor/jdm-editor/` |

### 1.2 包结构

```
jdm-editor/packages/
└── jdm-editor/           # @gorules/jdm-editor v1.52.0 — 核心 React 组件库
```

> zrule 分支已与 opencode 对齐：`lezer-zen`、`lezer-zen-template`、`zen-engine-wasm` 三个库不再随仓库源码维护，
> 改为外部 npm 固定版本依赖（见 §3.6「单独构建与发布」）。

### 1.3 分支状态

| 分支 | 说明 | 与 master 差异 |
|------|------|----------------|
| `master` | 上游发布分支 | 基准 |
| `zrule` | **当前分支**（外部化改造分支） | 基于 master；单包 workspace，三库外部 npm 依赖 |
| `opencode` | 定制化开发分支 | +14,485 / -4,235 行，139 文件 |
| `standalone` | 开源发布分支 | 基于 master |
| `brde` | 开发分支 | 同 opencode |

---

## 2. 组件库架构

### 2.1 核心组件层次

```
@gorules/jdm-editor
├── components/
│   ├── decision-graph/           # 图编辑器（最复杂，18 个子模块）
│   │   ├── dg.tsx                # 主组件 DecisionGraph
│   │   ├── context/              # Zustand 状态管理
│   │   │   ├── dg-store.context.tsx   # 图状态 Store
│   │   │   └── serializer.context.tsx # 序列化工具
│   │   ├── nodes/                # 节点系统
│   │   │   ├── graph-node.tsx         # 基础节点包装
│   │   │   ├── custom-node/           # 自定义节点支持
│   │   │   └── specifications/        # 节点规格定义（10 个文件）
│   │   ├── graph/                # 图渲染
│   │   │   ├── graph.tsx              # 图主组件
│   │   │   ├── graph-side-toolbar.tsx # 侧边栏工具栏
│   │   │   ├── graph-tabs.tsx         # Tab 管理
│   │   │   └── tab-*.tsx              # 各类 Tab 实现
│   │   ├── simulator/            # 模拟执行
│   │   │   ├── dg-simulator.tsx       # 模拟器 UI
│   │   │   └── simulator-request-panel.tsx  # 请求模拟面板
│   │   └── diff/                 # Diff 差异系统
│   │       ├── comparison.ts          # 比较算法
│   │       └── utility.ts             # Diff 计算
│   │
│   ├── decision-table/           # 决策表编辑器
│   │   ├── dt.tsx                # 主组件 DecisionTable
│   │   ├── context/              # 表格状态 Store
│   │   ├── table/                # 表格渲染
│   │   ├── components/           # 辅助 UI
│   │   └── dialog/               # 对话框
│   │
│   ├── expression/               # 表达式编辑器
│   ├── function/                 # 函数编辑器
│   ├── code-editor/              # 代码编辑器（CodeMirror/Monaco）
│   ├── custom-function-table/    # 自定义函数表格（opencode 新增）
│   ├── request-table/            # 请求表格（opencode 新增）
│   └── shared/                   # 共享 Diff 控件
│
├── helpers/                      # 工具模块（19 个文件）
├── locales/                      # 国际化资源
├── theme.tsx                     # 主题系统
└── index.ts                      # 库入口
```

### 2.2 状态管理架构

使用 Zustand 管理图状态：

```
dg-store.context.tsx
├── useDecisionGraphState(selector)     # 读取状态
├── useDecisionGraphActions()           # 获取 actions
├── useDecisionGraphReferences()        # 获取引用
├── useDecisionGraphListeners()         # 获取监听器
├── useDecisionGraphRaw()               # 获取原始 store
├── useNodeDiff(nodeId)                 # 节点 Diff 状态
├── useEdgeDiff(edgeId)                 # 边 Diff 状态
└── NodeTypeKind                        # 节点类型常量
```

### 2.3 节点规格系统

每个节点类型通过 `NodeSpecification` 接口定义：

```typescript
type NodeSpecification<T> = {
  type: string;                          // 节点类型标识
  icon?: ReactNode;                      // 图标
  color?: string;                        // 颜色
  displayName: string | ReactNode;       // 显示名称
  shortDescription?: string;             // 简短描述
  renderTab?: (props) => ReactNode;      // Tab 渲染
  generateNode: (params) => DecisionNode; // 生成节点
  renderNode: React.FC<MinimalNodeProps>; // 渲染节点
  renderSettings?: React.FC<{id}>;       // 设置面板
  inferTypes?: { ... };                  // 类型推断
  onNodeAdd?: (node) => Promise<node>;   // 节点添加钩子
};
```

已注册的节点类型（`NodeKind` 枚举）：

| 枚举值 | 类型字符串 | 说明 |
|--------|------------|------|
| `Input` | `inputNode` | 输入节点 |
| `Output` | `outputNode` | 输出节点 |
| `DecisionTable` | `decisionTableNode` | 决策表节点 |
| `Function` | `functionNode` | 函数节点 |
| `Expression` | `expressionNode` | 表达式节点 |
| `CustomFunction` | `customNode` | 自定义函数节点 |
| `Switch` | `switchNode` | 分支节点 |

### 2.4 Diff 系统

节点和边都支持差异追踪：

```typescript
type DiffStatus = 'added' | 'removed' | 'modified' | 'unchanged' | 'moved';

type DiffMetadata = {
  status: DiffStatus;
  // ...其他元数据
};

type Diff = {
  diff?: DiffMetadata;
};
```

共享 Diff 控件（`shared/` 目录）：
- `DiffInput` — 差异输入框
- `DiffRadio` — 差异单选框
- `DiffSelect` — 差异下拉框
- `DiffSwitch` — 差异开关
- `DiffTextArea` — 差异文本域
- `DiffCodeEditor` — 差异代码编辑器

---

## 3. opencode 分支 vs master 分支差异分析

### 3.1 变更总览

```
139 files changed, 14,485 insertions(+), 4,235 deletions(-)
```

### 3.2 opencode 新增的功能模块

#### 3.2.1 Request 节点系统

**这是 opencode 分支最大的新增功能**，包含完整的请求/响应定义管理。

新增文件：

| 文件 | 行数 | 说明 |
|------|------|------|
| `graph/tab-request.tsx` | 1,952 | Request 节点 Tab 主组件 |
| `graph/tab-request.scss` | 411 | Request Tab 样式 |
| `request-table/index.ts` | - | 模块导出 |
| `request-table/expression.tsx` | 125 | 请求表达式组件 |
| `request-table/expression-item.tsx` | 475 | 请求项组件 |
| `request-table/expression-list.tsx` | 80 | 请求列表 |
| `request-table/expression-command-bar.tsx` | 127 | 命令栏 |
| `request-table/expression-controller.tsx` | 68 | 控制器 |
| `request-table/expression-item-context-menu.tsx` | 50 | 右键菜单 |
| `request-table/expression.scss` | 221 | 样式 |
| `request-table/context/expression-store.context.tsx` | 145 | 状态 Store |
| `helpers/request-schema.ts` | 1,236 | Request Schema 工具库 |
| `helpers/json-schema.ts` | 78 | JSON Schema 转换工具 |

**Request 节点功能**：
- 请求/响应定义管理（RequestDefinition 类型）
- JSON Schema 构建与解析
- 示例数据源（Example Sources）管理
- 字段顺序标准化（normalizeRequestDefinitionOrders）
- 不可见字符清理（normalizeRequestFieldKey）
- 与 Monaco Editor 集成的 JSON 编辑
- Excel 上传/下载支持

#### 3.2.2 自定义函数节点

新增文件：

| 文件 | 行数 | 说明 |
|------|------|------|
| `nodes/specifications/custom-function.specification.tsx` | 330 | 自定义函数节点规格 |
| `custom-function-table/index.ts` | - | 模块导出 |
| `custom-function-table/expression.tsx` | 120 | 函数表达式组件 |
| `custom-function-table/expression-item.tsx` | 516 | 函数项组件（最复杂） |
| `custom-function-table/expression-list.tsx` | 83 | 列表 |
| `custom-function-table/expression-command-bar.tsx` | 43 | 命令栏 |
| `custom-function-table/expression-controller.tsx` | 56 | 控制器 |
| `custom-function-table/expression-item-context-menu.tsx` | 46 | 右键菜单 |
| `custom-function-table/expression.scss` | 303 | 样式 |
| `custom-function-table/context/expression-store.context.tsx` | 127 | 状态 Store |
| `graph/tab-custom-function-table.tsx` | 118 | Tab 组件 |
| `helpers/custom-function-schema.ts` | 43 | Schema 定义 |

**自定义函数功能**：
- 内置 `customNode` 类型，不再依赖外部 `createJdmNode`
- 代码编辑器集成（Monaco）
- 函数参数 JSON Schema 定义
- 返回值 Schema 推断
- 调试器与日志输出
- 敏感词库适配（opencode 最新提交）
- `customFunctions` 透传（`DecisionGraphWrapper` → `TabContents` → renderTab，见 `3f59467`）
- `expr_asts` 通过 smartSplit 回写；`editExpression` 按钮文案本地化（zh_CN）

#### 3.2.3 国际化（i18n）系统

新增文件：

| 文件 | 说明 |
|------|------|
| `locales/index.ts` | 模块导出 |
| `locales/context.tsx` | I18nProvider + useTranslation |
| `locales/en_US.json` | 英文翻译（280 条） |
| `locales/zh_CN.json` | 中文翻译（280 条） |

**翻译覆盖范围**：
- 通用操作（确认、取消、删除、编辑等）
- 图编辑器（图表、组件、节点等）
- 决策表（字段、类型、操作等）
- 模拟器（运行、结果、轨迹等）
- 错误消息
- UI 控件文本

#### 3.2.4 Excel 导入导出增强

修改文件：`helpers/excel.ts`（+115 行）

**增强功能**：
- 支持更复杂的 Excel 格式
- 修复上传/下载功能

#### 3.2.5 其他新增工具

| 文件 | 行数 | 说明 |
|------|------|------|
| `helpers/json-schema.ts` | 78 | JSON ↔ JSON Schema 转换 |
| `helpers/custom-function-schema.ts` | 58 | 自定义函数 Schema |
| `helpers/request-schema.ts` | 1,236 | Request Schema 完整工具库 |

### 3.3 opencode 修改的核心组件

#### 3.3.1 图状态 Store（dg-store.context.tsx）

变更：+447 行

主要修改：
- 扩展状态类型，支持 Request 节点数据
- 新增 `useNodeDiff` / `useEdgeDiff` hooks
- 新增 `NodeTypeKind` 常量
- 支持更多节点类型的序列化/反序列化

#### 3.3.2 Input 节点规格（input.specification.tsx）

变更：+250 行 / -27 行

主要修改：
- 支持 Example 与 JSON Schema 模式切换
- 新增 `example` 和 `jsonSchema` 两种输入模式
- 与 Request Schema 系统集成
- 新增输入字段的类型推断

#### 3.3.3 侧边栏工具栏（graph-side-toolbar.tsx）

变更：+257 行

主要修改：
- 新增节点分组展示
- 支持自定义函数节点显示
- 菜单列表动态加载
- 侧边栏折叠后样式修复

#### 3.3.4 图渲染组件（graph.tsx）

变更：+313 行

主要修改：
- 支持更多节点类型的渲染
- Request 节点 Tab 集成
- 自定义函数节点 Tab 集成
- Tab 切换逻辑优化

#### 3.3.5 请求模拟面板（simulator-request-panel.tsx）

变更：+646 行

主要修改：
- 支持 Request 节点的模拟执行
- 请求/响应数据展示
- 用例数据切换功能
- 数据源与模拟器集成

#### 3.3.6 决策表 Tab（tab-decision-table.tsx）

变更：+77 行

主要修改：
- Excel 上传/下载功能集成
- 表格操作优化

#### 3.3.7 其他修改的文件

| 文件 | 变更 | 说明 |
|------|------|------|
| `dg.tsx` | +123 行 | 主组件扩展 |
| `dg-panel.tsx` | +113 行 | 面板组件扩展 |
| `dg.scss` | +103 行 | 样式新增 |
| `dg-wrapper.tsx` | +31 行 | 包装器调整 |
| `dg-infer.tsx` | +106 行 | 类型推断扩展 |
| `dg-empty.tsx` | +18 行 | 空状态调整 |
| `graph-components.tsx` | +46 行 | 图子组件 |
| `graph-nodes.tsx` | +12 行 | 节点渲染 |
| `graph-tabs.tsx` | +15 行 | Tab 管理 |
| `custom-node/index.tsx` | +151 行 | 自定义节点渲染 |
| `graph-node.tsx` | +35 行 | 基础节点 |
| `decision-table.specification.tsx` | +68 行 | 决策表规格 |
| `expression.specification.tsx` | +19 行 | 表达式规格 |
| `switch.specification.tsx` | +20 行 | 分支规格 |
| `specification-types.ts` | +8 行 | 类型定义扩展 |
| `specifications.tsx` | +3 行 | 规格注册 |
| `custom-edge.tsx` | +6 行 | 自定义边 |
| `use-graph-clipboard.ts` | +12 行 | 剪贴板操作 |
| `dg-simulator.tsx` | +16 行 | 模拟器 |
| `simulator-editor.tsx` | +35 行 | 模拟器编辑器 |
| `field-edit-popover.tsx` | +127 行 | 字段编辑弹出框 |
| `input-field-edit.tsx` | +28 行 | 输入字段编辑 |
| `output-field-edit.tsx` | +28 行 | 输出字段编辑 |
| `fields-reorder-dialog.tsx` | +6 行 | 字段排序对话框 |
| `dt-command-bar.tsx` | +45 行 | 决策表命令栏 |
| `table-context-menu.tsx` | +8 行 | 表格右键菜单 |
| `table-head-cell.tsx` | +11 行 | 表头单元格 |
| `table.tsx` | +4 行 | 表格组件 |
| `expression-item-context-menu.tsx` | +6 行 | 表达式右键菜单 |
| `expression-item.tsx` | +1 行 | 表达式项 |
| `expression-list.tsx` | +8 行 | 表达式列表 |
| `function.scss` | +3 行 | 函数样式 |
| `helpers/schema.ts` | +99 行 | Schema 扩展 |
| `helpers/utility.ts` | +150 行 | 工具函数扩展 |
| `helpers/node-type.ts` | +15 行 | 节点类型工具 |
| `helpers/traversal.ts` | +2 行 | 图遍历 |
| `helpers/monaco.ts` | +18 行 | Monaco 配置 |
| `theme.tsx` | +14 行 | 主题扩展 |
| `src/index.ts` | +20 行 | 库入口扩展 |

### 3.4 opencode 移除的内容

opencode 分支将以下包改为外部 npm 依赖，移除了源码：

| 包 | 原位置 | 新依赖 |
|----|--------|--------|
| `@gorules/lezer-zen` | `packages/lezer-zen/` | npm `@gorules/lezer-zen@0.8.1` |
| `@gorules/lezer-zen-template` | `packages/lezer-zen-template/` | 移除 |
| `@gorules/zen-engine-wasm` | `packages/zen-engine-wasm/` | npm `@gorules/zen-engine-wasm@^0.23.1` |

> **zrule 分支已对齐该模型**（提交 `e21bd87`）：同样移除三个库源码，但 `@gorules/lezer-zen-template` 仍以
> npm `0.4.0` 保留依赖（`zen.ts` 实际引用 `@gorules/lezer-zen-template`）。构建改为 bun 原生脚本（见 §3.6）。

移除的文件：
- `packages/lezer-zen/` — 完整目录（70 行 CHANGELOG、40 行 package.json、语法文件等）
- `packages/lezer-zen-template/` — 完整目录
- `packages/zen-engine-wasm/` — 完整目录（含 Rust 源码、WASM 构建配置等）

### 3.5 配置变更

| 文件 | 变更 |
|------|------|
| `package.json` | +1 行（新增依赖） |
| `bun.lock` | +2,914 行（Bun 锁文件新增） |
| `pnpm-lock.yaml` | 更新依赖 |
| `.storybook/main.ts` | +1 行 |
| `.storybook/manager-head.html` | 修改 |
| `vite.config.ts` | +3 行 |
| `public/product_logo.svg` | 新增品牌 Logo |

### 3.6 单独构建与发布（zrule）

zrule 分支收敛为单包 workspace，可直接独立构建 `@gorules/jdm-editor`：

```bash
cd jdm-editor
bun install            # 生成 bun.lock（首次）
bun run build          # 等价于 cd packages/jdm-editor && vite build
bun run typecheck      # 等价于 cd packages/jdm-editor && tsc --noEmit
```

产物输出到 `packages/jdm-editor/dist/`（`index.js` / `index.d.ts` / `schema.js` / `schema.d.ts` / `style.css`，ESM + 类型声明）。

发布到 npm（`prepublishOnly: vite build` 会自动重跑构建）：

```bash
cd packages/jdm-editor
npm publish
```

要点：

- `vite.config.ts` 已将全部依赖（含三个 `@gorules/*` 包）external 化，消费方需自行安装它们（均来自 npm registry）。
- 三个 `@gorules` 包固定版本：`@gorules/lezer-zen@0.8.1`、`@gorules/lezer-zen-template@0.4.0`、`@gorules/zen-engine-wasm@^0.23.1`。
- npm 版 `@gorules/lezer-zen` / `@gorules/lezer-zen-template` 不含类型声明，由 `src/lezer-zen.d.ts` 垫片提供（保留勿删）。
- root `package.json` 同时保留 `pnpm-workspace.yaml` 与 `lerna.json`：pnpm 环境优先读 yaml，bun 读 `workspaces` 字段，两者声明一致（`packages/*`），可并存。多包发布场景（有 pnpm 时）仍可用 `npx lerna publish`。

---

## 4. opencode 分支演进历史

opencode 分支共有 **55+ commits**，按功能主题分组如下：

### 4.1 自定义节点系统（迭代开发）

```
cbe6ec9 feat: 编辑器v3版本
1e33eb3 feat: customNode v1
c68c54f refactor: prepare bun workspace monorepo best practice
```

**演进路径**: v1 基础框架 → v2 功能完善 → v3 生产就绪

### 4.2 Request 节点系统（迭代开发）

```
41eeb03 feat: request node v1
f247b8b faet: jdm优化
660cd41 feat: 同步request simulator 数据
c659405 feat: 更新双向绑定input&引号输入优化
495b395 feat: 上传操作兼容
420ac84 feat: 上传json优化
e8df19d feat(rule): input 切换example & json schema
bb1fbd6 fix(request): request 节点优化
3971846 feat(all): request 数据源保存逻辑修改
```

**演进路径**: 基础 Request → 双向绑定 → JSON Schema → 示例数据 → 生产优化

### 4.3 UI/UX 优化

```
f0d72f3 feat: 优化透传
35187e4 feat: passthrough兼容
e2b94b3 feat: 决策节点高亮&复制
22cec95 feat: 修复高亮后自定义节点bug
454d78e fix: 修复高亮兼容语法后兼容性
48d5d28 feat: format优化&决策表节点光标闪烁优化
812b987 fix(side): 编辑器侧边栏折叠后样式修复
```

### 4.4 Business 模式增强

```
17cb8b9 feat(mode): business mode 下 number between 格式修改
b280144 fix(): lexicon_list 下拉列表
7bff32f 自定义节点敏感词库适配
```

### 4.5 国际化

```
04290a7 i18n
8641002 Merge branch 'brde' into i18n
797b0fc feat: 组件&拖拽文案
```

### 4.6 依赖整合与维护

```
011059d feat(合并): 合并standalone
4d5e036 merge
c4ab9c1 chore: merge i18n and jdm editor 1.51.3
32685a4 chore: merge jdm editor new version and remove useless codes
26036ad chore: remove useless package
dd4f161 chore: merge jdm-editor 1.51.3 and remove polifill codes
05507db fix: mock crypto.randomUUID when use http protocol in browser
5745a56 chore: update jdm-editor version
```

### 4.7 功能修复

```
e36d396 feat: 上传&下载excel功能修复
95dc5c5 feat: 动态加载自定义函数&excel上传下载支持
0b2b033 fix(editor): 修改schema同步问题
c549948 fix(json): 上传json文件后执行fitview
ab80237 删除request节点后绑定清除
e583814 fix(editor): 模拟器header添加用例数据切换
3cda9b6 fix(text): 修改描述数据源为用例数据
5b15593 feat(custom node): 自定义函数模拟器结果展示
ea0e01f 自定义函数样式修改
```

### 4.8 zrule 分支（外部化改造）

```
3f59467 feat: custom function table editor for custom node renderTab
38fce5f fix: match opencode branch simulator request editor height
52c39df fix: add CachedGraphIterator type to traversal iterator
33ecf08 fix: correct UTF-8 encoding for copied files
0e7aee0 fix: add missing tab-request.scss for Request node styling
8faafc1 feat: export TabRequest, request-schema, json-schema from barrel
f716ea7 feat: replace TabJsonSchema with TabRequest for input node
203de98 feat: upgrade simulator request panel with full feature set
```

**演进路径**: UserResolver 外部化 → components override → customNode renderTab 路由 → Request 节点改造 → custom function table editor（customFunctions 透传 renderTab）

---

## 5. API 导出差异

### master 分支导出

```typescript
// components
export * from './components';
export * from './theme';

// helpers
export { codemirror } from './helpers/codemirror';
export { useNodeType } from './helpers/node-type';
export { usePersistentState } from './helpers/use-persistent-state';
export { ensureWasmLoaded, useWasmReady } from './helpers/wasm';
export * from './helpers/schema';
```

### opencode 分支新增导出

```typescript
// 新增
export * from './locales';                           // 国际化
export * from './helpers/request-schema';            // Request Schema 工具

// 新增 polyfill
if (typeof crypto.randomUUID !== 'function') {
    crypto.randomUUID = function () { ... };
}
```

---

## 6. 总结

### opencode 分支的核心价值

1. **功能扩展**: 新增 Request 节点和自定义函数节点，大幅扩展编辑器能力
2. **国际化**: 完整的中英文双语支持
3. **Business 模式增强**: 更好的业务用户使用体验
4. **依赖精简**: 移除 WASM/Lezer 源码，改为外部依赖，简化构建
5. **稳定性提升**: 大量 Bug 修复和 UI 优化

### 与 master 分支的关系

opencode 分支是一个**深度定制的开发分支**，基于 master 分支进行了大量功能扩展。它保留了 master 的核心功能，同时新增了针对特定业务场景的定制化功能。

**建议**：在合并回 master 前，需要评估以下内容：
- Request 节点和自定义函数节点的通用性
- i18n 系统的完整性
- 移除 WASM/Lezer 源码的影响
- 向后兼容性
