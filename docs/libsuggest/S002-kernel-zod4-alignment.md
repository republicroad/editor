# S002 zod 3 → 4.3.6 对齐

- 状态: done — 内核已钉 zod 4.3.6 精确版，全门禁（433+121 测试/build/size）绿（2026-09-09）
- 目标库: @republicroad/jdm-editor
- 提出方: editor 会话（第五十四~五十六批调研，2026-09-06）
- 优先级: 中

## 问题

内核 jdm-editor 声明 `"zod": "^3.25.0"`，宿主 catalog 精确钉 `zod: 4.3.6`。
isolated 布局下 store 中 `@republicroad/jdm-editor/zod → zod@3.25.71` 与宿主
`zod@4.3.6` 并存两份——跨仓声明分叉的最后一个未消除项（react 分叉已由
"内核保持 19 + 宿主 overrides"策略收口，见 S001）。

## 建议改动

`packages/jdm-editor/package.json`：`"zod": "^3.25.0"` → `"zod": "4.3.6"`
（精确钉版，与宿主 catalog 同版；理由见 bun-workspaces-best-practices §1.3
"catalog/overrides 精确钉版守则"）。

## 影响面与风险

**迁移面已完整验证（2026-09-06，第五十六批中断前实测）**：

- API 审计：内核 zod 使用为 z.object×30 / z.string×30 / z.literal×21 /
  z.infer×13 / z.array×7 / z.any×6 / z.discriminatedUnion×3 / z.record×3 /
  z.number / z.boolean / z.enum / z.union——全部 zod 4 稳定 API；3 处
  `z.record()` 均已为双参形式（zod4 破坏点豁免）；无 errorMap/`.datetime()`/
  `.strict()`/superRefine
- 内核 jdm-editor：typecheck 0 错 + **vitest 362/362 全绿**（react 18.3.1 +
  zod 4.3.6 组合下）
- appshell：vitest 74/74 绿（typecheck 有一处 stories 断链，与本改动无关，
  见 S003）
- 错误信息类断言：362 用例全绿说明无消息文案级破坏

**剩余风险**：内核树其余成员/工具链对 zod 的传递依赖（pnpm 树解析层）——
执行时以内核 CI 全量门禁为准。

## 宿主侧现状

宿主无规避措施（zod 双版本宿主侧无类型/运行时越界：内核公开 API 未暴露 zod
类型给宿主）。对齐后宿主 store 少一份副本，`check:single-instance` 口径可
考虑扩至 zod（当前未监听 zod，因宿主自身曾存在第三方 zod@3 嵌套）。
