# Bun Workspaces（工作区）最佳实践与语义差异

> 2026-09-03 沉淀。基于 bun 1.3.x 与本仓多包布局（宿主 `src/` + 子模块内
> `jdm-editor/packages/jdm-editor` 内核 + `jdm-editor/packages/appshell` 外壳——
> appshell 已于第四十七批迁入内核仓）的实测——文中每条 ✦ 都在第四十二~四十七批
> 真实发生过。
> 姊妹篇：[多包编译与构建](./monorepo-multi-package-build.md)、[别名机制对比](./monorepo-alias-mechanisms.md)。

---

## 0. 一句话总纲

> **pnpm 把 tsconfig 别名留在编译期、用严格布局管边界；bun 把别名带进运行时、
> 用提升布局换速度——前者的问题出在打包器配置，后者的问题出在 tsconfig 域的一致性。**

---

## 1. 工作区声明与依赖协议

1. 根 `workspaces` 用 glob 收纳全部成员（本仓 `["apps/*", "jdm-editor/packages/*"]`——
   glob 已覆盖子模块内的内核与 appshell 两个成员，第四十七批起 `packages/*` 已移除）；
   每个成员独立 package.json（自带 name/version/deps）。
2. 跨包依赖只走 `workspace:` 协议：
   - `workspace:*` → 发布时改写为**精确版本**
   - `workspace:^` → 改写为 `^x.y.z`（保留兼容范围，**对外发布的内部包推荐**）
3. 版本对齐优先用 catalog（bun 新版支持，语法以所用版本文档为准）；低版本用根
   `overrides`（注意其作用域边界，见 §4）。
4. **绝不混用包管理器**：一仓一锁。子模块自带另一套包管理器时（本仓内核 = pnpm
   + 自己的 lockfile），必须文档化"双树现实"——宿主树（bun）供 monorepo 消费，
   子模块树（pnpm）供其自治开发。

---

## 2. 安装与 lockfile

1. 单一 `bun.lock` 入库（1.2+ 文本格式，JSONC 可审可合）；CI 用
   `--frozen-lockfile`——**bun 检测到 CI 环境默认强制 frozen**。
2. ✦ **成员 manifest 一变更，lockfile 必同步**：任何成员（含子模块成员）增删依赖
   后重跑根 `bun install`，否则 CI frozen 直接失败（实证：内核新增
   `rollup-plugin-visualizer` 触发 CI 漂移）。
3. ✦ **反向结论：成员 version bump 不漂移**——text lockfile 对 workspace 成员
   只记 `workspace:*` 协议、不记版本号（实证：内核 v0.2.2→v0.3.0 零 diff，
   frozen 幂等通过）。
4. postinstall 默认不信任：`bun pm untrusted` 查看、根 `trustedDependencies`
   显式放行原生依赖。

---

## 3. node_modules 布局与依赖收敛

1. **布局心智**：内容寻址 store（`node_modules/.bun`）+ 提升硬链接；
   版本冲突的包嵌套到成员自己的 node_modules 下——这是"双实例"的温床。
2. ✦ **双实例检测与症状**：同一包两份（`@lezer/lr/node_modules/@lezer/common@1.2.3`
   vs 顶层 `@1.5.2`）→ 类型层 nominal 冲突（`Tree`/`ReactNode` 不可赋值）。
   **CI 全新安装与本地增量安装布局可能不同——本地绿 ≠ CI 绿**（实证：lezer
   冲突仅 CI 暴露；双 React 实例致内核 vitest 在宿主树结构性不可绿）。
3. ✦ **`overrides` 只作用于非 workspace 依赖**：根 overrides 钉不住成员自己的
   devDeps（实证：`@types/react@19` 在内核本地完好保留）。pnpm 的 overrides
   是 workspace 全局——**这是 bun 与 pnpm 在收敛能力上的最大差距**。
4. 收敛手段按优先级：
   1. **类型层 paths 钉单一实例**（tsconfig 层面，跨平台稳，实证 react/@lezer；
      双布局下用**多候选数组**——见 §3.5）
   2. 成员间 devDep 版本对齐
   3. overrides（仅对第三方传递依赖有效）
5. 运行时单实例照旧：vite `resolve.dedupe: ['react', 'react-dom']` + peer 声明完整。

### 3.5 布局模式：hoisted（现状）vs isolated——未来研发分支方向（备案）

bun 安装器支持两种布局模式（**全局设置**，作用于整仓，bunfig.toml 配置或单次
`bun install --linker isolated`；bun 1.2+ 支持，本仓 1.3.14 可用）：

| 维度 | **hoisted**（现状，默认） | **isolated**（pnpm 式，备案方向） |
| --- | --- | --- |
| 布局 | store + 提升硬链接；成员本地 node_modules **仅版本冲突时嵌套** | 每成员 node_modules **实装其声明过的全部依赖**（symlink 到 store） |
| 成员 devDeps 实装 | ❌ 提升到根（✦ appshell 的 `./node_modules/@types/react` 候选在 editor 树落空） | ✅（✦ 内核 pnpm 树天然如此） |
| 幽灵依赖（未声明就 import） | ✅ 能跑（靠 eslint boundaries/CI 补位） | ❌ 结构性阻断（声明真实性强制成立） |
| 跨成员双实例 | 可能（嵌套副本 vs 提升副本，✦ lezer/双 React 实证） | 结构性隔离（各成员只 symlink 自己声明的版本） |
| paths 写法 | **多候选数组**（覆盖两布局的 18 副本位置，✦ 第四十七批） | 单候选 `./node_modules/...` 即可（可简化） |
| 迁移成本 | — | 整仓布局切换：删 node_modules 重装 + monaco 静态拷贝 glob 复验（提升假设）+ `.vite` 预构建缓存 + storybook/CI 缓存路径 |

**决策状态（第四十七批落档）**：备案未启用。当下问题（appshell 双布局类型对齐）
已由多候选 paths 解决且版本安全（候选不含内核 19 副本）；isolated 的真正收益是
**pnpm 级依赖纪律**（幽灵依赖阻断 + 双实例结构性消除）——值得单独立项评估，
不作为 paths 问题的补丁顺手做。

**启用触发条件**（满足其一再启动）：
1. 幽灵依赖事故实际发生（未声明导入在布局变化后断裂）
2. 双实例类问题第二次出现（类型/运行时多实例修复成本超过迁移成本）
3. 需要与内核 pnpm 树的解析语义完全对齐（跨树联调排查成本显著上升时）

**启用清单**（半天量）：bunfig.toml 加 `[install] linker = "isolated"` → 删
node_modules 重装 → 确认成员本地 symlink 存在 → 全门禁 + dev/build/storybook
冒烟 → monaco 静态拷贝完整性复核（根提升假设变化）→ CI 缓存路径确认
（bun.lock 与 linker 无关，无需变更）→ 文档更新（本篇 §3/§4 + alias-mechanisms
解析矩阵）。

---

## 4. 别名机制的 Bun 语义差异（对照 pnpm/npm）

| 维度 | **Bun** | pnpm | npm/yarn classic |
|---|---|---|---|
| tsconfig paths 运行时生效 | ✅ 原生读取（别名即运行时事实） | ❌ 仅编译期/打包期 | ❌ 需 loader hook |
| 读哪份 tsconfig | **按导入文件就近取**（成员各自生效） | 不适用 | 不适用 |
| node_modules 布局 | store + 提升硬链接（幽灵依赖敞开） | 符号链接农场（幽灵依赖被阻断） | npm 全扁平 |
| overrides 作用域 | 仅根 | workspace 全局 | npm 不达成员 |
| 内置测试器 | `bun test`（`mock.module` 按**解析后路径**绑定） | 无（vitest 自备 alias/dedupe） | 无 |

**四条后果**（全部实证）：

1. 别名一致性从编译问题升级为**运行时问题**——paths 错了不是 tsc 报错，
   而是运行时把 `.d.ts` 当 JS 执行直接崩溃。
2. 对齐策略受限：pnpm 一行 overrides 能做的事，bun 要靠类型层 paths 手法。
3. 提升布局下幽灵依赖能跑——包的依赖声明真实性靠 eslint boundaries/CI 补位。
4. 就近 tsconfig 是双刃剑：天然实现"各包各解析"（零配置），但**多 tsconfig 域的
   解析分歧隐蔽且不报错**——规则：**同一 specifier 在所有就近 tsconfig 域必须
   解析到同一路径**（mock.module 按解析后路径绑定，两端不一致即静默错位）。

---

## 5. 脚本编排与测试

1. 定向执行：`bun run --cwd packages/appshell build`；新版支持
   `bun --filter '<pkg>' <script>` 按包名过滤并行跑。
2. ✦ **`bun test` 过滤是子串匹配**：`bun test src` 会捞到一切含 "src" 的路径。
   用 `--path-ignore-patterns` 排除、或独立目录命名规避。
3. **谁家测试谁家树**：子包测试用子包自己的 runner + 自己的依赖树跑（内核 vitest
   归内核仓 CI）；宿主树里跑成员测试会撞成员 devDep 与宿主树的多实例问题
   （✦ 双 React 实证）。宿主只验证**宿主的消费假设**（类型桥/直通 typecheck +
   build + e2e）。
4. bun test 无 DOM 全局：组件测试 setup 自备 rAF/cAF shim、Storage 桩，不依赖
   全局 preload。

---

## 6. 发布

1. **main/exports 永久指 dist（发布契约形态，第四十七批反转）**：`main/types/exports`
   描述消费者拿到什么（dist/index.js + index.d.ts + style.css）；dev 源码直通由根
   tsconfig `paths` 承担，**不经 main**。⚠️ `npm pack/publish` 不应用 publishConfig
   字段重写（那是 pnpm publish 的特性）——按"publishConfig 换 main"设计的 tarball
   会指向不存在的 src（npm-smoke 实证）。详见
   [ts 编译/链接/运行行为篇](./ts-compile-link-runtime.md)。
2. vite lib mode：`external` 必须覆盖 peer 全集（含 `react/jsx-runtime`）+
   正则兜深路径；产物命名与 `exports` 逐字对齐。
3. **vite lib mode 不支持 `manualChunks`**（内核 B1 实证）——分包走多 entry
   （exports map 多子路径）。
4. `bun publish` 支持 workspace: 协议改写；`files` 白名单只带 `dist` + README。

---

## 7. CI

```
oven-sh/setup-bun（版本与 engines 一致）
  → bun install --frozen-lockfile
  → 分层 typecheck（根 / apps / 各包）
  → lint
  → 分层测试（各树各跑；子包测试在其自己的仓 CI）
  → 主 build
  → 独立包 lib build 冒烟
```

缓存 `~/.bun/install/cache`；**分支即推、CI 前置**——本地孤本等于门禁豁免
（✦ editor reui 首推连抓 4 项：lockfile 漂移、lezer 双实例、双 React、脚本路径）。

---

## 8. 本仓实证对照表

| 实践 | 出处 |
| --- | --- |
| 成员 devDep 变更 → lockfile 漂移 | 第四十六批 CI 首跑（rollup-plugin-visualizer） |
| 成员 version bump 零漂移 | 第四十六批（内核 v0.3.0 bump，frozen 幂等） |
| overrides 不穿透成员 | 第四十二批（内核 @types/react 19 钉不住） |
| 类型层 paths 钉单实例 | 第四十二批（react 18 压平）、第四十六批（@lezer/common/lr） |
| 双布局多候选 paths | 第四十七批（appshell 迁入内核仓，hoisted/pnpm 双布局对齐） |
| 就近 tsconfig / mock 绑定一致性 | 第四十二批（monaco d.ts 崩溃） |
| bun test 子串过滤 | 第四十二批（`--path-ignore-patterns` 引入） |
| 成员测试归位成员树 | 第四十六批（内核 vitest 门禁归位内核仓 CI） |
| lib mode manualChunks 限制 | 第四十五批（内核 B1 实验结论） |
| 分支即推 / CI 前置 | 第四十六批（reui 首推连抓 4 项） |
| linker 双模式备案（hoisted→isolated） | 第四十七批（appshell 迁移暴露成员 devDeps 不实装问题） |
