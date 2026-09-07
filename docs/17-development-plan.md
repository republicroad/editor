# 开发任务规划（2026-09-06）

> 宿主仓下一个阶段的任务规划与轨道划分。来源：2026-09-06 全仓分析（版本线、门禁基线、
> libsuggest 队列、部署现状）。执行状态随批次回填。

---

## 1. 项目现状快照（规划基线）

- **版本线**：editor 0.1.0（应用，不发 npm）/ 内核 @republicroad/jdm-editor 0.3.1 /
  外壳 @republicroad/jdm-appshell 0.1.0（均独立 0.x 硬分叉线）；开发主线 `reui` 分支。
- **架构**：前端 SPA（根仓 src/，React 18 + Vite 7 + shadcn/ReUI）+ 内核/外壳子模块
  （jdm-editor 仓，pnpm 树）+ Bun/Hono 后端（apps/editor）+ zen-engine UDF 库（apps/zen-rule）。
- **门禁基线（第六十批）**：typecheck（root+apps）/ lint 0-0 / 主仓 96 测 / 组件 46 /
  apps 80 / build / storybook / sync:schema:check / 单实例守卫——全绿。
- **协作机制**：宿主对内核的改动只能经 `docs/libsuggest/` 单向建议（S001–S006 proposed），
  宿主侧只做依赖升级 + 页面接线。

## 2. 轨道与任务

### 轨道 A：宿主自主可启动

| # | 任务 | 状态 | 说明 |
| --- | --- | --- | --- |
| A1 | decision-simple 页面拆分 | ✅ 第六十一批 | 页面壳 863→372 行；hooks/组件抽取 + `src/lib` 纯函数（autosave 策略、图环检测）+ 顺带修复 `listRemoteVersions` 剥 `auto`/`versionName` 字段缺陷 |
| A2 | auto 版本按天合并保留策略 | ✅ 第六十一批 | `auto-version-retention.ts` 纯逻辑（滚动 20 条 ∪ 每日检查点，`AUTO_VERSIONS_DAILY_KEEP` 默认 30，0 关闭）+ 路由级集成测试 |
| A3 | 容器 USER 硬化（root→bun + 卷属主） | 待启动 | 前置：确认 rootless podman 卷属主映射（docs/16 §6.2 取舍说明） |
| A4 | 部署冒烟脚本固化（scripts/smoke-deploy） | 待启动 | 把第五十九批手工冒烟链固化为可一键执行 + 非零退出码语义 |
| A5 | lexicon 词表域重建（按产品需求排期） | 待启动 | aho-corasick；名单/风控场景价值最高（docs/13 §8.3 备案） |

### 轨道 B：依赖内核交付后的宿主接线（libsuggest 消费后）

| # | 任务 | 前置（内核侧） | 宿主侧工作 |
| --- | --- | --- | --- |
| B1 | S006 钉住 UI 接线 | appshell 面板 Pin 按钮 + `adapter.updateVersionMeta` | 升级 appshell、替换页面直连 PATCH、接线测试 |
| B2 | S004 diff 视图消费 | appshell `computeGraphDiff` + 面板对比 | 升级消费（宿主不做 diff 语义，第五十七批裁决） |
| B3 | S005 布局槽位示范 | appshell `SkinDefinition.layout` | ocean 皮肤扩展工具栏/头部槽位示范 |
| B4 | TabRequest 快照盲区闭合 | 内核注册 useTabSerializer（~30 行） | 登记验证：input 在途编辑进历史快照 |

### 轨道 C：上线期（用户决策驱动，暂不排批）

1. 域名/反代/HTTPS + `TRUST_PROXY_HEADERS` 生产网关配置（docs/16 §5）。
2. better-auth 升级（触发条件四条见 docs/14 §5.2；迁移路径已备案，组件层零改动）。
3. GHCR 镜像发布节奏与正式环境消费约定。

### 跟踪项（不立批次）

内核 0.4.0 观察项、S001/S002/S003 对齐验证、上游 zen-engine-wasm 版本跟进——
内核会话消费后在 docs/03 批次记录中验证归档。

### 运维扩展（第六十二批新增）

- 决策请求日志落盘（JSONL 日频文件 + 保留策略）+ Vector → 对象存储归档示例
  （`deploy/vector-oss/`）——为线上审计/分析铺路，后续可加 Grafana/Loki 或
  OSS 生命周期策略。

### 工具链（第六十三批新增）

- Vite 7→8（Rolldown 默认打包器）+ TypeScript 5.9→6.0 + storybook 10.6 家族——全门禁绿。
  后续跟踪：vite.config.ts `__dirname` → `import.meta.dirname`（等 configLoader native 转默认时）、
  `resolve.tsconfigPaths` 内置替代 vite-tsconfig-paths（需先验证双 tsconfig 项目语义）。
- **TS 7 评估（2026-09-07，暂缓）**：typescript@7.0.2 已是 npm latest（Go 原生编译器，2026-08 GA）；
  本仓实测 `tsc --noEmit` 在 7.0.2 下零改动通过（tsconfig 无 7 的移除项命中）。唯一阻塞：
  typescript-eslint 8.69 稳定版 peer 封顶 `<6.1.0`，TS 7 支持由其 issue #10940 追踪、
  支持 TS 7 API 的 major 尚未发布——lint 门禁不可绕过，双 TS 版本共存方案（eslint 留 6、
  tsc 用 7）需 alias hack，违背单一实例纪律，不采纳。待其发版后升级，预期成本仅改版本号。

## 3. 执行记录

- **第六十一批（2026-09-06/07）**：A1 + A2 完成，全门禁绿，详见 docs/03 §7.3。
- **第六十二批（2026-09-07）**：决策请求日志落盘 + Vector→OSS 示例完成，详见 docs/03 §7.3。
- **第六十三批（2026-09-07）**：工具链升级（Vite 8 + TS 6，用户插队项）于 `reui-vite8` 分支完成；
  A3 + A4 顺延为下一批候选，详见 docs/03 §7.3。
