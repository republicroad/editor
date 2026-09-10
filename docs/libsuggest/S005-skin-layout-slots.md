# S005 换肤布局槽位（SkinDefinition 布局扩展需求）

- 状态: spec-ready（规格稿已出：kernel 仓 `docs/design/skin-layout-slots.md`，待宿主确认 4 项后实现）
- 目标库: @republicroad/jdm-appshell
- 提出方: editor 会话（第五十七批规划，2026-09-06）
- 优先级: 中
- 需求来源: 宿主多皮肤实践（ocean 皮肤 + 默认皮肤）中发现的能力缺口

## 需求背景

当前 `SkinDefinition`（`src/skin/types.ts`）三要素：`seeds`（色板种子）、
`tokens`（主题 token 透传）、`nodeOverrides`（节点 UI 槽位改写）。粒度到
**节点级**为止——宿主换肤能改"节点长什么样"，不能改"编辑器界面怎么摆"。

宿主真实诉求（按优先级）：

1. **工具栏槽位**：宿主自有按钮注入编辑器工具栏（如"模拟运行""发布"），位置
   随皮肤走（默认皮肤在右侧分组、ocean 皮肤可移到左侧）
2. **面板槽位**：宿主在画布边缘注入自有面板（如版本历史、请求面板——目前宿主
   在页面层自摆，与画布布局解耦但视觉上"两张皮"）
3. **头部槽位**：标题区左右侧扩展（状态徽标、环境标识）

## 建议形态（供内核设计参考，非强制）

```ts
export type SkinDefinition = {
  // …现有三要素不变…
  layout?: {
    toolbar?: {
      /** 槽位名 → 渲染函数；内核在固定锚点调用，宿主按皮肤决定是否渲染 */
      slots?: Record<string, (ctx: SkinSlotContext) => ReactNode>;
      order?: string[]; // 槽位排列顺序（皮肤可重排宿主注入项）
    };
    panels?: Record<'left' | 'right' | 'bottom', { slots?: Record<string, (ctx: SkinSlotContext) => ReactNode> }>;
    header?: { slots?: Record<'left' | 'right', (ctx: SkinSlotContext) => ReactNode> };
  };
};
```

`SkinSlotContext` 至少携带 `{ graphRef, graph, readonly }`（与现有
CustomNodeSpec 渲染上下文对齐）。约束：

- 槽位**缺省即不渲染**——内核锚点对未注册槽位零开销，默认皮肤行为不变
- 槽位命名空间建议 `host:` 前缀（如 `host:toolbar.primary`），内核保留裸名
- 深度控制：只做"锚点 + 注入"，不做自由拖拽布局（P2 再议）

## 影响面与风险

- 默认皮肤零变化（layout 缺省）；内核需在编辑器壳层布局中埋锚点（主要工作量）
- 与 `nodeOverrides` 同一模式（皮肤改写宿主可注入点），心智一致
- 优先级排序里工具栏槽位价值最高（宿主"发布/模拟"按钮当前只能外挂在页面层）

## 宿主侧现状

宿主 ocean 皮肤仅用 seeds/tokens；布局诉求暂以页面层自摆妥协。槽位就绪后宿主
负责把自有 UI 迁入槽位并回归两套皮肤。

## 规格化追记（2026-09-10，内核会话）

规格稿 v1 已出：kernel 仓 **`docs/design/skin-layout-slots.md`**。对本文建议
形态的裁决与修订：

- **双层架构**：kernel 只出中性锚点（`toolbarItems`、`PanelType.position`），
  `SkinDefinition.layout` 与映射层全在 appshell（`SkinnedDecisionGraph`）——
  kernel 皮肤无感知，与 `nodeOverrides` 模式同构
- **现状修正**：面板注入 kernel 已有半边（`panels?: PanelType[]`），缺口是
  位置维度而非注入能力；工具栏为全硬编码，P1 新增锚点（宿主价值最高项）；头部
  P3 改在 appshell 壳层实现，kernel 不引入 header 概念
- **新增硬约束**：每槽位 ErrorBoundary 故障隔离；`host:` 裸名 dev-warn 自动补
  前缀；缺省零快照差异防回归
- **分期**：P1 工具栏（0.6.0）→ P2 面板位置（0.7.0，bottom 可裁）→ P3 头部
  （appshell 0.8.0）
- **待宿主确认 4 项**（分组命名 / bottom 真伪 / header 归属 / 上下文富度），
  阻塞实现、不阻塞规格

## 追记（2026-09-10，宿主会话）——四项裁决已确认

宿主已就 spec v1 §9 四项全部裁决（详见 jdm-editor/docs/design/skin-layout-slots.md §10）：
① 保留组够用，宿主「发布」走独立组；② bottom 裁剪，P2 仅交付 right；③ 接受 appshell 壳层
ShellHeader（宿主自摆 PageHeader 为可选迁移）；④ P1 最小集 {graph, disabled, graphRef} 确认，
富上下文建议以独立 context hook 向后兼容追加。P1 可进入实现（kernel/appshell 0.6.0）；
宿主消费批（SkinnedDecisionGraph 切换 + ocean 注入示范）随 0.6.0 发版排期。
