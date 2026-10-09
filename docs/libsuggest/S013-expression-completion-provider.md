# S013 表达式补全 provider 接口——对接 zen-engine 2.1 slots API

- 状态: proposed
- 目标库: `@republicroad/jdm-editor`（expression-builder + code-editor 决策表单元格）
- 提出方: editor 会话（2026-09-18，批 91 规划）
- 优先级: 高（上游 zen-engine 2.1 已内置引擎级槽位补全，编辑器侧是缺失的最后一环）

## 背景

上游 zen-engine 2.1.0（#527）把自然语言投影（nl）替换为引擎自有**槽位补全**，napi 绑定
完整暴露（宿主已实测 2.1.1 的 index.d.ts）：

- `Workspace` 类：`setDocument(图/策略)` 后提供 `slot(cursor, text)`（槽位分类 + 枚举表 +
  可拼接字面量 + replaceSpan）、`completions(cursor)`（LSP 风格 items）、`inspect`（悬停）、
  `prepareRename/rename/references/search/diagnostics`（语言服务全家桶）——图与 policy 双支持；
- 免上下文轻量通道：`slotBatch(requests: SlotRequest[])`（text + pos + unary + role +
  scope/expected/labels 即可，无需图文档）。

宿主已按批 91 规划在后端提供 `/api/expression/slot` 端点（slotBatch 直通 + Workspace
图上下文双模式，防抖/缓存由前端配合）——**编辑器侧缺一个补全 provider 接口**，宿主无法
把端点接进内核的表达式编辑面。

## 现状

内核表达式编辑面两处：

1. `components/code-editor/business/expression-builder`（表达式构建器）；
2. `components/code-editor/`（决策表单元格，CodeMirror；cell-view-pool 池化）。

两处目前均无异步补全 provider 的注入点（CodeMirror 自带 completion 扩展存在，但数据源
不可外部注入）。

## 建议

在 jdm-editor 定义**补全 provider 接口**（仅接口 + 装配点，不做 HTTP 实现——URL/鉴权/
防抖属宿主职责）：

```ts
export interface ExpressionCompletionRequest {
  text: string;            // 当前表达式全文
  pos: number;             // 游标（UTF-16）
  unary: boolean;          // 一元格（$ 类型）
  role: 'condition' | 'value' | 'path' | 'unary';
  scope?: string;          // 主体类型（表格列类型等宿主已知信息）
  expected?: string | null;// 期望值类型
  signal?: AbortSignal;    // 防抖取消
}

export interface ExpressionCompletionItem {
  label: string;
  kind: string;            // LSP kind（function/field/enumMember/operator...）
  detail?: string;
  info?: string;           // 悬停文档
  /** 接受建议时的替换区（缺省 = 标识符边界推断） */
  replaceSpan?: [number, number];
}

export type ExpressionCompletionProvider = (
  req: ExpressionCompletionRequest,
) => Promise<{ items: ExpressionCompletionItem[]; autoOpen?: boolean } | null>;
```

装配点：

1. **expression-builder**：props 增 `completionProvider?`；键入防抖（建议 250–300ms）
   调用，浮层渲染 items（label/kind/detail），接受时按 replaceSpan 拼接；
2. **决策表 CM 单元格**：经 CodeMirror `autocompletion({ override: [...] })` 数据源桥接
   同一 provider（CM 侧把 pos 换算为表达式全文偏移）。

宿主侧（editor 仓）随后提供默认 provider 实现：`fetch('/api/expression/slot', { signal })`
适配器（批 91 宿主端点），并在页面装配点注入。

## 决策点（内核定）

1. 接口放 barrel 还是仅内部 props 透传（推荐 barrel——宿主装配需要类型）；
2. 防抖归属：编辑器内置（推荐，宿主免重做）vs 宿主；
3. CM 单元格的补全 UI 是否复用 CM 内置 completion 扩展（推荐——键盘导航/高亮免费）。

## 宿主侧现状

- 批 91 宿主端点已规划（`POST /api/expression/slot`：slotBatch 直通 + Workspace 图上下文
  双模式，见 docs/17 批 91 节）；可与本提案并行施工，接口即两侧的合拢点。
- 关联: docs/17 §4 zen-engine 2.1.x 调研（#527）；S011/S012 同族（TS 源发布的消费面要求）。
