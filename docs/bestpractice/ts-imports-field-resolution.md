# TS 对 package.json `imports` 字段的解析语义：扩展探测与优先级

> 2026-09-03 沉淀。背景：方案 D（内核 76 文件 `@/` → `#` subpath imports，第四十六批）
> 落地时实测的一组 TS 解析行为——**imports 字段的目标不做扩展探测、且失败不回落
> paths**。这条语义决定了 imports 映射的正确写法，也是 shadcn CLI 双声明兜底成立与否
> 的关键。姊妹篇：[别名机制](./monorepo-alias-mechanisms.md)、
> [Bun Workspaces](./bun-workspaces-best-practices.md)、
> [决策复盘](./decision-retrospective-subpath-imports.md)。

---

## 0. 三条规则（TL;DR）

1. `imports` 字段值**永远带显式扩展名**（或以 `.ts`/`.tsx` 结尾的通配模板）。
2. 通配 `*` 只做**字面填充**——把调用方路径段填进模板，**填完不做扩展探测**。
3. `#` specifier 命中 imports 字段后是**最终裁决**，失败**不回落 tsconfig paths**。

---

## 1. 概念一：什么是"扩展探测"（TS 的贴心行为）

TS（`moduleResolution: bundler`）解析**不带扩展名**的导入目标时，自动尝试候选序列：

```
import ... from './utils'
                    ↓ 依次探测
        ./utils.ts → ./utils.tsx → ./utils.d.ts → ./utils/index.ts
```

**tsconfig `paths` 的映射目标同样享受这种探测**——这就是旧方案 `@/* → ./src/*`
能工作多年的原因：

```
"@/*": ["./src/*"]
import { cn } from '@/lib/utils'
    → 映射目标 ./src/lib/utils （无扩展名）
    → TS 探测 → 命中 ./src/lib/utils.ts ✓
```

---

## 2. 概念二：`imports` 字段是 Node 运行时规范——目标必须"自带扩展名"

package.json `imports` 字段是 **Node 运行时的解析机制**（node 执行时真的要打开文件）。
运行时不能猜扩展名（`utils` 是 `utils.js` 还是 `utils.ts`？逐个试探既慢又有歧义），
所以规范要求：**通配填充后的目标必须是确切文件路径**。TS 对 imports 字段的解析忠实
遵循 Node 语义——不施加 bundler 式探测。

### 2.1 实测对照（第四十六批，内核 246a058）

| imports 映射 | 导入 | 通配填充后目标 | 结果 |
|---|---|---|---|
| `"#icons": "./src/icons.tsx"` | `#icons` | `./src/icons.tsx`（**模板自带扩展名**） | ✅ 精确命中 |
| `"#lib/*": "./src/lib/*"` | `#lib/utils` | `./src/lib/utils`（**无扩展名**） | ❌ TS2307 |

第二行的本质：**`*` 通配只是把调用方的路径段原样填进目标模板**——填出来的仍是
无扩展名路径，TS 不做概念一的探测 → 直接报错。

### 2.2 修复：把扩展名写进映射模板

```jsonc
// packages/jdm-editor/package.json（最终形态）
"imports": {
  "#icons": "./src/icons.tsx",                    // 精确文件
  "#components/ui/*": "./src/components/ui/*.tsx", // 该族全 .tsx
  "#lib/*": "./src/lib/*.ts",                      // 该族全 .ts
  "#reui/icons/*": "./src/reui/icons/*.tsx"        // * 可含多段路径（animated/outline/information）
}
```

前提约束：**每个映射族内扩展名必须统一**；混合时拆多条映射或逐文件枚举。
漏映射的后果是 TS2307 **响亮失败**——优于静默解析到错误文件。

---

## 3. 概念三："不回落 paths"——两条通道互斥，不是兜底链

迁移过程中两套声明**并存**：

```jsonc
// tsconfig paths（给 shadcn CLI 校验用）
"#*": ["./src/*"]
// package.json imports（给运行时/构建用）
"#lib/*": "./src/lib/*.ts"
```

天真的期望：imports 解析失败时，TS 退而求其次再试 paths（paths 有探测，能成功）。
**实测：不回落**——`#` 开头的 specifier 命中 imports 字段后即**最终裁决**，
失败即失败，不级联到 paths（实证：加上 `#*` paths 后错误依旧，修正 imports
值本身才消失）。

原因：`#` 在 Node 规范里是保留前缀，**只能**经 imports 字段解析。若允许 tsc 在
imports 失败后回落 paths（paths 有探测、运行时没有），类型解析结果就会偏离
运行时真实行为——**TS 宁可报错也不撒谎**。

---

## 4. 总图

```
                      #lib/utils
                          │
        ┌─────────────────┴──────────────────┐
        ▼                                    ▼
  tsc (bundler)                        vite / bun
  先查 imports 字段                      先查 imports 字段
  命中 "#lib/*" → ./src/lib/utils       命中 "#lib/*" → ./src/lib/utils
  ①目标须自带扩展 → ✗ 失败，不回落 paths   ②目标扩展探测 → ✓ utils.ts
        │                                    │
  修复：映射写 "./src/lib/*.ts" → ①② 同时命中，四端一致 ✓
```

> 注意 ②：vite/bun 对 imports 目标**有**扩展探测（工程工具的宽容），但**不要依赖
> 它**——写法以 tsc 的严格语义为准，四端自然一致；依赖宽容端会造成"本地过、
> 严格环境挂"的漂移。

---

## 5. 实践守则

1. `imports` 字段值永远带显式扩展名，或以 `.ts`/`.tsx` 结尾的通配模板。
2. 映射族内扩展名统一；混合时拆多条模式（如 `#lib/*` 与假想的 `#lib-tsx/*`）。
3. tsconfig paths 的 `#*` 仅作为 shadcn CLI 的校验入口，**不是解析兜底**——
   两条通道互斥，写代码时不要指望 paths 救场。
4. 新增别名族 = 补一条 imports 映射；漏了会 TS2307 响亮失败——**响亮失败优于
   静默错文件**。
5. shadcn CLI 装机写出的导入若落在未覆盖的族，补映射即可（响亮失败定位明确）。

---

## 6. 本仓实证出处

| 项 | 出处 |
| --- | --- |
| `#icons` 精确命中 / `#lib/*` 通配失败 | 内核 246a058 迁移过程（桥 typecheck:kernel 前后对照） |
| 加 `#*` paths 不消除错误 | 同上（双声明并存时的实测） |
| vite/bun 对 imports 目标有探测 | 内核 lib build（KBUILD=0）与宿主全门禁（源码直通） |
| dist 零 `#` 残留 | 内核 dist/index.js 检索（构建期就地解析，第四十六批） |
