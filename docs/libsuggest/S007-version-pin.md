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
宿主后端 patch 契约已补 pinned 键 + 保留策略豁免，消费落地于第七十批。

### 裁决依据：为何不复用 auto 升格（内核会话四层理由，宿主会话转录）

1. **两个键回答不同的问题**：auto 是来源标记（这条版本怎么产生的：自动 vs 手动保存），
   pinned 是保留意图（用户希望它豁免治理）。复用即把「它怎么来的」改写成「我想留它」——
   `auto: true → false` 后来源信息永久丢失，自动存档从此冒充手动保存。独立键下钉住的自动
   存档同时显示 auto + pinned 两个徽标（"这是我选择保留的自动存档"），语义如实。
2. **升格不可逆**：钉住再取消是常规操作——独立键下 unpin 只是把版本放回 auto 治理池；
   若 pin = 翻转 auto，unpin 时无从得知是否该翻回 `auto: true`（除非另存原始值，本质是
   第二个键还搭上状态机复杂度）。宿主旧 `PATCH {auto:false}` workaround 正踩在此不可逆点
   （第七十批已收敛退役）。
3. **治理谓词保持正交**：保留豁免过滤（`auto && !versionName && !pinned`）是三个独立维度的
   合取，「命名豁免」在第六十四批已是先例，pinned 只是往同一谓词加一项。若走升格，
   「命名的 auto」与「钉住的」都会塌缩成 manual，再分不清 unpin 后各回哪个治理池。
4. **写入者与写入时机不同**：auto 由保存路径在创建时刻写（保存者上下文），pinned 由面板
   事后经 updateVersionMeta 写（用户后续意图）——PATCH 契约里根本不含 auto。分键让写权限
   天然隔离，服务端 pruneAutoVersions 只需照搬同款豁免谓词。

一句话：auto/versionName/pinned 是三个正交维度（怎么来的 / 叫什么 / 保不保），各自独立
标记、组合表达，豁免谓词按需组合——升格方案用一个比特硬编码三种状态的交集，丢信息且不可逆。
