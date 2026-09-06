# S004 版本历史 diff 视图组件（P1 面板版）

- 状态: proposed
- 目标库: @republicroad/jdm-appshell（+ @republicroad/jdm-editor 类型导出）
- 提出方: editor 会话（第五十七批规划，2026-09-06）
- 优先级: 中

## 问题

版本历史面板（VersionHistoryPanel）目前只列表 + 恢复。用户无法回答"这两个版本
之间改了什么"——规则编辑场景的高频问题（改了哪些节点/边/参数）。内核会话已有
`docs/hostapp/graph-diff-spec.md`（P2 画布高亮方向）；本建议补 **P1 面板级
变更清单**——两者共用同一 diff 纯函数，属同一能力族。

## 建议改动

### 1. 纯函数（appshell lib 层，零依赖可测）

```ts
// packages/appshell/src/lib/graph-diff.ts
export interface GraphDiffResult {
  nodes: {
    added: Array<{ id: string; kind?: string }>;
    removed: Array<{ id: string; kind?: string }>;
    changed: Array<{ id: string; kind?: string; fields: string[] }>; // 改动字段路径（浅层）
  };
  edges: { added: string[]; removed: string[] }; // "source→target" 或 id
  summary: { added: number; removed: number; changed: number };
}
export declare function computeGraphDiff(
  before: { nodes: Array<Record<string, unknown>>; edges?: Array<Record<string, unknown>> },
  after: { nodes: Array<Record<string, unknown>>; edges?: Array<Record<string, unknown>> },
): GraphDiffResult;
```

规则：节点按 `id` 匹配三分类；`changed` 做浅层字段对比（顶层 key + 点路径一层，
如 `params.value`），数组与对象整体视为一个字段（不做深层递归——P1 边界）。
边按 id（无 id 用 `source→target` 组合键）。

### 2. 面板集成（VersionHistoryPanel 扩展）

- 新增可选 props：`onCompare?: (baseRevision: string) => void` 或
  `renderDiff?: (base: VersionHistoryEntry) => ReactNode`——具体形态由内核定，
  约束仅一条：**宿主不重复渲染版本列表**，diff 内容区由面板统一布局
- 交互建议：每行加"与上一版对比"次级操作；或面板顶部基线选择器（默认上一版）

### 3. 分工

- P1（本建议）：diff 纯函数 + 面板清单，appshell 作用域
- P2（graph-diff-spec 已立项）：内核 DecisionGraph diff 模式 + 画布高亮，
  复用 computeGraphDiff 结果驱动高亮

## 影响面与风险

纯新增（新 lib + 可选 props），无破坏性。vitest 覆盖三分类 + 边组合键 + 浅层
字段路径。P2 落地时 computeGraphDiff 的输出结构即高亮数据源，一次投入两处收益。

## 宿主侧现状

宿主不自行实现 diff（避免宿主/内核两套 diff 语义漂移）；等面板能力就绪后宿主
仅做接线。
