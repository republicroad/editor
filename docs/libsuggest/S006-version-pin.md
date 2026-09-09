# S006 版本钉住（auto→manual 升格）：面板按钮 + adapter 契约

- 状态: superseded by S007 — 命名版本半已随 appshell 0.2.0 落地，Pin 半由 S007 承接
- 目标库: @republicroad/jdm-appshell（VersionHistoryPanel + GraphPersistenceAdapter）
- 提出方: editor 会话（第五十七批，2026-09-06）
- 优先级: 中
- 关联: 服务端端点**已由宿主仓实现并上线**（见下），本建议仅为 appshell 侧接线

## 问题

auto 版本保留策略（最近 20 条滚动删除，manual 全保留）缺少"钉住"入口——用户
想把某条自动保存的版本升格为 manual 免于滚动删除时无 UI 可用。服务端能力已
就绪，缺口纯在 appshell：

1. `GraphPersistenceAdapter` 契约无版本元数据更新方法
2. `VersionHistoryPanel` 无 per-version 操作槽位

## 服务端契约（宿主仓已实现，第五十七批）

```
PATCH /api/graphs/{id}/versions/{revision}
Body: { "auto"?: boolean, "versionName"?: string }
200 → { revision, versionName?, updatedAt, auto? }
404 → 图/版本不存在或不可见
```

语义：仅改版本元数据，不动 content；head 与归档版本均可升格；
`revision` 严格 `v\d+` 或 head revision。

## 建议改动

### 1. GraphPersistenceAdapter 扩展（可选方法，向后兼容）

```ts
updateVersionMeta?(graphId: string, revision: string, patch: {
  auto?: boolean;
  versionName?: string;
}): Promise<GraphVersionEntry>;
```

`GraphsHttpAdapter` 实现为对应 PATCH 调用；`IndexedDbAdapter` 本地等价实现
（改本地 meta）。

### 2. VersionHistoryPanel per-version 操作

- `VersionHistoryEntry` 增加可选 `onPin?: (revision: string) => void` 或
  面板级 `onPinVersion?: (revision: string) => void`（形态由内核定）
- UI：auto 徽标旁"Pin"次级按钮（仅 `auto === true` 的行显示）；点击后宿主
  调 adapter 并刷新列表
- 确认交互：直接执行即可（升格无破坏性，可逆——manual 不可降格回 auto 属
  预期语义）

### 3. 宿主接线（面板就绪后宿主一次 PR 完成）

decision-simple 传入 `onPinVersion` → adapter.updateVersionMeta → refreshVersions。

## 影响面与风险

契约可选方法 + 面板可选 props，均向后兼容。UI 仅 auto 行新增一枚次级按钮。

## 宿主侧现状

宿主暂不直连 PATCH（避免绕过 adapter 的第二条通路）——面板 + adapter 就绪后
统一接线。
