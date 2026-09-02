# Monorepo 源码直通（Source Passthrough）最佳实践

> 适用场景：monorepo 中，应用（app）需要**直接消费**本地包（package）的 **TypeScript 源码**而非构建产物（dist），获得跨包热更新、类型实时同步与统一调试体验。本文以 bun workspace + vite + TypeScript 技术栈为基准（本仓库即此形态），机制对 pnpm/yarn workspace + webpack 等同类适用。

## 1. 为什么源码直通

| 维度 | dist 消费 | 源码直通 |
|---|---|---|
| 改包源码后生效 | 需先构建包（build）再刷新应用 | 保存即热更新 |
| 类型来源 | 包的 .d.ts（可能陈旧） | 包源码（实时） |
| 断点/报错定位 | 映射到构建产物 | 直接映射源码行号 |
| 调试 | 需 sourcemap 链路 | 原生 |
| 发起到落地的环节 | 改码 → build 包 → 刷新应用 | 改码 → 生效 |

**代价**：应用构建链需消化包源码的特殊语法/资源（scss、wasm、worker）；首启预构建可能变慢；跨包热更粒度通常为整页刷新而非局部。

## 2. 三层解析链（同一导入名，三个运行时各自解析）

以导入名 `@scope/pkg` 指向 `packages/pkg/src` 为例：

| 运行时 | 解析机制 | 结果 |
|---|---|---|
| **tsc typecheck** | tsconfig `paths` 映射 → 包源码纳入 typecheck 程序 | 类型来自源码 |
| **vite dev/build** | `vite-tsconfig-paths` 插件读取同一份 paths（或显式 `resolve.alias`）→ 源码纳入编译与 HMR 体系 | 源码 |
| **bun / node 运行时** | workspace 协议链接（`"workspace:*"`）→ 包 `main`/`exports` 入口 | 源码（bun 可直接执行 ts） |

**关键点**：三条链必须指向**同一处**（源码），否则出现「typecheck 过了但运行时错」「dev 正常 build 异常」的双形态问题。

## 3. 配置清单

### 3.1 根 tsconfig `paths`（类型层）

```jsonc
{
  "compilerOptions": {
    "moduleResolution": "bundler",   // 现代打包器语义
    "paths": {
      "@scope/pkg": ["packages/pkg/src"]
    }
  }
}
```

- 同时把包源码纳入 typecheck 程序——包内部以 `.ts` 后缀互相导入时，**所有**把包源码拉进编译程序的项目 tsconfig 必须开启：
  ```jsonc
  { "noEmit": true, "allowImportingTsExtensions": true }
  ```
- `.d.ts` 陈旧问题从根上消失（类型即源码）。

### 3.2 vite（运行时层）

```ts
// vite.config.ts
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],          // 桥接 tsconfig paths → vite 解析
  resolve: { dedupe: ['react', 'react-dom'] },  // 防双实例（跨包引用时必配）
});
```

- `vite-tsconfig-paths` 让 dev/build 均按 paths 解析到源码；源码不属于 node_modules 预构建范围
- 特殊资源随包源码进入应用构建链，需在**应用**侧具备消化能力：scss（`sass`）、wasm（`vite-plugin-wasm`）、worker 等
- 依赖去重：`resolve.dedupe` 防止应用与包解析出两份 react

### 3.3 bun（运行时/测试层）

- workspace 链接：根 `package.json` 声明 `"workspaces": ["packages/*"]` + 依赖 `"@scope/pkg": "workspace:*"`
- bun 原生按序解析相对导入后缀（`.js` 说明符可命中 `.ts` 文件）；推荐统一写**真实后缀 `.ts`**（配合 `allowImportingTsExtensions`），消除歧义

## 4. 排障速查

| 症状 | 原因 | 处置 |
|---|---|---|
| 改包源码后应用未生效 | 依赖预构建缓存（vite 的 `node_modules/.vite`） | 删缓存重启 dev server |
| TS5097（.ts 后缀导入报错） | 引用方 tsconfig 未开 `allowImportingTsExtensions` | 补开（需 noEmit） |
| hooks 报「两份 React」 | 构建未去重 | `resolve.dedupe` |
| 双形态问题（dev 正常 build 异常） | 三层解析链指向不一致 | 核对 paths / alias / workspace 入口三处同源 |

## 5. 何时不该源码直通

- 包作为**独立发布物**分发给外部（npm）：外部消费方仍走构建产物（dist）——源码直通仅限 monorepo 内部消费
- 包体积巨大且应用只用其极小部分：预构建产物可能更利于首启速度（可按需评估）
- 生产构建工具链无法消化包内特殊资源且短期无法补齐：降级为「仅 dev 直通」（alias 按 mode 条件生效），生产维持 dist

## 6. 本仓库映射（示例参照）

| 概念 | 本仓库位置 |
|---|---|
| 包 | `jdm-editor/packages/jdm-editor`（git submodule，fork 自上游） |
| paths | 根 `tsconfig.json`（`@gorules/jdm-editor` → 子模块 src） |
| vite 桥接 | `vite.config.ts`（`tsconfigPaths()` + wasm + monaco + dedupe） |
| 包内特殊资源 | styles.scss / dg.scss（sass）、`@gorules/zen-engine-wasm`（wasm）、monaco（静态拷贝） |
| 排障 | 见 docs/06 §7.4 |
