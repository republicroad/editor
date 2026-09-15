# 19 - Standalone 开发模式与源码直通退役

- 日期: 2026-09-15
- 状态: **决策已定，操作待执行**（本文档即决策记录 + 操作手册）
- 关联: 主仓（jdm-editor）`docs/archive/editor-demo-boundary.md`（边界备案）、本仓 `docs/06-jdm-editor-submodule.md`（submodule 时代历史文档）

---

## 1. 唯一目的：standalone 开发验证模式

一切围绕的需求只有一个：**库（jdm-editor）开发时，有一个不依赖 npm 发包的真实宿主环境，改库即可看到效果。** editor 仓的 submodule 与各层直通配置，都是为这个目的服务的脚手架。

## 2. 前因：四层源码直通的演变史

四层配置不是设计出来的，是每个时代的问题各留下一层，且没有一层在使命结束后被拆除：

| 层 | 配置 | 引入动机 | 现状 |
| --- | --- | --- | --- |
| L1 | git submodule（`jdm-editor/`，跟踪 `reui` 分支） | 初期需要直接修改 jdm-editor 源码 | 改源码的工作早已回归内核仓（reui 分支 + 内核会话），submodule 退化为"钉住源码镜像" |
| L2 | bun workspace（`workspaces: ["jdm-editor/packages/*"]` + `"@republicroad/jdm-editor": "workspace:*"`） | 换用 bun 工具链后让包可解析 | 仅因 L1 存在而存在 |
| L3 | tsconfig `paths`（包名 → `./jdm-editor/packages/*/src/index.ts`） | 源码统一走包名导入，方便随时替换为 npm 包（**四层里唯一面向终态的决策**，业务代码至今零改动即可换 npm） | 被 L4 覆盖（alias 优先） |
| L4 | vite `resolve.alias` 显式直通 barrel | 当年 vite 版本低、不识别 tsconfig paths（曾用 `vite-tsconfig-paths` 被卡）；Vite 8 已内置 `tsconfigPaths: true`，但 alias 优先级更高仍生效 | npm 模式下无存在必要 |

**副产物**：`@republicroad/jdm-appshell` 从未进入 `dependencies`，纯靠 tsconfig paths + Vite 内置 paths 解析——是一个幽灵依赖。npm 化时必须补声明。

## 3. 后果：为什么退役

1. **与边界文档第 3 条相悖。** 备案契约是"升级只消费公开 npm 包（semver）"，实际是三重直通——本仓从未真正测过 npm 发布面（dist、exports、类型声明、peer 契约）。
2. **开发验证职责已被 playground 接管。** jdm-editor 仓内的 playground（已重构为 Vite MPA：目录页 + graph/table/grid/reui/trust 实例，规划中 udf.html）以同仓源码直通提供同样的能力，且回路更短：改库 HMR 即生效，无需跨仓 submodule 同步。
3. **两条回路本就不该同居一仓。** 源码直通是"库作者模式"，npm 消费是"库用户模式"；editor 同时承担两者，正是四层叠加的根因。分工后：

| 循环 | 载体 | 消费形态 |
| --- | --- | --- |
| 开发验证（改库看效果） | jdm-editor 仓 playground（`pnpm dev`） | 源码直通 |
| 发布面验证 | consumer-smoke / npm-smoke 脚本 + verdict（真实生产宿主） | npm 包 dist |
| 对外演示 | playground MPA 静态产物（可部署） | — |

没有一条循环需要本仓做源码直通。

## 4. 决策

1. **退役源码直通，回归纯 npm semver 消费**，对齐边界文档第 3 条，让本仓成为名副其实的"真实宿主"。
2. **standalone 开发验证在 jdm-editor 仓 playground 进行**；本仓今后缺什么验证能力，优先推动 playground 加实例（MPA 加入口很便宜），而不是恢复跨仓直通。
3. **npm-swap 验证作为本仓的收尾价值**：拆完后以 registry 包跑通构建与类型检查——若失败，缺导出 / 类型缺失 / 未声明依赖正是发布包需要的反馈，回内核仓修复发版后再验。
4. **偶尔需要在本仓跑未发布源码时**，用临时桥：`pnpm link`（或 bun `portal:` 协议）+ `server.fs.allow`，用完即拆，不固化。

## 5. 操作清单（待执行）

按序执行，全部是减法：

1. **`vite.config.ts`**：删除 `resolve.alias` 中的 `@republicroad/jdm-editor` 条目（`tsconfigPaths: true` 保留，宿主 `@/*` 与内核 `#*` 仍靠它）。
2. **`tsconfig.json`**：删除 `paths` 中三行——`@republicroad/jdm-editor`、`@republicroad/jdm-appshell`、`@republicroad/jdm-appshell/*`。
3. **`package.json`**：
   - `dependencies`：`"@republicroad/jdm-editor": "workspace:*"` → `"^0.3.x"`（执行时取 npm 最新）；**新增 `"@republicroad/jdm-appshell": "^0.1.0"`**（幽灵依赖转正）。
   - `workspaces`：删除 `"jdm-editor/packages/*"`。
   - `scripts`：删除或改写 `test:zen-udf`（现从 submodule 路径运行）。
   - 执行时 grep `scripts/` 下其余对 `jdm-editor/` 路径的引用（如 `sync-custom-node-schema.ts`、`check-single-instance.ts`）一并处理。
4. **移除 submodule**：`git submodule deinit jdm-editor && git rm jdm-editor`（`.gitmodules` 随之清理）。
5. **`bun install`** 拉 registry 包。
6. **README `install` 节**：clone 命令不再需要 `--recurse-submodules`。

## 6. 成功标准

- 全仓配置中 grep 不到任何指向 `jdm-editor/` 目录的路径（`vite.config.ts`、`tsconfig.json`、`package.json`、`scripts/`）。
- `bun run build`（`tsc --noEmit` + vite build）与 `bun run test` 在**仅依赖 registry 包**的情况下通过——类型与运行时全部来自 dist。
- 失败即发布面 bug：回 jdm-editor 仓修复、发版、本仓重跑验证。这正是边界文档第 3 条想要的宿主侧反馈回路。

## 7. 退役后的仓内配套修订

- `docs/06-jdm-editor-submodule.md` 标注归档（submodule 时代历史文档）。
- `docs/03-project-status.md` 依赖快照更新（workspace:\* → semver）。
- 本 README 版本线小节同步。
