# Monorepo 别名机制：业界实践对比与本仓决策

> 2026-09-03 沉淀。背景：内核（jdm-editor）从 zrule 的"零别名相对导入"演进到
> reui 的 shadcn 式 `@/*` 别名后，宿主源码直通失效，由此引发的一系列适配与决策。
> 本文回答两个问题：**别名在 monorepo 里的业界共识是什么**、**本仓库为什么这样选**。
> 姊妹篇：[多包编译与构建](./monorepo-multi-package-build.md)、[源码直通](./monorepo-source-passthrough.md)。
> **决策过程复盘**（六轮演进 + 为什么 D 不是第一推荐 + 可迁移教训）见
> [决策复盘：Subpath Imports](./decision-retrospective-subpath-imports.md)。

---

## 0. 铁律：所有生态的共识

> **跨包引用永远走包名（published specifier），路径别名永远不跨包边界。**

没有例外——Nx、Turbo、Bazel、Go 全是如此。别名是**包内私有便利**，不是跨包契约。
分歧只在：包内别名长什么样、由谁解析、如何隔离。

---

## 1. 生态对照

| 生态/流派 | 包内别名形态 | 跨包方式 | 边界强制手段 |
|---|---|---|---|
| **Nx**（React/Node 大仓事实标准） | **作用域前缀**：每个项目生成 `@myorg/<project>/*`，tsconfig paths 按项目各自声明 | 包名（`@myorg/lib-x`）+ TS Project References | `enforce-module-boundaries` ESLint 规则（tag 化边界、禁跨包相对导入、禁用他人别名） |
| **Turbo**（Vercel） | **倾向无别名**：internal packages（`@repo/ui`）+ 包内相对导入 | 包名 + `exports` map（"Just-in-Time Packages"模式） | 包管理器解析即边界，几乎不用 tsc paths |
| **shadcn/ui**（单 app 哲学） | **通用 `@/*`**：一仓一别名空间，组件 copy-in（"it's your code"） | 无（假设单 app） | 无需——单包前提 |
| **TypeScript 官方**（Project References） | 各项目私有 paths | `references: []` + 声明产物（d.ts）——**消费方永远不见源码** | composite 编译边界，增量隔离 |
| **Bazel/Google** | **无别名**：workspace 根寻址（`//path/to:target`） | 可见性图（BUILD visibility） | 依赖图强制，构建期违规即失败 |
| **Go modules** | **无别名**：模块路径即身份（`github.com/org/repo/pkg/x`） | 全路径导入 | 编译器强制 |

趋势：**越是大仓/强边界生态，越趋向"别名作用域化或消亡"；跨包一律包名**。

---

## 2. 三种别名所有权模型

### 2.1 作用域前缀（Nx 流派）——`@kernel/*`

- 每个包的别名自带包前缀，**碰撞构造性不可能**（前缀所有权即命名空间）。
- tsc 的程序级 paths 依然成立：`@kernel/*` 全程序只有一个指向（内核 src），
  与宿主的 `@/*`（宿主 src）天然无交集。
- shadcn/reui CLI 装机：components.json aliases 写 `@kernel/...`，未来装机产物
  自动携带前缀——**无纪律成本**。
- 代价：一次性改写存量（本仓内核 76 文件）+ 双侧配置改名
  （内核 tsconfig paths / components.json + 宿主根 tsconfig 映射）。

### 2.2 通用别名 + 程序隔离（TS References 变体）——类型桥

- 子包保有 shadcn 原生 `@/*` 习惯，宿主程序**永不收编子包源码**——tsc 消费
  即时生成的 d.ts（本仓 `tsconfig.kernel.json` → `tmp/kernel-types`）。
- 运行时隔离由各工具的 per-importer 机制完成：vite `tsconfigPaths({ projects })`
  按 importer 目录取各自 paths；bun 按就近 tsconfig。
- 代价：桥产物 + 链式再生脚本（防陈旧）；子包类型检查归子包 CI。
- 适用：子包别名无法前缀化、或子包处于活跃开发期不宜做集成机制变更时。

### 2.3 包内全相对（Turbo 流派）

- 零别名可撞，任何工具链下成立；生成式工具（shadcn CLI）除外——
  **CLI 按别名写入导入，相对导入无生成模式**（生成器不知道文件最终深度）。
- 代价：每次 CLI 装机后需再改写（纪律型约束）；深目录的 `../../../` 可读性税。

### 2.4 Node Subpath Imports（`#` 前缀）——规范级 per-package（方案 D）

- Node 标准机制：package.json 的 **`imports` 字段 + `#` 保留前缀**（Subpath Imports）。
  `#...` 导入**按最近的 package.json 解析**——内核文件走内核的表、宿主文件走宿主的表，
  `#` 不在任何全局命名空间里，**碰撞在规范层面构造性不可能**。
- 内核映射范本：

  ```jsonc
  // packages/jdm-editor/package.json
  "imports": {
    "#icons": "./src/icons/index.ts",
    "#components/*": "./src/components/*",
    "#lib/*": "./src/lib/*",
    "#reui/*": "./src/reui/*"
  }
  ```

- 工具链支持（本仓版本全满足）：TS 5.4+（bundler 解析，5.9.3 ✅）、Vite 5.1+（7.x ✅）、
  bun ✅、esbuild ✅。lib 构建时 `#` 被 vite 就地解析，**发布 dist 零 `#` 残留**——
  外部宿主（dist 消费）完全无感知。
- 已知缺口与兜底：shadcn/reui CLI 的 aliases 校验对 tsconfig `paths`——内核 tsconfig
  同步声明 `"#*": ["./src/*"]` 即可让 CLI 校验通过并写出 `#...`（paths 与 imports
  字段双声明、同一指向，语义零分歧）；生成的 d.ts 若保留 `#` 引用，随包发布的
  package.json 已含 imports 字段，消费方 TS ≥5.4 可解析。

### 2.5 四方案对照表

| 维度 | ①作用域前缀 `@kernel` | ②通用别名+程序隔离（桥） | ③包内全相对 | **④`#` subpath imports** |
|---|---|---|---|---|
| 碰撞免疫（任意宿主源码直通） | ⚠️ 低概率残留 | ✅（隔离） | ✅ 构造性 | ✅ **规范级构造** |
| 跨工具一致性 | 四端同前缀各归各解析 | 桥隔离 | 处处成立 | 四端原生（TS5.4+/Vite5.1+/bun） |
| 未来 CLI 装机 | 天然兼容 | 随意 | 需再改写（纪律） | ✅（tsconfig 双声明兜底） |
| 子模块一次性成本 | 文本替换 + 配置改名 | **零** | 相对化改写 | 文本替换 + imports 字段 |
| 发布产物 | 含 `@kernel` 别名（bundle 内部） | 含 `@/`（bundle 内部） | 相对路径 | **零 `#` 残留（构建期消化）** |
| 维护心智 | "内核的东西都带 `@kernel`" | "内核是黑盒" | "内核无特权" | "`#` 即本包" |
| 业界对应 | Nx | Composite/声明消费 | Turbo | **Node 规范** |

> ①的残余风险说明：`@kernel/*` 把 `@/` 的"默认必然碰撞"缩小为"宿主误配才碰撞"，
> 但 tsc paths 是程序级全局名——**任何进入源码分发的别名前缀都是强加给所有未来
> 宿主的同名赌注**，`#` 是唯一的规范级出清。

---

## 3. 关键洞察

1. **`@/` 是 shadcn 单 app 约定的遗产**。它的隐含前提是"一仓 = 一别名空间 =
   一 tsc 程序"。monorepo 化后前提破裂——shadcn 官方 monorepo 方案的应对是
   **每 app 一份 components.json + 各自的 `@/`**（per-app vendoring），
   而不是消灭别名。
2. **Nx 多年大仓实践的收敛方向**：通用别名必然演化成作用域前缀——因为 tsc
   paths 是程序级的（无 per-importer 能力，vite projects 与 bun 就近 tsconfig
   都做不到 tsc 这一点），只能让前缀本身唯一。
3. **tsc 是唯一没有 per-importer 解析能力的主流工具**：
   - vite：`vite-tsconfig-paths` 的 `projects` 按 importer 目录匹配所属 project
   - bun：按文件就近 tsconfig 取 paths
   - tsc：一个程序一张全局 paths 表——这就是别名冲突只在 tsc 暴露的结构原因
4. **三种方案不是敌对而是分层**。成熟大仓常常三者并存：
   跨包用包名（铁律）+ 包内作用域别名（Nx）+ 边缘相对导入（Turbo）。

---

## 4. 本仓库的终态四层形态（方案 D 落地后）

```
跨包（铁律）      @republicroad/jdm-editor        ← 包名 specifier
内核包内          #icons、#lib/utils、#components/* ← Node 规范 per-package 别名
appshell 包内     相对导入（../../lib/...）         ← Turbo 式无别名
宿主 app 内       @/components/ui/...              ← shadcn 单 app 惯例（reui 装机自由）
```

- 解析矩阵：`#...` 按最近 package.json 解析（内核文件→内核 imports 字段；
  宿主文件不使用 `#`），tsc/vite/bun/storybook 四端原生一致，**无需任何
  跨 tsconfig 同名映射**；bun 测试 mock 绑定的"同 specifier 同路径"规则
  依然适用（见多包构建篇 §6.2），但 `#` 的 per-package 语义使其天然满足。
- 三份 shadcn UI 副本各归各（内核 13 / appshell 18 / 宿主按需 reui 装）——
  per-app vendoring 即 shadcn 官方哲学，冗余是设计不是妥协。

---

## 5. 本仓决策记录

| 时点 | 决策 | 依据 |
| --- | --- | --- |
| 第四十二批 | 类型桥落地（模型②） | 内核 reui 携带 76 文件 `@/` 且处于活跃开发期，跨包重构避开功能冲刺 |
| 第四十五批 | A′ 缓期至内核 0.3.0 发布 | 同上；缓存期实证桥架构稳定（两批次内核迭代零宿主适配） |
| 第四十六批初 | 内核 0.3.0 发布 → 触发 A′，任务 1（同步）完成 | 发布边界 = 跨仓重构的协调窗口；0.3.0 别名面零变动，窗口最干净 |
| 第四十六批修订 | **A′ 撤销 → 改执行方案 D（模型④）** | 需求方追问暴露 A′ 残余碰撞面（宿主可能自带 `@kernel`）；"按各自 package.json 解析"的约束显式化后，`#` subpath imports 成为唯一同时满足"任意宿主零碰撞 + CLI 可写 + 规范背书"的方案；完整复盘见[决策复盘](./decision-retrospective-subpath-imports.md) |
| 回滚预案 | 模型②保留为备案 | 若 `#` 迁移 spike 发现不可调和项（如 CLI/发布分布面），桥可即时恢复（工件与脚本在 git 历史） |

> 类型桥完整方案（含 tsconfig 范本、mock 绑定一致性、排障表）保留在
> [多包编译与构建篇 §3/§6](./monorepo-multi-package-build.md)，作为
> "子包别名无法前缀化时的通用解法"长期备案。
