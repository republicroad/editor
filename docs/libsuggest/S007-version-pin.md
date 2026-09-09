# S007 版本钉住 Pin（S006 剩余半边：pinned meta + 面板 Pin 按钮 + updateVersionMeta）

- 状态: done — appshell 0.4.0 已发布（2026-09-09）：pinned 元数据 + updateVersionMeta（IndexedDB/HTTP PATCH）+ 面板 Pin/Unpin/徽标/过滤 + 保留策略豁免
- 目标库: @republicroad/jdm-appshell
- 提出方: editor 会话（第六十三批规划 / 2026-09-07）
- 优先级: 中

## 问题

S006（版本管理增强）规划的两半中，**命名版本半边已由内核交付**（66cb38a，appshell 0.2.0：
`renameVersion` 契约 + 面板 `onRename`/重命名/按名过滤 + HTTP PATCH `{versionName}`），
但 **Pin（auto→manual 升格）半边未实现**：

- `packages/appshell/src/components/version-history/version-history-panel.tsx` 全文无 pin/pinned
  概念（无 Pin/Unpin 按钮、无徽标）
- `packages/appshell/src/shell/persistence.ts` 契约无 pinned 字段、无 `updateVersionMeta` 方法
- 宿主第五十七批已上线服务端 `PATCH /graphs/{id}/versions/{revision}`（body `{auto?, versionName?}`，
  `apps/editor/src/graphs-store.ts:413-436`），页面 `pin-versions-sheet` 现以 PATCH 直连 workaround
  钉住版本——UI 缺口在内核侧，宿主无法经面板触达

## 建议改动

1. `shell/persistence.ts`：`GraphRecordMeta` 增可选 `pinned?: boolean`；adapter 契约增可选方法
   `updateVersionMeta?(id, revision, meta: { pinned?: boolean; versionName?: string | null })`——
   与既有 `renameVersion` 并存或合并为其超集，粒度由内核裁决
2. `components/version-history/version-history-panel.tsx`：条目操作区（Pencil/"Name" 旁）增
   Pin/Unpin 按钮；props 增 `onPin?(revision, pinned: boolean)`，与 `onRename` 同款 feature-detect
   注入；pinned 条目渲染图钉徽标并纳入过滤
3. `shell/graphs-http-adapter.ts`：PATCH body 扩展 `{ pinned?: boolean }`（或复用 `auto: false`
   语义避免双字段冗余——由内核裁决，宿主服务端两键均已支持）
4. `shell/indexed-db-adapter.ts` 同步支持读写 pinned

## 影响面与风险

- 契约扩展均为可选方法/可选字段，非 breaking；按语义化发 appshell 0.3.0
- 保留策略联动：宿主 `pruneAutoVersions` 现仅按 `auto` 过滤（auto+命名版本会被折叠，第六十四批
  宿主侧修复）；pinned 语义落地后宿主同款豁免 pinned 条目
- 已验证：宿主服务端 PATCH `{auto, versionName}` 现网可用（第五十七批 + 第六十一批保留策略改造）

## 宿主侧现状

页面 `pin-versions-sheet` 以直连 PATCH `{auto:false}` workaround 钉住（第五十七批），版本面板无
Pin 入口；内核交付后宿主升级消费并收敛 workaround（原轨道 B1 计划的 B1b 半边）。

## 追记（2026-09-09，宿主会话）

内核 66fbf87 已实现（appshell 0.4.0）：pinned 为独立 meta 键（未复用 auto，裁决更新）；
updateVersionMeta(id, revision, {pinned?, versionName?}) 联合 meta，renameVersion 成兼容别名；
HTTP PATCH body 扩展 pinned；面板 pinned 徽标 + Pin/Unpin + pinned 过滤（feature-detect onPin）。
宿主后端 patch 契约需补 pinned 键 + 保留策略豁免，消费排入第七十批。
