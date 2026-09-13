# 开发任务规划（2026-09-06）

> 宿主仓下一个阶段的任务规划与轨道划分。来源：2026-09-06 全仓分析（版本线、门禁基线、
> libsuggest 队列、部署现状）；2026-09-07 按内核 reui@91e8e8f 实际交付（appshell 0.2.0 命名版本、
> kernel computeGraphDiff P1、0.3.2 在途草稿快照）重新规划轨道 B 与批次排期。执行状态随批次回填。

---

## 1. 项目现状快照（规划基线）

- **版本线**：editor 0.1.0（应用，不发 npm）/ 内核 @republicroad/jdm-editor 0.3.3 /
  外壳 @republicroad/jdm-appshell 0.2.0（均独立 0.x 硬分叉线）；开发主线 `reui` 分支。
  宿主 gitlink 已推进 reui@91e8e8f（appshell 0.2.0 命名版本、kernel computeGraphDiff P1、
  0.3.2 在途草稿快照）——第六十四批前置完成（2026-09-07，随 catalog 对齐一并落地）。
- **架构**：前端 SPA（根仓 src/，React 18 + Vite 7 + shadcn/ReUI）+ 内核/外壳子模块
  （jdm-editor 仓，pnpm 树）+ Bun/Hono 后端（apps/editor）+ zen-engine UDF 运行时
  （内核包 jdm-editor/packages/zen-udf，2026-09 自 apps/zen-rule 迁入并更名）。
- **门禁基线（第六十三批）**：typecheck（root+apps）/ lint 0-0 / 主仓 116 测 / 组件 46 /
  apps 91 / build / storybook / sync:schema:check / 单实例守卫——全绿；工具链 Vite 8（Rolldown）+ TS 6.0。
- **协作机制**：宿主对内核的改动只能经 `docs/libsuggest/` 单向建议（S001–S007 proposed），
  宿主侧只做依赖升级 + 页面接线。

## 2. 轨道与任务

### 轨道 A：宿主自主可启动

| # | 任务 | 状态 | 说明 |
| --- | --- | --- | --- |
| A1 | decision-simple 页面拆分 | ✅ 第六十一批 | 页面壳 863→372 行；hooks/组件抽取 + `src/lib` 纯函数（autosave 策略、图环检测）+ 顺带修复 `listRemoteVersions` 剥 `auto`/`versionName` 字段缺陷 |
| A2 | auto 版本按天合并保留策略 | ✅ 第六十一批 | `auto-version-retention.ts` 纯逻辑（滚动 20 条 ∪ 每日检查点，`AUTO_VERSIONS_DAILY_KEEP` 默认 30，0 关闭）+ 路由级集成测试 |
| A3 | 容器 USER 硬化（root→bun + 卷属主） | 第六十五批（排期） | 前置：确认 rootless podman 卷属主映射（docs/16 §6.2 取舍说明） |
| A4 | 部署冒烟脚本固化（scripts/smoke-deploy） | 第六十五批（排期） | 把第五十九批手工冒烟链固化为可一键执行 + 非零退出码语义 |

### 轨道 B：内核交付后的宿主接线（2026-09-07 按内核 reui@91e8e8f 实测重排）

| # | 任务 | 内核交付状态 | 宿主侧工作 | 排期 |
| --- | --- | --- | --- | --- |
| B1a | 命名版本接线（S006 已交付半边） | ✅ appshell 0.2.0（66cb38a：adapter `renameVersion` 契约 + 面板 `onRename`/重命名/按名过滤 + HTTP PATCH `{versionName}`；宿主后端 PATCH 已支持 `{auto?, versionName?}`，无需新路由） | 版本面板接 `onRename`→`renameVersion`；收敛页面 PATCH 直连 workaround；**修复保留策略缺口**（`graphs-store.ts` pruneAutoVersions 仅按 `auto` 过滤，auto+命名版本会被折叠删除，违背内核「命名版本豁免 auto 保留」契约）+ 单测 | **第六十四批** |
| B2 | S004 diff 视图消费（P1） | ✅ kernel `computeGraphDiff`（b8a1bc2，零依赖纯函数，经 barrel 导出）+ 面板 `diffs` prop + DiffSummary 组件 | 打开版本历史时以各版本前一版为基线计算喂入（宿主只消费不算语义，第五十七批裁决不变）；P2 画布高亮内核未做，不阻塞 | **第六十四批** |
| B4 | TabRequest 快照盲区闭合 | ✅ 0.3.2（`useRequestSessionDraftSerializer` 在途草稿 700ms 防抖捕获 + `GraphRecord.session` 双适配器往返修复 57106d3） | 登记验证：input 在途编辑进历史快照；归档结论至 docs/03 | **第六十四批** |
| B1b | 版本钉住 Pin（S006 剩余半边） | ❌ 未实现（契约无 pinned 字段、面板无 Pin 按钮、无 `updateVersionMeta`）→ 已立项 libsuggest **S007** | S007 交付后升级消费 + 收敛 pin 直连 workaround | 待内核 |
| B3 | S005 布局槽位示范 | ✅ 内核 P1/P2/P3 全部交付（0.6.0–0.9.0：toolbarItems + right 面板槽位 + ShellHeader）| ✅ 第七十一批：SkinnedDecisionGraph 切换 + ocean 注入示范；P2 right/P3 header 消费待需求（§10-2/§10-3 备用） | ✅ |

### 轨道 C：上线期（已移出本仓，2026-09-11）

editor 重定位为 jdm-editor 官方演示项目（边界备案 editor-demo-boundary.md）后，生产上线
方案（域名/HTTPS/镜像消费约定/better-auth 升级等）属平台侧管理，**已迁出公开仓**至本地
mystate/轨道C上线方案.md（含决策清单）。自托管演示部署（compose/podman）不受影响，
文档见 docs/16。

### 批次排期（2026-09-07 重新规划）

- **第六十四批（✅ 2026-09-07）：内核消费接线批**——前置：gitlink 推进 `0020247→91e8e8f` + catalog
  跨树重对齐（补 `unplugin-dts ^1.1.0`、删 `vite-plugin-dts` 残留；内核已自对齐宿主数值）；
  正文：B1a 命名版本接线（feature-detect `onRename`，本地模式同享）+ 保留策略豁免缺口修复
  （「auto+命名」版本不再被折叠，路由级集成测试）；B2 diff 消费（`computeGraphDiff` 逐版基线喂
  `diffs` prop）；B4 快照验证归档（链路闭合，宿主零改动）。S007 提案已交付。
- **第六十五批（✅ 2026-09-08）：S008 消费收尾批（工具链）**——gitlink 推进 `91e8e8f→98d79d3`
  （内核消费 S008：删 monaco 类型映射 + `MarkerSeverity` 本地字面量化；随批带入 6 个 UI 回归修复）；
  vite.config 与 .storybook/main.ts 切 Vite 8 原生 `resolve.tsconfigPaths`，卸载 vite-tsconfig-paths
  ——此前 19 错误的根因（monaco 映射入运行时解析）已消，informational 告警归零。
- **第六十六批（✅ 2026-09-08/09）：A3 + A4 部署硬化**——A3 容器 USER 硬化（/data 预置 bun
  属主 + `USER bun`；存量卷自愈迁移入 smoke 脚本，docs/16 §6.2 未来项落定）；A4
  `scripts/smoke-deploy` 固化第五十九批手工链（非零退出码）。podman 网络恢复后实机全链
  PASS（exit 0，含卷属主自愈迁移），详见 docs/03 §7.3；rename/diff UI 浏览器走查顺延
  （数据链已容器实测，IAB webview 恢复后随任意部署走查）。
- **第六十八批（✅ 2026-09-09）：B 轨道第二轮接线（内核 65b2fb9 消费：0.4.0/0.3.0 发版 + i18n
  catalog，gitlink 已同步）**——
  ① `restoreVersion` 接线（appshell shell/restore.ts 库标准恢复即前进入口）：`onRestore`
  确认后改走新入口——load(revision)→save() 立即固化为新 head（可选 versionName、head 兜底、
  NOT_FOUND 语义），成功后 refreshVersions + 重载 head；**行为变化记录**：恢复从「载入画布随
  下次保存落盘」变「立即落盘」；② `diffBaseline` 消费（S004-P2 画布 diff）：恢复时记录恢复前
  图快照传 `DecisionGraph.diffBaseline`（画布差异标记，store 数据不受污染），编辑置 dirty 或
  新建图时清除；③ i18n 接线：宿主补 `I18nProvider locale="zh-CN"`（源码直通相对导入——
  I18nProvider 尚未进内核 barrel，barrel 导出跟进内核侧），面板 vh.* 文案 zh 显示。
  配套：组件测试桩补 `useT`（mock.module 进程级粘性 + 内核 i18n 化的残缺桩问题）。全门禁绿。
- **第六十七批（✅ 2026-09-09）：D1 旧图 kind 迁移**——映射纯函数（落点 `node.content.kind`，
  实测定锚；contrib.*→裸名、http_request 例外保留、roster.roster/risk.query_list→roster）
  + normalizeGraphNodes 在线接线（幂等）+ 批量脚本（--dry-run）。**验收口径修正**：撞库图
  实查无 namespaced kind（UDF 调用在 expressions.value，恢复靠 D2），真实样本为 mock-user-1
  contrib.http_request 例外图；单测 6 例含真实文件回归。全门禁绿。
- **第六十九批（✅ 2026-09-09）：D2 函数域重建**——`custom_list_query`（复用 queryRoster）、
  `rate_1h`/`group_distinct_1h`（进程内 60min 滑动窗口）、`ip_location`（可插拔数据集不捆绑）
  重建于 apps/zen-rule/src/contrib/；撞库攻击防御.json **仿真验收恢复**（双路径 trace 断言）；
  schema fixture 7→10 namespaces（已闭环：内核 1c238f7 入库，gitlink 5aac9bf 起一致）。
  与 67 批 D1 构成撞库图「旧图恢复→仿真恢复」完整闭环。全门禁绿。
- **第七十批（✅ 2026-09-09）：S007 版本钉住消费收口（内核 66fbf87 消费：appshell 0.4.0）**——
  ① 后端：`graphs-store` patch 契约扩展 `pinned` 键（**内核裁决为独立 meta 键，未复用 auto**，
  S007 提案口径更新）+ `pruneAutoVersions` 豁免 pinned（与命名版本同款）+ versions 列表透传
  pinned + OpenAPI schema 更新 + 单测；② 前端：`VersionHistoryPanel.onPin` 接线
  （feature-detect `updateVersionMeta`，HTTP PATCH body 已含 pinned）；**退役宿主自研
  PinVersionsSheet 与直连 PATCH workaround**——内核面板已带 Pin/Unpin 控件 + pinned 徽标 +
  pinned 过滤（消除双实现，同 68 批 restoreVersion 先例）。全门禁绿。
- **第七十一批（✅ 2026-09-10）：S005 P1 消费（内核 0.6.0：toolbarItems + SkinnedDecisionGraph）**——
  DecisionGraph → SkinnedDecisionGraph 切换（props 透传 + ref 转发，68 批链路不变）+ ocean
  皮肤 `host:toolbar.publish` 发布按钮注入示范。全门禁绿。
- **第七十二批（✅ 2026-09-10）：内核 0.7.0–0.9.0 消费（S005 P2/P3 + break change 消化）**——
  gitlink → 51553f4（appshell 0.9.0：P2 右面板槽位 + P3 ShellHeader，均就绪备用）；
  **breaking 0.7.0 消化**：移除 json_path/template contrib 对齐内核终态（零调用实证，
  zen 表达式覆盖；crypto 内核终态已加回且与宿主 crypto.ts 契约一致故保留）；fixture 8ns
  对齐。B3 全部三期（P1 工具栏/P2 右面板/P3 头部）宿主侧就绪。全门禁绿。
- **第七十三批（✅ 2026-09-10）：自包含演示栈收口 + S005 三期槽位全消费**——P3 ShellHeader 接线
  （ocean header 左右槽位示范）+ P2 右缘面板消费（ocean host:panel.environment 图元信息面板）+
  `bun run dev` concurrently 单命令全栈（对齐 editor-demo-boundary 自包含定位）。全门禁绿。
- **第七十六批（✅ 2026-09-12）：内核 0.7.0 消费（ShellHeader ref 修复 + 键盘拖拽/rolldown i18n
  修复随 gitlink 进入）；roadmap 3.2 宿主回归闭环（宿主侧零专属工作），详见 docs/03 §7.3。**
- **第七十四批（✅ 2026-09-10）：持久化默认翻转 local-first**——无参数默认 IndexedDB 本地
  适配器（clone → `bun run dev` 纯前端即得完整编辑器，业界演示仓 local-first 惯例：
  excalidraw/tldraw 同款，零服务端零滥用面）；`?storage=http` 显式切换服务端适配器
  （apps/editor + graphs-store 保留为 GraphPersistenceAdapter 后端集成示例）。
  模拟执行仍走 /api/simulate（dev concurrently 全栈）。全门禁绿。

- **已移交（2026-09-10）：A5 lexicon 词表域 → verdict 平台承接**——随编辑器演示定位调整
  迁出本仓（需求与契约问题记录于 mystate/lexicon-词表域需求.md）；editor contrib 无此域、
  无存量图调用，零迁移成本。B3 全部三期（P1 工具栏/P2 右面板/P3 头部）宿主侧就绪。全门禁绿。
- **待定/跟踪（不排批）**：D3 per-tool ui 字段 + ext/ 插件化（docs/13 §8.3，拐点驱动）；
  命名版本按名检索 UI 增强（服务端 versionName 已就绪）、版本存储治理（压缩/去重，量大再做）。
- **已裁撤（2026-09-10 演示栈定位决策）**：运行日志搜集的后续项全部裁撤（Vector→OSS 实机
  联调、Grafana/Loki、OSS 生命周期策略——演示栈无审计需求）。已实现的 decision-request-log
  JSONL 落盘与签名 cookie 鉴权**维持现状、不再投入、不再扩展**（行为无害）；日志搜集/存储
  与鉴权升级能力由私有 verdict 平台承接（独立项目，与演示栈单向无依赖）。生产上线方案整体
  已迁出本仓（mystate/轨道C上线方案.md）。


### 跟踪项（不立批次）

S001/S002 对齐验证、S003 回填确认（内核第六十批已修复，待内核会话标记 done +
宿主验证归档）、上游 zen-engine-wasm 版本跟进——内核会话消费后在 docs/03 批次记录中验证归档。
（内核 0.4.0 观察项已核销 2026-09-09：gru-hl-view / --grl-* 契约无变化；S004 P2 画布 diff
已随内核 0f3b4da 交付，消费排入第六十八批。）

### 运维扩展（第六十二批新增）

- 决策请求日志落盘（JSONL 日频文件 + 保留策略）+ Vector → 对象存储归档示例
  （`deploy/vector-oss/`）——为线上审计/分析铺路，后续可加 Grafana/Loki 或
  OSS 生命周期策略。

### 工具链（第六十三批新增）

- Vite 7→8（Rolldown 默认打包器）+ TypeScript 5.9→6.0 + storybook 10.6 家族——全门禁绿。
  `__dirname` → `import.meta.dirname` 迁移已完成（2026-09-07，configLoader native 就绪，
  `engines.node` 同步升至 ≥20.19 与 Vite 8 门槛一致，preview 告警消除）。
  防双实例备案（内核 playground 案例 2998cc6）：workspace 源码包若被 vite dev 预打包，会把当时
  的 dist 冻结成第二份内核副本（双实例 → context 断裂白屏，dist 变化触发整页 reload）。宿主 dev
  当前经 alias 源码直通未触发该症状；一旦出现，把 `@republicroad/jdm-editor`、
  `@republicroad/jdm-appshell`、`@gorules/zen-engine-wasm` 加入 `optimizeDeps.exclude`。
- 内核 3 个「有意为之勿顺手修复」脆弱点备案（内核 bestpractice `8f48747`，宿主升级
  React / 调整 moduleResolution 时对照）：① appshell 钉 `@types/react` 18 / 内核 19 双轨——
  内核源码用 React 19 独有类型会断 appshell typecheck，属预期信号；② 内核 `#*` 子路径导入
  依赖其 package.json `imports` 字段（宿主 tsconfig paths 不覆盖该机制）；③ appshell 未设
  esModuleInterop 且 lib 为 ES2022。
  `resolve.tsconfigPaths` 内置替代已实证**不可切换**（2026-09-07）：选项仅 boolean 无细化配置，
  内核 tsconfig 的 `monaco-editor → editor.api.d.ts` 类型 shim 映射（内核 pnpm 树 typecheck 用）
  会被内置解析器应用于运行时，rolldown 解析 .d.ts 直接报错（19 errors）；插件的双项目过滤语义
  在本仓是必要的——vite-tsconfig-paths 保留， informational 告警可忽略。
- **TS 7 评估（2026-09-07，暂缓）**：typescript@7.0.2 已是 npm latest（Go 原生编译器，2026-08 GA）；
  本仓实测 `tsc --noEmit` 在 7.0.2 下零改动通过（tsconfig 无 7 的移除项命中）。唯一阻塞：
  typescript-eslint 8.69 稳定版 peer 封顶 `<6.1.0`，TS 7 支持由其 issue #10940 追踪、
  支持 TS 7 API 的 major 尚未发布——lint 门禁不可绕过，双 TS 版本共存方案（eslint 留 6、
  tsc 用 7）需 alias hack，违背单一实例纪律，不采纳。待其发版后升级，预期成本仅改版本号。

## 3. 执行记录

- **第六十一批（2026-09-06/07）**：A1 + A2 完成，全门禁绿，详见 docs/03 §7.3。
- **第六十二批（2026-09-07）**：决策请求日志落盘 + Vector→OSS 示例完成，详见 docs/03 §7.3。
- **第六十三批（2026-09-07）**：工具链升级（Vite 8 + TS 6，用户插队项）于 `reui-vite8` 分支完成，
  已合并回 `reui`，详见 docs/03 §7.3。
- **规划更新（2026-09-07）**：核查内核 reui@91e8e8f 实际交付（appshell 0.2.0 命名版本、
  kernel computeGraphDiff P1、0.3.2 在途草稿快照）后重排——B1a/B2/B4 落第六十四批，
  B1b（Pin）立项 S007，B3 维持待内核；A3+A4 顺延第六十五批；新增 66 批候选 D1/A5。
- **第六十四批（2026-09-07）**：内核消费接线完成（B1a 命名版本接线 + 保留策略豁免契约修复 +
  B2 diff 消费 + B4 验证归档），全门禁绿，详见 docs/03 §7.3。
- **第六十五批（2026-09-08）**：S008 消费收尾（gitlink 98d79d3 + 原生 tsconfigPaths 迁移 +
  卸载 vite-tsconfig-paths），工具链跟踪清单清零，全门禁绿，详见 docs/03 §7.3。
- **第六十六批（2026-09-08）**：部署硬化（A3 USER 硬化 + A4 冒烟脚本固化 + 存量卷自愈迁移）；
  podman 网络恢复后实机全链 PASS，详见 docs/03 §7.3。
- **第六十七批（2026-09-09）**：D1 旧图 kind 迁移（映射纯函数 + 在线接线 + 批量脚本；
  验收口径修正：撞库图靠 D2 恢复仿真），全门禁绿，详见 docs/03 §7.3。
- **第六十八批（2026-09-09）**：B 轨道第二轮接线（restoreVersion + diffBaseline + i18n
  Provider），全门禁绿，详见 docs/03 §7.3。
- **第六十九批（2026-09-09）**：D2 函数域重建（四函数 + 撞库仿真验收恢复），全门禁绿，
  详见 docs/03 §7.3。A5 lexicon 转待产品需求。
- **第七十批（2026-09-09）**：S007 版本钉住消费收口（后端 pinned 契约 + 保留豁免 +
  前端 onPin 接线 + 双实现退役），全门禁绿，详见 docs/03 §7.3。
- **第七十一批（2026-09-10）**：S005 P1 消费（SkinnedDecisionGraph 切换 + ocean 工具栏
  槽位注入示范），全门禁绿，详见 docs/03 §7.3。B3（S005）宿主侧闭合；
  P2 面板位置/right 槽位待内核 0.7.0（bottom 已裁剪，§10-2）。
- **第七十七批（2026-09-12）**：zen-rule 整体迁入内核包 jdm-editor/packages/zen-rule
  （@republicroad/zen-rule，独立发布能力保留），宿主引用重指向，全门禁绿，详见 docs/03 §7.3。
- **第七十八批（2026-09-13）**：内核语义更名消费（zen-rule→zen-udf，宿主依赖/imports/脚本/
  lockfile 跟随）+ 子模块工作区遗留比对（补回重构漏删的 15 个测试用例，内核 d2aaf896）+
  遗留拷贝清理，全门禁绿，详见 docs/03 §7.3。
