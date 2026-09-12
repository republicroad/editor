# S009 flow UI 增强：编辑撤销栈（undo/redo）+ MiniMap/网格吸附

- 状态: proposed
- 目标库: `@republicroad/jdm-editor`（dg-store / graph 画布）
- 提出方: editor 会话（2026-09-12）
- 优先级: 高（A 撤销栈）/ 低（B MiniMap/吸附，近零成本随批）

## 背景（flow UI 业界实践 vs 本仓画布实测，2026-09-12）

内核画布基于 @xyflow/react 12，已采用标准件：Background 网格、Controls（showInteractive=false）、
`edgesReconnectable`（边端点拖拽重连）、自定义节点 React.memo、`panels` 面板系统、键盘拖拽
（cf-table roadmap 3.2，第七十六批消费）。**两项业界必备能力缺失**：

1. **无编辑撤销栈（undo/redo）**——全仓 grep（dg-store/dg-infer/simulator）确认无 undo/redo
   历史实现。用户误删节点/错连线后的唯一恢复手段是「恢复历史版本」这种持久层重武器；
   而编辑撤销栈 ≠ 版本历史（会话内操作栈 vs 跨会话快照，业界从不混用——本仓
   docs/bestpractice/document-versioning.md 亦有同款结论）。
2. **MiniMap 小地图与 snapToGrid 网格吸附未启用**——xyflow 内置组件/开关，大图导航与
   画布整洁的低成本增强。

n8n、Node-RED、Unreal 蓝图等成熟编辑器均把 Ctrl+Z / Ctrl+Shift+Z 作为必备项。

## 建议改动

### A（高价值）：编辑撤销栈

**栈位置**：kernel `dg-store.context.tsx` 的 store 层（命令栈）；宿主侧经既有 store actions
暴露 `undo()/redo()/canUndo/canRedo`，键盘快捷键由宿主或 kernel 面板挂。

**一步的粒度设计（DAG 约束下建议）**：

| 操作 | 粒度 |
| --- | --- |
| 节点/边增删 | 单次操作 = 一步 |
| 节点拖拽移动 | 拖拽结束（onNodeDragStop）= 一步，拖拽过程不入栈 |
| 表达式/参数编辑 | 防抖合并（如 500ms 静默合并为一步，与 request-session-draft 的防抖口径一致） |
| 面板开合/视口缩放/皮肤切换 | 不入栈 |

**边界（不入撤销栈，业界共识）**：版本历史操作（restore 本身可撤销=再 restore）、视口状态、
皮肤/主题选择、面板布局。

**实现参考**：xyflow 官方 undo-redo 范式（zustand store + 时间旅行指针）；实现形态二选一由
内核裁决——①逆命令补丁（记录 inverse patch，内存最优）或 ②快照差分（draft 快照栈，实现最简；
graphAddons 前的 content 层做快照可绕开引擎校验耦合）。

### B（低成本）：MiniMap + 网格吸附

- `<MiniMap pannable zoomable />` 挂入画布（角落可折叠）；
- `snapToGrid`/`snapGrid` 开关（默认关，宿主可开）。

## 影响面与风险

- undo/redo 改动集中在 dg-store（kernel），**宿主零改动**（store actions 经既有 barrel 暴露）；
- 风险：撤销语义与自动保存/版本历史的交互需定义（建议：撤销**不**触发 autosave dirty 置位
  语义变更——撤销后画布即新状态，正常走既有保存链路；恢复版本操作本身作为一步入栈与否
  由内核裁决）；
- MiniMap/snapToGrid 为 xyflow 原生能力，零风险。

## 宿主侧现状

- editor 第七十三批起画布经 `SkinnedDecisionGraph` 渲染（皮肤槽位 + diffBaseline 画布标记）；
  undo/redo 的 store 改动对其透明；
- 宿主遗留的直连 workaround 均已收敛（第七十/七十六批），宿主侧无阻碍本提案的技术债；
- 演示栈定位（local-first、自包含）不变。
