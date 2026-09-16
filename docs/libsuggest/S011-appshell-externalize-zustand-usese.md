# S011 appshell lib 构建：zustand / use-sync-external-store 必须外置 + 声明依赖

- 状态: proposed
- 目标库: `@republicroad/jdm-appshell`（vite.config.ts `rolldownOptions.external` + `package.json.dependencies`）
- 提出方: editor 会话（2026-09-16，main 分支 npm 集成演示首爆）
- 优先级: 高（appshell npm 包在任意宿主 dev 模式下必然白屏）

## 问题（实测复现）

editor 仓以 npm semver 消费 `@republicroad/jdm-appshell@0.9.1` 后，vite dev 白屏，控制台：

```
Uncaught Error: Calling `require` for "react" in an environment that doesn't expose the
`require` function. See https://rolldown.rs/in-depth/bundling-cjs#require-external-modules
```

根因链（证据均在 `packages/appshell/dist/index.js` 0.9.1 产物内）：

1. appshell lib 构建把 **zustand4 + use-sync-external-store（usese）的 CJS 实现整体内联**
   进了 `dist/index.js`（产物内含 usese 标志串 "outdated, pre-release alpha of React 18"）。
   zustand 不在 appshell `dependencies`（幽灵依赖），也不在 `rolldownOptions.external`
   （external 仅 react 系 + jdm-editor peer）——于是被 rolldown 连同其 usese 依赖一起打包。
2. rolldown 对「深层 CJS 的 `require('react')`」（react 为外部）生成运行时惰性垫片
   `__require`，浏览器端**必炸**。同题已在内核 `packages/jdm-editor/vite.config.ts`
   external 注释中记录并以外置方式解决过（usese 正则 + 声明 `^1.6.0` 依赖）——appshell
   漏了同款处理。
3. 源码直通时代不暴露：宿主解析 zustand 走内核树（zustand5 ESM）且 usese 由宿主侧
   vite 逐文件转换。npm 化后 appshell 自带的内联 CJS 成为唯一路径，问题即现形。

## 建议改动

1. `packages/appshell/vite.config.ts` 的 `rolldownOptions.external` 追加：

```ts
'zustand',
/^use-sync-external-store(\/.*)?$/,
```

2. `packages/appshell/package.json` `dependencies` 补声明（与 jdm-editor 同版本线）：

```json
"zustand": "^5.0.15",
"use-sync-external-store": "^1.6.0"
```

（usese 是否需要声明视外置后 dist 是否仍产生该 specifier 导入而定：zustand5 的
`traditional` 子路径会导入它，宿主侧亦已备 ESM 补丁层。）

3. 发版 0.9.2。

## 验收口径

- `dist/index.js` 不再含 usese 标志串（"outdated, pre-release alpha"）与 `zustand` 内联体；
- editor 仓（npm 消费）`bun run dev` 首屏可渲染、无 require 守卫报错。

## 宿主侧现状

- editor 仓已备 `scripts/patch-usese.mjs`（root postinstall）：把 node_modules 内 CJS-only
  的 usese 覆写为 ESM 直通实现（React 18 内建 useSyncExternalStore），可解 zustand5 层的
  usese 转换问题；但 **appshell dist 内联的 zustand4+usese 拷贝无法宿主侧修复**——必须
  依赖本提案的外置修复。
- 临时验证手段（用完即拆，docs/19 §4.4 口径）：`bun link`/`portal:` 指向修复后的本地构建。

## 关联

- docs/19（源码直通退役）§6 预言的宿主侧发布面反馈回路第 4 项（前三项：dts paths 泄漏、
  I18n 导出缺失、UI kit 不在导出面，均已随 0.8.1/0.9.1 修复或落地宿主）。
