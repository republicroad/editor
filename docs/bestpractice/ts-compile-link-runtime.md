# Monorepo 中 TS 的编译、链接与运行：包形态与解析契约

> 2026-09-04 沉淀。这是本目录所有篇的**地基篇**——回答一个根本问题：
> **monorepo 里同一份 TS 代码，会被谁、以什么方式、在什么时候"看到"？**
> 文中所有行为都在本仓多包布局上实证过（第四十二~五十批）。
> 姊妹篇：[别名机制](./monorepo-alias-mechanisms.md)、
> [TS imports 字段解析](./ts-imports-field-resolution.md)、
> [Bun Workspaces](./bun-workspaces-best-practices.md)、
> [决策复盘](./decision-retrospective-subpath-imports.md)。

---

## 1. 核心模型：三个解析通道，谁在什么时候用哪个

monorepo 里一个导入 specifier（如 `@scope/pkg`）能被解析，靠的是三条**互相独立的通道**：

| 通道 | 载体 | 谁认它 | 生效时机 |
| --- | --- | --- | --- |
| **A. tsconfig paths** | 根/成员各自 tsconfig 的 `paths` | tsc（程序级）、vite（`tsconfigPaths` 插件）、**bun（原生，按就近 tsconfig）** | 类型检查 + vite/bun 运行时 |
| **B. node_modules 链接** | workspace 协议（`workspace:*`）→ symlink/硬链接 → 包的 `main`/`exports`/`imports` | node、bun、npm、所有工具的兜底路径 | 运行时 + tsc（paths 未命中时） |
| **C. 打包器 alias** | vite `resolve.alias` / storybook viteFinal | vite build/dev、storybook | **优先级最高**，压过 A/B |

**四条铁律**（全部实证）：

1. **tsc 的 paths 是程序级的**——一个 tsc 程序一张全局表，无法按"谁在导入"区分。
   vite（projects 按 importer 目录）与 bun（就近 tsconfig）都能做 per-importer，
   **唯独 tsc 不能**——别名冲突只在 tsc 暴露的结构原因。
2. **bun 把 paths 带进运行时**——`bun run/test` 按 paths 解析导入，paths 错了不是
   编译错，是**运行时崩溃**（实证：monaco `.d.ts` 被当 JS 执行）。
3. **通道间不互为兜底**：tsc 的 imports 字段失败不回落 paths；`exports` map 存在时
   node_modules 的子路径导入被封锁——**每条通道独立成立，别指望级联救援**。
4. **mock/测试工具按"解析后路径"绑定**（bun `mock.module`）——同一 specifier 在
   所有 tsconfig 域必须解析到同一路径，否则 mock 静默失效。

---

## 2. 包形态：manifest 是"发布契约"，不是开发配置

**main/types/exports 描述的是"消费者拿到什么"**——它必须永远指向发布产物（dist），
这是 npm 生态的通用语义，不由开发态需求改写。

### 2.1 双形态迷思（反面教材，第四十七批实证）

曾按"dev 态 main 指 src + publishConfig 发布时换 dist"设计 appshell：

```jsonc
// ❌ 错误设计
"main": "./src/index.ts",                    // dev 直通
"publishConfig": { "main": "./dist/index.js", ... }   // 期望 publish 时被替换
```

**事实**：`npm pack/publish` **不应用** publishConfig 的字段重写——
publishConfig 的字段重写是 **pnpm publish 的特性**；npm 的 publishConfig 只支持
registry 类字段（`access`/`tag`/`registry`/`provenance`）。

**后果**（npm-smoke 首跑实证）：tarball 的 main 仍指 `./src/index.ts`，而 `files`
白名单不含 src → 装出来的包 `require.resolve` 直接崩
（`Cannot find module ...src\index.ts`）。

### 2.2 正解：形态反转（第四十七批）

```jsonc
// ✅ 现行形态（与内核包统一）
"main": "./dist/index.js",          // manifest = 发布契约，永久指 dist
"types": "./dist/index.d.ts",
"exports": { ".": {...}, "./dist/style.css": ... },
"publishConfig": { "access": "public" },   // 只留 registry 类字段

// dev 源码直通由 tsconfig paths 承担（本就存在，零新增）：
// 根 tsconfig: "@republicroad/jdm-appshell": ["./jdm-editor/packages/appshell/src/index.ts"]
```

反转前逐一验证 dev 消费场景（component-tests 走深路径文件、宿主走 paths、后端零
导入）——**零场景依赖 main 指 src**，反转零破坏。

### 2.3 `exports` 的封锁效应（反转后的连锁）

`exports` map 一旦存在，**node_modules 的子路径导入被白名单封锁**——
`@scope/pkg/src/xxx` 这类深路径导入（monorepo 内部开发常用）会静默失效。
应对：

- 内部深路径导入**必须走 tsconfig paths**（paths 目标是文件系统路径，不经 exports）；
- 不要为了 dev 方便往 exports 里塞 src 通配——那会把发布契约弄脏。

---

## 3. 完整矩阵：monorepo 里 TS 的编译、链接、运行全景

| 场景 | 编译/类型（tsc） | 链接（依赖安装） | 运行（vite dev/build） | 运行（bun test/节点脚本） |
| --- | --- | --- | --- | --- |
| 宿主 import 包名 | 根 tsconfig paths → 包 src（类型来自源码） | workspace: 协议 → symlink/硬链接（main=dist 但被 paths 压住） | tsconfigPaths projects / 显式 alias → src | bun 就近 tsconfig paths；barrel 由 mock.module 桩替换 |
| 包内相对导入 | 跟随文件位置，天然正确 | — | 同左 | 同左 |
| 包内作用域别名 | 包 tsconfig paths（`#*`/`@kernel/*`） | — | vite-tsconfig-paths projects 按 importer 取 | bun 就近 tsconfig |
| 包的 `#` subpath imports | TS 5.4+ bundler（显式扩展名） | — | vite 5.1+ 原生 | bun 原生 |
| 外部消费者（npm） | 包的 dist/index.d.ts | main/exports → dist | — | — |

**读法**：同一份包源码，在"本仓开发"时走 paths（源码直通），在"被 npm 安装"时走
main/exports（dist）——**两个世界由包形态隔离，互不越界**。这就是"包形态必须
永久指 dist"的根本理由：你无法保证消费方在哪个通道遇到你。

---

## 4. 链接行为：三种布局的语义差（详解见 Bun Workspaces §3.5）

| 布局 | 成员本地 node_modules | 幽灵依赖 | 双实例 |
| --- | --- | --- | --- |
| bun hoisted（默认） | 仅版本冲突时嵌套（✦ appshell paths 候选落空的根源） | ✅ 能跑 | 可能（嵌套 vs 提升副本） |
| bun isolated（`[install] linker`，备案方向） | ✅ symlink 实装声明过的 deps | ❌ 阻断 | 结构性隔离 |
| pnpm（内核仓） | ✅ 符号链接农场 | ❌ 阻断 | 结构性隔离 |

**双布局适配**：tsconfig paths 用**多候选数组**按序探测（✦ appshell react/`@lezer`
映射——候选清单绝不能包含冲突版本副本，如内核的 @types/react@19）。

---

## 5. 运行期陷阱清单（每条都炸过）

1. **bun 运行时执行 `.d.ts`**：mock 绑定路径与被测文件解析路径不一致 → 内核源码被
   真实加载 → monaco d.ts 崩溃（§1 铁律 4）。
2. **wasm 引擎对 content 未知键 InvalidArg**：simulate 链路的 content 不能携带
   session 之类的附件键——**引擎校验比 zod 严格**，schema 放行≠引擎接受（第五十批）。
3. **vite lib mode 无 manualChunks**：分包走多 entry（内核 B1）。
4. **dist 消费方遇 wasm/monaco 的 node 兼容缺口**：浏览器产物不求值于 node
   （npm-smoke 的 WARN 降级设计）。

---

## 6. 决策守则

1. **manifest = 发布契约**：main/types/exports 永久指 dist；dev 需求一律走
   tsconfig paths / 打包器配置，不污染 manifest。
2. **跨包引用走包名，包内命名自带作用域**（`#` 或 `@scope/pkg 内前缀`）——别名
   不跨包边界。
3. **每加一种解析机制，先跑三层测试**（宿主/组件/子包）+ **本地校验用 CI 同版本
   工具**（prettier/typescript 的版本差会制造假绿/假红）。
4. **members 的 devDeps 环境差异是常态**（bun 提升 vs pnpm 实装）——paths 用多
   候选数组适配双布局，并在两个布局下各验证一次。
5. **发布前必跑 pack 模式 smoke**（装 tarball 而非 src）——发布契约由工件验证，
   不由配置推断。

---

## 7. 本仓实证对照

| 行为 | 实证出处 |
| --- | --- |
| tsc paths 程序级 vs vite projects/bun 就近 | 第四十二批（`@/` 冲突仅 tsc 暴露） |
| bun 运行时执行 paths 解析 | 第四十二批（monaco d.ts 崩溃） |
| npm pack 不应用 publishConfig 字段重写 | 第四十七批（appshell tarball 坏包） |
| exports 封锁子路径 + paths 双写 src 笔误 | 第四十七批（双通道齐断诊断） |
| 包形态反转（main→dist 永久化） | 第四十七批（零场景破坏验证） |
| 双布局多候选 paths | 第四十七批（appshell 迁入内核仓） |
| wasm 对 content 未知键 InvalidArg | 第五十批（simulate/session 隔离） |
| mock.module 按解析路径绑定 | 第四十二批（monaco d.ts 崩溃） |
