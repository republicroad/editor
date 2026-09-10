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

## P1 交付追记（2026-09-10，内核会话）

**P1 工具栏槽位已 shipped（kernel/appshell 0.6.0，reui `d337796`）**：

- kernel：中性 `ToolbarItem` 锚点（`toolbarItems` prop），渲染于页签条右端原生操作
  之后——group 聚类分隔线、组内 order 稳定排序、每项独立 SafeBoundary（槽位抛错
  降级不渲染）、零注入零 DOM
- appshell：`SkinDefinition.layout.toolbar`（最小 ctx `{graph, disabled, graphRef}`）+
  `mapToolbarSlots`（裸名 dev-warn 补 `host:` 前缀、order 排序、缺省独立组）+
  `SkinnedDecisionGraph` 透传壳
- playground：Default/Ocean 双肤切换 + `host:toolbar.hello` 槽位演示，实机验收通过
  （默认零注入 → 切肤出现 → 点击读实时图 → 切回零残留）
- 测试：kernel 7 用例 + appshell 8 用例；门禁全绿；0.6.0 已发布 npm（registry smoke 绿）

宿主消费（72 批）前置已就绪：`DecisionGraph → SkinnedDecisionGraph` 切换 +
ocean `host:toolbar.publish` 注入。P2（right 面板）/ P3（ShellHeader）按规格稿
分期待交付。

## P2 交付追记（2026-09-10，内核会话）

**P2 right 面板已 shipped（appshell 0.8.0，reui \`6ecadaa6\`）**，实现相对规格稿 §5.2
有一处精化：

- **appshell-only，kernel 零改动**（维持 0.6.0）：确认的浮层 UX（右缘图标轨 + radix
  Sheet 右滑，VersionHistoryPanel 同款容器）在壳层即可完整实现，规格稿 §5.2 的
  kernel \`PanelType.position\` 降级为未来「停靠式（非浮层）右面板」需求出现时的备选
- \`SkinLayout.panels.right\`（slots + order）\`SkinnedDecisionGraph\` 内部渲染右缘轨道
  （PanelRight 缺省图标、host: 前缀 title）+ Sheet（\`SkinSlotContext\` 注入、单开语义、
  无槽位零 DOM）
- playground ocean 皮肤演示 \`host:panel.notes\`；实机验收通过（切肤出现轨道 → 打开
  Sheet → ctx 注入实时节点数 → 关闭）
- 测试：纯函数（排序/前缀）+ 组件（轨道/Sheet/零注入）；appshell 147 测试全绿

## P3 交付与闭案追记（2026-09-10，内核会话）

**P3 头部槽位已 shipped（appshell 0.9.0，reui 51553f47），S005 三期全部完成、闭案。**

- \`ShellHeader\`（新导出）：渲染 \`layout.header.slots.left/right\`，注入 \`SkinSlotContext\`；
  无槽位返回 null——宿主页面层头部不受影响（§10-3 裁决：kernel 无 header，页面骨架属宿主）
- \`SkinnedDecisionGraph\` 在皮肤定义 header 槽位时自动把 ShellHeader 挂到画布上方，
  与右缘轨道/Sheet、工具栏槽位自由组合；无任何槽位时渲染树与裸 \`DecisionGraph\` 一致
- playground ocean 皮肤完整演示三期（工具栏按钮 + 右缘 notes 面板 + 头部环境标识/徽标）
- 测试：appshell 152 用例全绿（新增头部 5 例）；kernel 全程 0.6.0 未动

**宿主消费（72 批+）**：升级 appshell ≥0.8.0 时同步停止注册 json_path/template 节点
（0.7.0 breaking），crypto 节点保留；verdict 后端承接 crypto 服务端执行。
