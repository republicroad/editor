# Monaco 编辑器：业界集成与分发三路线与本仓实现

> 2026-09-08 沉淀。背景：Vite 8 工具链升级中 `resolve.tsconfigPaths` 原生迁移实验
> 受内核 monaco 类型映射牵制（19 错误实证，提案见 [libsuggest/S008](../libsuggest/S008-monaco-tsconfig-path.md)，
> 实验归档见 [docs/17](../17-development-plan.md) 工具链节）。系统性对照业界三条
> 集成/分发路线——回答：业界怎么做、本仓为何这样选、何时值得换轨。

---

## 1. 三条主流路线

| 路线                                                     | 机制                                                                                             | 适用场景                       | 优                                                                            | 劣                                                                                    |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **① CDN 直连**（`@monaco-editor/react` 默认）            | `loader.js`（AMD）从 jsDelivr/unpkg 拉取 `min/vs`                                                | 公网 C 端应用                  | 零配置；跨站共享浏览器缓存                                                    | 供应链信任、版本漂移、离线不可用                                                      |
| **② 自托管 AMD `min/vs`**（**本仓现行**）                | 构建期静态拷贝 `min/vs` 到自有静态目录（带版本号路径），`loader.config({ paths: { vs } })` 指过去 | 企业内网 / 离线 / 受控环境     | 免 CDN 依赖；loader 自动管 workers（**零配置**）；版本化路径 = 不可变缓存语义  | 多一步静态拷贝；AMD loader 全局；编辑器本体不进应用 bundle（首载一次独立请求）        |
| **③ 打包器 ESM 集成**                                    | `import 'monaco-editor/esm/vs/editor/editor.main.js'` 入 bundle + 手工接 workers                 | 统一单 bundle 管线 / PWA / 严格 CSP | 单一构建管线、lockfile 锁版本、可经 `loader.config({ monaco })` 直接注入实例   | **workers 手工接线是最大痛点**；chunk 膨胀；CSS 需显式引入；CRA 等脚手架需额外插件 |

**选择规律**：公网 C 端 → ①；内网/离线/受控分发 → ②；有严格 CSP/PWA/单 bundle 交付
需求信号 → ③。路线②与①同构（同一 AMD 装载模型、同一 `min/vs` 产物），只是把「源」
从公网 CDN 换成自家静态目录——工程上是从 ① 迁到 ② 最小的一步。

## 2. 关键分水岭：workers 归谁管

monaco 的语法高亮/诊断跑在 Web Worker 里，worker 加载方式是三条路线最深的差异：

- **AMD 路线（①②）**：`loader.js` 从同一 `vs` 基路径自动解析
  `base/worker/workerMain.js` → 各语言 worker 按需加载，**零配置**。跨域部署时才需
  `MonacoEnvironment.getWorkerUrl` 返回 blob 代理（本仓同源部署，直接指 URL 即可，
  见 `src/lib/monaco.ts`）。
- **ESM 路线（③）**：必须手工实现 `self.MonacoEnvironment.getWorker`，Vite 下即
  `monaco-editor/esm/vs/language/*/xx.worker?worker` 一套；漏配的 worker 只会报运行时
  错（编辑器能起、智能功能全哑），是社区最高频的踩坑项。

## 3. 版本与单例治理（四条共识）

| #   | 实践                                                               | 本仓现状                                                                                     |
| --- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| 1   | **精确 pin 版本**：monaco 是 0.x，minor 间有破坏性变更，语义化范围不可用 | ✅ `monaco-editor: 0.52.2` 字面量（root devDep + 内核 peerDep `^0.52.2` 收敛到同版）          |
| 2   | **版本化静态路径**：产物路径带版本号（`/monaco-editor@0.52.2/min/vs`）| ✅ `vite-plugin-static-copy` 构建期拷贝 + `__MONACO_VS_BASE__` define 注入，`vite.config` 与 `src/lib/monaco.ts` 单一来源；等价 CDN 不可变缓存，滚动部署可多版本共存 |
| 3   | **单例纪律**：库与宿主共用 monaco 时，库声明 peerDep、宿主提供唯一实例 | ✅ 内核 `peerDependencies.monaco-editor ^0.52.2`（非可选）；宿主持有唯一 loader.config        |
| 4   | **打包层 dedupe 兜底**                                              | ✅ `resolve.dedupe: ['react', 'react-dom']` 同款思路；monaco 经 AMD 路线天然单实例            |

## 4. 本仓现状剖析：类型 shim 是路线②的自洽形态

本仓运行时**从不经过打包器解析 monaco**——编辑器本体由 AMD loader 在浏览器端从
`/monaco-editor@0.52.2/min/vs` 加载。由此产生类型侧的对应设计：

- 宿主 tsc：走 monaco-editor 包自带 `typings` 字段（`editor.api.d.ts`），无特殊配置；
- 内核 tsc：tsconfig paths 里显式映射 `monaco-editor → editor.api.d.ts`——这不是
  hack，而是「运行时不经打包器」在类型侧的镜像；宿主构建产物里的 `editor.api-*.js`
  chunk 仅来自内核少数**值导入**（`MarkerSeverity` 等枚举），与 AMD 本体互不重叠。

这条自洽性有一个已被实证的代价：**任何把 tsconfig paths 应用于运行时解析的打包器**
（Vite 8 原生 `resolve.tsconfigPaths`、oxc-resolver 系）会把该映射拽进模块图，
rolldown 解析 `.d.ts` 直接失败（19 错误实证）。vite-tsconfig-paths 插件对此有过滤，
故本仓继续使用插件——该 informational 告警可接受。根治通道已立项
[libsuggest/S008](../libsuggest/S008-monaco-tsconfig-path.md)：内核删除冗余映射
（包 typings 字段指向同一文件，typecheck 零变化），宿主随后即可迁原生选项。

## 5. 三条界外警告（不要做的）

1. **不要为"统一 bundle"盲目迁路线③**：worker 管线 + chunk 膨胀的集成代价，需要
   CSP/PWA 级别的需求信号才值得——那是部署形态变化，不是功能叠加。
2. **不要 patch monaco 包内部**（改 node_modules / postinstall 改写）：升级即失效，
   且破坏「版本化静态路径」的不可变假设。
3. **不要出现第二个 monaco 实例**：双 AMD loader 或 AMD+ESM 混用会产生互不识别
   model/marker 的两个编辑器宇宙——宿主集中持有唯一 `loader.config`，内核只经
   `@monaco-editor/react` 消费，不自行引 loader。

## 6. 演进出口（决策已备案）

- **维持路线②**。shim 消除通道 = S008（内核删映射）→ 宿主迁原生 `tsconfigPaths`
  并卸载插件（宿主后续小批次）。
- **换轨③的触发条件**（满足其一再议）：严格 CSP 禁运行时 script 注入；离线 PWA
  要求单 bundle 交付；monaco 相关静态资源需进同一完整性校验体系。届时集成方式为
  `import * as monaco from 'monaco-editor/esm/vs/editor/editor.main.js'` + Vite
  `?worker` 接线 + `loader.config({ monaco })` 实例注入，`vite-plugin-static-copy`
  与 `MONACO_VS_BASE` 全链退役。

---

**参考**：[@monaco-editor/loader](https://www.npmjs.com/package/@monaco-editor/loader)（paths.vs
自托管配置）、[离线 Electron 自托管实践](https://www.jameskerr.blog/posts/offline-monaco-editor-in-electron/)、
[loader.js 本地化陷阱（SO）](https://stackoverflow.com/questions/73522146/how-do-i-serve-monaco-editors-loader-js-and-its-dependencies-on-localhost-in-my)、
[monaco-react #327 本地化讨论](https://github.com/suren-atoyan/monaco-react/issues/327)、
[monaco-react #217 打包限制](https://github.com/suren-atoyan/monaco-react/issues/217)。
