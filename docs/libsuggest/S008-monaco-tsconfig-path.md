# S008 monaco-editor 的 tsconfig paths 映射冗余且毒化 oxc 系打包器运行时解析

- 状态: accepted — 内核侧已落地（jdm-editor `dabe8db3`，2026-09-08：paths 映射已删，且已按建议 2 将 function.tsx 的 MarkerSeverity 改为本地字面量，monaco 在内核内为纯类型依赖；内核门禁全绿）。宿主侧切换 `resolve.tsconfigPaths` 并卸载 vite-tsconfig-paths 仍待宿主批次执行。
- 目标库: @republicroad/jdm-editor（内核 tsconfig）
- 提出方: editor 会话（第六十四批后 / 2026-09-08）
- 优先级: 低

## 问题

`packages/jdm-editor/tsconfig.json` 的 compilerOptions.paths 中存在一条映射：

```json
"monaco-editor": ["./node_modules/monaco-editor/esm/vs/editor/editor.api.d.ts"]
```

**1）该映射对 typecheck 是冗余的。** monaco-editor 0.52.x 的 package.json 自带
`"typings": "./esm/vs/editor/editor.api.d.ts"`——TypeScript 解析裸名 `monaco-editor`
时经 typings 字段命中的正是同一个文件（tsc 不使用 main/module 字段，包 main 为空
不影响类型解析）。删除映射后内核 tsc 的解析结果不变。

**2）该映射会毒化「把 tsconfig paths 应用于运行时解析」的打包器。** 宿主仓在 Vite 8
下实验原生 `resolve.tsconfigPaths: true`（oxc 解析器，无插件过滤）时，内核源码的
monaco **值导入**（如 `components/function/function.tsx` 的 `MarkerSeverity`，另
request-examples / request-inlay-hints / tab-json-schema 等处为纯 `import type`）
经就近 tsconfig 命中该映射，`editor.api.d.ts` 被拽进模块图，rolldown 按 JS 解析
`.d.ts` 直接报 **19 个构建错误**（"Missing initializer in const declaration"）。
宿主现用的 vite-tsconfig-paths 插件对该映射有过滤语义，故现网构建正常——但这是
插件私有能力，Vite 8 原生选项仅 `boolean`、无任何细化配置可绕开单条映射。

影响面不限于宿主：任何采用 oxc-resolver / tsconfig-paths-webpa­ck-plugin 语义
（rspack、Rsbuild 等）的消费方，只要把内核源码纳入构建都会踩同一坑。

## 建议改动

1. **主改动**：删除 `packages/jdm-editor/tsconfig.json` 中 `monaco-editor` 那一行
   paths 映射（`#*` 映射保留不动）。内核侧验证：`bun run typecheck` + vitest 全套
   应保持全绿（typings 字段兜底，预期零行为变化）。
2. **可选加固**：`function.tsx` 的 `MarkerSeverity` 值导入改为本地字面量枚举
   （monaco 该枚举为固定数值：Hint=1 / Info=2 / Warning=4 / Error=8）——monaco
   在内核内即成为纯类型依赖，即使消费方打包器仍应用 paths 也不再有任何运行时入口。

## 影响面与风险

- 内核侧：typecheck 的解析路径由映射切到 typings 字段，目标文件相同，预期零差异；
  需内核会话以自家门禁复验（宿主不可代验，见协作边界）。
- 宿主侧收益：内核消费后，宿主可把 vite-tsconfig-paths 插件切换为 Vite 8 原生
  `resolve.tsconfigPaths` 并卸载插件依赖（宿主另行立批次执行，含 .storybook 同步）。
- 无 npm 发布物语义变化（映射仅作用于 typecheck，不进 dist）。

## 宿主侧现状

- 插件保留（vite-tsconfig-paths ^6.1.1，vite.config 与 .storybook/main.ts 双处），
  Vite 的 informational 告警可接受；实验细节已归档宿主 docs/17 工具链节。
- alias 遮蔽变通（`find: /^monaco-editor$/` 指向真实 ESM 入口，利用 alias 优先于
  tsconfig paths 的解析序）技术上可行，宿主未采纳——属宿主侧 hack，不如内核侧根治。
