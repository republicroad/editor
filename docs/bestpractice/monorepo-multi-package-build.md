# Monorepo 多 npm 包编译与构建配置最佳实践

> 2026-09-03 沉淀。以本仓库三包布局（宿主应用 `src/` + 外壳包 `packages/appshell` +
> 内核子模块 `jdm-editor/packages/jdm-editor`）的适配全程为实证来源——文中每条
> 「症状/解法」都在第四十二~四十四批真实发生过，不是理论清单。
> 姊妹篇：[源码直通消费链](./monorepo-source-passthrough.md)（单包视角）、
> [别名机制对比](./monorepo-alias-mechanisms.md)、
> [Bun Workspaces 最佳实践](./bun-workspaces-best-practices.md)（bun 语义差异专篇）；
> 三端解析明细见 [docs/06 §7](../06-jdm-editor-submodule.md)。

---

## 0. 总原则

1. **包边界 = 解析边界**。任何跨包引用（specifier、别名、相对路径、类型）必须在
   vite / bun / tsc / storybook 四类工具下语义一致；做不到一致时，显式声明差异并
   用门禁锁住。
2. **dev 走源码、publish 走 dist、类型走桥**。三态分离，不追求单一配置通吃。
3. **每引入一个新解析机制，先跑一遍三层测试**（宿主 / 组件 / 子包）再继续。
   解析问题往往不在当下包，而在"最近 tsconfig"或"mock 绑定路径"这类间接层。

---

## 1. 包身份与依赖策略

### 1.1 peer / dependencies 边界

| 类别 | 判据 | 本仓库实例 |
| --- | --- | --- |
| `peerDependencies` | 宿主**必然拥有**且必须单实例的运行时 | `react`、`react-dom`、`@republicroad/jdm-editor`（内核） |
| `dependencies` | 包自用的 UI/工具库，允许与宿主共置 | radix 族、`sonner`、`lucide-react`、`clsx`、`tailwind-merge`、`axios`、`better-auth` |
| `devDependencies` | 仅构建/测试用，声明在包内但 monorepo 内可靠根提升 | `vite`、`vite-plugin-dts`、`typescript`、`@types/react` |

- peer 用 **semver range**（`>=18`、`>=0.2.0`），不要写 `workspace:*`——npm 发布时
  `workspace:` 协议不会被 npm 改写（bun/pnpm 会），跨包管理器发布必踩坑。
- 上下层包之间（appshell → 内核）永远 peer，绝不允许 appshell 把内核打进自己的
  dist（单实例 + 体积双重要求）。

### 1.2 dev / publish 入口切换

```jsonc
// packages/appshell/package.json
"main": "./src/index.ts",        // dev：bun 可直接执行 ts，vite 源码直通
"types": "./src/index.ts",
"publishConfig": {               // publish 时 npm/bun 自动换用
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": { ".": {...}, "./dist/style.css": "./dist/style.css" },
  "access": "public"
}
```

要点：
- **dev 入口指 src** 是 monorepo 内"零构建开发"的根基（改包源码即时生效）。
- 有 `exports` 字段时它优先于 `main`——dev 态要么不写 `exports`，要么把 dev 入口
  写进 `exports`；否则 bun/vite 会按 exports 找 dist 而报"模块不存在"。
- 根 `workspaces` 记得纳入新包目录（本仓库 `["apps/*", "jdm-editor/packages/*", "packages/*"]`），
  否则 `node_modules/@scope/pkg` 链接不会生成，bun 侧一切解析失效。

---

## 2. 入口三态模型

```
           ┌─ dev（monorepo 内）── main/types → src/index.ts（源码直通）
npm 包 ──┼─ publish（外部）──── exports/main → dist/index.js + index.d.ts + style.css
           └─ 类型（宿主 tsc）── 即时生成的 d.ts 桥（见 §3）
```

- **不要**让发布形态（dist）成为 monorepo 内开发的前置条件——那会退回
  "先 build 子包再开发"的陈旧链路。
- **也不要**让宿主 tsc 直接消费子包 ts 源码而子包带独立别名体系（见 §4 冲突实证）。
- `dist` 必须入 `.gitignore`（本仓库根 gitignore 的 `dist` 无前导斜杠，匹配任意层级）。

---

## 3. TypeScript 编译分层与类型桥（核心难点）

### 3.1 问题：子包源码进不进宿主编译程序

把子包 ts 源码拉进宿主 tsc 程序（paths → src）看似最"真"，但只要子包内部有自己的
别名（如内核的 `@/icons`）或独立依赖版本（内核 devDep `@types/react@19` vs 宿主 18），
宿主程序立刻爆出大量**子包内部错误**——它们不是你的 bug，却堵死你的门禁。

### 3.2 解法：即时 d.ts 类型桥

```jsonc
// tsconfig.kernel.json（宿主仓根）
{
  "extends": "./jdm-editor/packages/jdm-editor/tsconfig.json",  // 继承子包自身配置（含其 paths 语义）
  "compilerOptions": {
    "noEmit": false,
    "emitDeclarationOnly": true,
    "declaration": true,
    "allowJs": false,
    "outDir": "tmp/kernel-types",                     // 产物落在宿主仓 gitignore 目录
    "rootDir": "jdm-editor/packages/jdm-editor/src",
    "paths": {                                        // 子包程序内的依赖对齐（见 §5）
      "react": ["./node_modules/@types/react"],
      "react/jsx-runtime": ["./node_modules/@types/react/jsx-runtime"]
    }
  },
  "include": ["jdm-editor/packages/jdm-editor/src"]
}
```

```jsonc
// 宿主根 tsconfig.json
"paths": { "@republicroad/jdm-editor": ["./tmp/kernel-types/index.d.ts"] }
```

```jsonc
// package.json —— 桥再生必须**链式前置**，杜绝陈旧窗口
"typecheck:kernel": "tsc -p tsconfig.kernel.json",
"typecheck": "bun run typecheck:kernel && tsc --noEmit",
"build": "bun run typecheck:kernel && tsc --noEmit && vite build",
```

判据与收益：
- tsc 只见 `index.d.ts` + `skipLibCheck` → 子包内部错误、双 @types/react、别名冲突
  **一次性全部消失**；
- 桥产物即时再生、用完即弃，等价于"新鲜的 dist 类型"而无需跑完整 lib build；
- 子包类型正确性由**子包自己的 CI** 负责（谁家测试谁家 runner，见 §7）。

### 3.3 例外：轻子包可直接进宿主程序

无独立别名、无独立依赖版本的包（本仓库 appshell：包内别名已全部相对化，见 §4.3），
直接加入根 `include` 一起 typecheck 更简单。**判据：包源码能在宿主配置下零修改编译。**

---

## 4. 路径别名治理

### 4.1 症状：`@/*` 多包撞车（实证）

宿主 `@/* → src/*`，内核 `@/* → 内核 src/*`，两边真实引用了同名模块
（`@/components/ui/button`、`@/components/ui/label`、`@/lib/utils`）。
tsc 的 paths 是**程序级**的，无法按 importer 目录区分 → 精确映射桥接直接不可行。

### 4.2 四类工具的别名解析矩阵

| 工具 | paths 来源 | 语义 |
| --- | --- | --- |
| tsc | 程序所属 tsconfig（单数） | **程序级**，无 per-importer 能力 |
| vite（`vite-tsconfig-paths`） | `projects: [tsconfigA, tsconfigB]` | **按 importer 目录**匹配所属 project，各解析各的 |
| bun | 文件**最近的 tsconfig** | 就近取 paths——子包 tsconfig 缺映射时静默落到 node_modules（实证：组件测试崩溃，§6.2） |
| rollup/storybook | 同 vite（viteFinal 里装同一插件） | 同 vite |

### 4.3 规则

1. **发布包内一律相对导入**。包的对外形态不能依赖"宿主恰好配了同款别名"。
   本仓库 appshell 抽包时把 34 个文件的 `@/components|lib|reui` 全部相对化。
2. 包内确需别名（内核 `@/`）时，该包**自带完整 tsconfig paths**，且不得与宿主
   短别名同名冲突；宿主侧用 §3 的类型桥隔离。
3. vite 侧需要跨包源码直通时：`tsconfigPaths({ projects: [宿主, 子包] })` + 
   barrel 级 `resolve.alias`（alias 优先级高于 paths，可用来绕开"paths 指向 d.ts 桥"的
   tsc 专用映射，让运行时仍走 src）。

---

## 5. 依赖收敛（多版本依赖）

### 5.1 症状：双 `@types/react`（实证）

内核 devDep `@types/react@19`，宿主 18。同程序共存时报
`Type 'bigint' is not assignable to type 'ReactNode'`（React 19 的 ReactNode 多了 bigint）、
`ReactNode | Promise<ReactNode>` 等**看似无厘头**的类型错。

### 5.2 工具事实（实证）

- **bun `overrides` 不穿透 workspace 成员**：根 overrides 声明后，内核包本地
  node_modules 仍装出 19.x。npm 同语义（overrides 不作用于 workspace 包）。
- 多个 18.3.x 副本（18.3.11/18.3.31/18.3.28）因**结构类型**大体兼容，通常无害；
  18 vs 19 的副本才是致命的（ReactNode 形状变化）。

### 5.3 三条修法（按优先级）

1. **类型隔离**（§3 类型桥）：子包源码退出宿主程序，副版本问题失去作用域。
   内核侧再在桥 tsconfig 里 `paths` 把 `react` 对齐到宿主 @types 版本，
   使内核源码以宿主版本自检——顺手兑现 peer `react >= 18` 的类型承诺
   （实证修出 `useRef<HTMLDivElement | null>` 一处 18/19 双兼容写法）。
2. **单一版本**：包管理器支持时（pnpm `overrides` 全局生效 / 根直装）
   强制全树同一 `@types/react` 大版本；不奏效时别恋战，回到 1。
3. **运行时去重**照旧：vite `resolve.dedupe: ['react', 'react-dom']` 必配——
   类型对齐了，运行时双实例（hooks 报错）仍要单独防。

---

## 6. 运行时解析矩阵与 mock 绑定

### 6.1 vite dev/build

- barrel 走显式 `resolve.alias` → 子包 `src/index.ts`（源码直通运行时）；
- 子包内部别名走 `tsconfigPaths({ projects })`；
- `dedupe` react 系。

### 6.2 bun test：mock 按"解析路径"绑定（实证重灾区）

`mock.module('@scope/pkg', factory)` 注册与拦截都基于**解析后的文件路径**。
宿主 tsconfig paths 把 specifier 解析到 `tmp/kernel-types/index.d.ts`（文件存在），
mock 即绑定成功；一旦被测文件位于另一个 tsconfig 域（子包目录），bun 按就近
tsconfig 解析——映射缺失时落到真实包（甚至穿透进子包 src，把 monaco 的
`.d.ts` 当 JS 执行直接崩溃）。

**规则**：测试涉及的每一方（测试文件、被测文件、mock 声明处）必须把同一
specifier 解析到**同一路径**。跨 tsconfig 域的包，其 tsconfig 也要补同名映射。

### 6.3 bun 测试别走 barrel

barrel（`index.ts`）会拉起全部运行时（含 monaco 等重依赖）。bun 直测时一律
**深路径导入**（`@scope/pkg/src/shell/persistence` 这种子路径，配合无 `exports`
限制的 dev 包）。需要根 paths 提供两行映射：

```jsonc
"@republicroad/jdm-appshell":   ["./packages/appshell/src/index.ts"],
"@republicroad/jdm-appshell/*": ["./packages/appshell/src/*"]
```

### 6.4 storybook

viteFinal 里复用 vite 同款配置（alias + tsconfigPaths projects）；
`.storybook/preview.ts` 的样式导入属静态资源引用，路径迁移别漏
（实证：css 搬进包后 storybook 构建报 Could not resolve）。

---

## 7. 测试基建

1. **runner 归属**：子包用什么 runner 就让它的测试留在它自己的 runner 里跑
   （内核 vitest 自有 `bun run test`；宿主 bun test 不捞取）。
   宿主侧用 `bun test src --path-ignore-patterns **/子包/**` 防路径子串误捞——
   `bun test src` 的过滤是**子串匹配**，`packages/appshell/src/...` 与
   `jdm-editor/.../src/...` 都含 "src"。
2. **DOM 全局兜底**：bun 运行时没有 `requestAnimationFrame`；jsdom 默认也不实现。
   组件测试的 setup 里补 rAF/cAF shim + 按需 Storage 桩，别依赖全局 preload
   （preload 一旦指向被移除的文件，所有套件静默失去全局）。
3. **套件自足**：每个测试文件需要的全局（localStorage 等）自己注册，
   不假设执行环境。

---

## 8. 构建产物（lib 包）

```ts
// packages/appshell/vite.config.ts（要点）
build: {
  lib: { entry: 'src/index.ts', formats: ['es'], fileName: () => 'index.js' },
  rollupOptions: {
    external: ['react', 'react-dom', 'react/jsx-runtime',
               /^@republicroad\/jdm-editor(\/.*)?$/],   // peer 全外部（barrel 深路径用 regex 兜住）
    output: { assetFileNames: (a) => (a.name?.endsWith('.css') ? 'style.css' : a.name ?? '[name]') },
  },
},
plugins: [dts({ entryRoot: 'src', outDir: 'dist', include: ['src'] })],
```

- **external 必须覆盖 peer 全集**（含 `react/jsx-runtime`——jsx: react-jsx 的产物引用它）；
  正则兜深路径导入。
- 产物命名与 `publishConfig.exports` **逐字对齐**（本仓库 css 统一 `style.css`）。
- `vite-plugin-dts` 的 `entryRoot` 决定 d.ts 目录结构；`tsc --noEmit` 绿不代表
  declaration emit 绿，lib build 要单独冒烟。
- tailwind 包（样式类在源码里）：monorepo 内由宿主的 tailwind v4 扫描源码自动生效；
  npm 消费方需要 `dist/style.css` + 文档声明宿主 token 契约（写在包 README）。
- **vite lib mode 不支持 `manualChunks`**（内核 B1 实验实证）：分包策略在 lib 形态
  下被忽略，入口拆分只能靠多 entry（exports map 多子路径）实现——appshell 若未来
  按 surface 拆包（如 `./table`、`./graph`），走多 entry 而非 manualChunks。

---

## 9. CI 门禁顺序

```
bun install --frozen-lockfile          # 子模块/子包必须先就位（checkout submodules: recursive）
  → 类型桥再生（typecheck:kernel）      # 一切 tsc 的前置
  → 分层 typecheck（root / apps / 各包）# 根脚本链式保证顺序
  → lint（0 err/0 warn 门禁）
  → 三层测试（宿主 src / component-tests / apps；子包测试独立步骤走它自己的 runner）
  → 主应用 build（vite，含 tsc 前置）
  → 独立包 lib build 冒烟               # 发布形态可构建性
  → storybook build                     # 静态资源/别名完整性的最终检验
```

- 每加一种解析/配置，先在本地把这条链走绿再提交；CI 是裁决者不是探索场。
- 分支策略变更（如换开发分支）记得同步 CI 触发分支列表与 `.gitmodules` 的
  `branch` 字段——指针与分支声明属**同一个 commit**，否则 `--remote` 拉取漂移。

---

## 10. 本仓库映射

| 实践 | 配置点 |
| --- | --- |
| 三包布局 | 宿主 `src/`（页面/参考宿主）· `packages/appshell`（外壳/节点/UI kit/皮肤）· `jdm-editor/packages/jdm-editor`（内核，子模块） |
| 入口三态 | `packages/appshell/package.json`（main→src + publishConfig→dist）；内核包 dev 态不消费 dist |
| 类型桥 | `tsconfig.kernel.json` → `tmp/kernel-types/`；根 tsconfig paths；`typecheck`/`build` 脚本链 |
| 别名治理 | 包内相对导入（appshell）；内核 `@/*` 由其自身 tsconfig + vite projects 隔离 |
| 依赖收敛 | 桥 tsconfig paths 对齐 react 类型；vite dedupe；内核 ref 写法 18/19 双兼容 |
| mock 绑定 | `packages/appshell/tsconfig.json` paths 与根 tsconfig 同指 `tmp/kernel-types/index.d.ts` |
| 测试 | `bun test src --path-ignore-patterns **/jdm-editor/**`；组件测试 setup-jsdom + rAF shim；内核 vitest（CI 独立步骤 `bun run test`） |
| 产物 | appshell `vite build` → `dist/{index.js,index.d.ts,style.css}`，peer external |
| CI | `.github/workflows/validate.yml`（顺序见 §9，push 分支含 reui） |

---

## 11. 排障速查

| 症状 | 根因 | 处置 |
| --- | --- | --- |
| `Cannot find module '@/icons'`（tsc） | 子包源码被直接拉进宿主程序 | 走类型桥；根 paths 指向 tmp 产物 |
| bigint / Promise\<ReactNode\> 类型错 | 双 @types/react 大版本共存 | §5：类型隔离 + 桥内对齐 react |
| bun 测试崩溃：monaco `.d.ts` 被当 JS 执行 | mock 与被测文件解析路径不一致（就近 tsconfig 缺映射） | 被测包 tsconfig 补同名 paths（§6.2） |
| `The constant "X" must be initialized` | 同上（.d.ts 被执行的具体形态） | 同上 |
| workspace 包模块不存在 | workspaces 未含新包 / exports 指向缺失 dist / dev 入口被 exports 覆盖 | §1.2 |
| lint 报生成目录大量错误 | d.ts 桥产物被 eslint 扫描 | eslint globalIgnores 增 `tmp/**` |
| 改子包源码宿主 dev 不生效 | vite 预构建缓存 | 删 `node_modules/.vite`，整页刷新 |
