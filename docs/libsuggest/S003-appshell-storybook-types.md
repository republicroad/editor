# S003 appshell stories 在内核 pnpm 树下 typecheck 断链

- 状态: done（2026-09-10 闭案——自愈，无需改动）
- 目标库: @republicroad/jdm-appshell
- 提出方: editor 会话（第五十六批中断前实测发现，2026-09-06）
- 优先级: 低

## 问题

内核仓（pnpm 树）内执行 appshell `typecheck` 报：

```
src/integration/decision-graph-appshell.stories.tsx(2,15): error TS2305:
  Module '"@storybook/react-vite"' has no exported member 'Meta'.
src/integration/decision-graph-appshell.stories.tsx(2,21): error TS2305:
  Module '"@storybook/react-vite"' has no exported member 'StoryObj'.
```

实测链条：

1. `@storybook/react-vite@10.5.10` 的 `dist/index.d.ts` 只有
   `export * from "@storybook/react"` + `export { FrameworkOptions,
StorybookConfig, definePreview }`——`Meta`/`StoryObj` 应经
   `@storybook/react` 重导出到达
2. 安装的 `@storybook/react@10.5.10` 类型文件中 `Meta` 存在（grep 验证）

即**两个包各自类型完好，但重导出链在 tsc 解析中断**。疑点为 pnpm peer-hash
变体（`@storybook/react@10.5.10_@t_087c289a…`）的类型解析在
`export * from` 链上未命中正确变体，或 @types/react 版本混合（内核根
`@types/react ^19.2.18` 与 appshell `^18.3.1` 并存）导致 storybook 类型内部
的条件类型分支失效。

**注意**：编辑器树（bun isolated）内 appshell typecheck 全绿——仅内核 pnpm 树
暴露，与第五十三批前宿主树曾见的"双布局解析差"同构。

## 建议改动

内核会话排查方向（按命中概率排序）：

1. 统一内核树 `@types/react` 版本口径（根 devDep `^19.2.18` vs 成员
   `^18.3.1` 双口径消除——与 S001/S002 的版本策略一并决策）
2. `pnpm why @storybook/react` 核对 stories 文件解析到的变体 hash；必要时
   `pnpm.overrides` 钉单一 peer 组合
3. 若为 SB 10.5.10 已知问题，升级或改从 `@storybook/react` 直接导入
   `Meta`/`StoryObj`

## 影响面与风险

仅类型检查；stories 不进产物（`files` 白名单 dist）。当前内核 CI 的 Validate
在更早步骤失败（Lint and prettier），该错误未被 CI 遮蔽但迟早暴露。

## 宿主侧现状

无影响（宿主树内同文件 typecheck 绿）。

## 闭案追记（2026-09-10，内核会话）

**原始错误已不复现，自愈闭案。** 复验证据（内核树内实测）：

- appshell `tsc --noEmit`（`include: ["src"]` 天然覆盖 stories）全绿；
  `--explainFiles` 确认 `decision-graph-appshell.stories.tsx` 正常编译，react
  类型经 tsconfig paths 钉制解析到 `@types/react@18.3.31` 单一口径
- `pnpm why @storybook/react`：catalog 已升 `10.5.10 → 10.6.0`，且仅存单一
  peer 变体（原 `@storybook/react@10.5.10_@t_087c289a…` hash 分裂消失）——
  即建议改动 #3（升级）与 #1（react 类型口径统一）均已被顺手完成

自愈机制归因（按证据强度）：SB 10.6.0 catalog 升级 + S008 批次的 react
类型 paths 钉制 + zod 4.3.6 批次的 lockfile 对齐，三者叠加消除了重导出链
解析断裂。具体触发项无法也不必再归一。

**门禁覆盖**：stories 位于 `include: ["src"]` 内，appshell typecheck 天然
持续覆盖，无需新增 CI 步骤。
