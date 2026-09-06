# S001 跨 react 主版本消费的类型合规

- 状态: proposed
- 目标库: @republicroad/jdm-editor
- 提出方: editor 会话（第五十六批调研，2026-09-06）
- 优先级: 中

## 问题

内核 jdm-editor 保持 devDeps react 19（既定决策），宿主 editor 树以 react 18.3.1
消费（overrides 压制 + 源码直通）。类型层审计发现一处**单边类型构造**：

```
jdm-editor/src/components/decision-table/dt-empty.tsx:30
  cellRenderer?: (props: TableCellProps) => JSX.Element | null | undefined;
```

`JSX.Element` 为**全局 JSX 命名空间**引用。@types/react 19 已将该命名空间从全局
移除（保留 deprecated 别名的过渡期里内核自身 typecheck 绿，但别名属弃用路径）。
跨主版本通吃的规范写法是 `React.JSX.Element`（18/19 类型均导出）。

其余审计项全部通过：

- 运行时 API：无 19-only API（仅 `useTransition`，react 18 即有）
- peerDeps：`react: ">= 18"` 契约正确
- `forwardRef`/`RefObject` 广泛使用（26 文件）：forwardRef 在 19 仍可用（弃用但
  不移除）；`RefObject` 非空语义变更（19 起 `.current` 非空）未在公开 API 的
  类型签名中发现消费方可见的破坏

## 建议改动

### 改动 1（一行，低风险）

`dt-empty.tsx:30`：`JSX.Element` → `React.JSX.Element`（该文件需补
`import type { JSX } from 'react'` 或经既有 React 导入引用，以内核 lint 规范
为准）。

### 改动 2（CI harness，立项移交内核会话）

**dist 消费守卫**：内核自身 typecheck（@types/react 19）无法自证 18 兼容——
编辑器树的源码直通 typecheck 已天然覆盖"源码级 18 兼容"，缺口仅在 **dist 产物
类型**（d.ts 发射可能变换类型形态）。建议内核 CI 增加 react18-consumer job：

1. `pnpm build` 产出 dist + 打包（`npm pack` 或 workspace 引用）
2. 临时消费方 fixture：`react@18.3.1` + `@types/react@18.3.x` + `typescript`，
   `import { ... } from '@republicroad/jdm-editor'` 若干代表性 API + 一个 JSX
   渲染用例
3. `tsc --noEmit` 通过即绿

约 40 行 workflow + 小 fixture。这是"devDeps 19 的库可被 18 消费"唯一可靠的
自证手段（业界标准做法：radix/tanstack 系均跑 oldest-supported-major 消费
矩阵）。

## 影响面与风险

- 改动 1：纯类型注记，无运行时差异；内核 19 类型下行为不变（`React.JSX` 在
  @types/react 19 为正式路径）
- 改动 2：仅 CI 新增 job，不改产物

## 宿主侧现状

宿主已用 overrides（react/react-dom/@types 家族 → 18.3.1）+ `check:single-instance`
守卫实现编辑器树单实例 18 消费，无需宿主改动。内核保持 19 的前提下，该机制
为宿主侧终态。
