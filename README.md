# Open-source Rules Engine Editor with build in Simulator

URL: https://editor.gorules.io

## 版本线（2026-09-15 更新）

> 本仓为 GoRules editor 的**硬分叉**，独立维护、独立版本线：
>
> - editor fork 起点版本 **0.1.0**（继承自上游 1.16.1，不延续上游 1.x 版本号，避免误读）
> - 内核子模块 `@republicroad/jdm-editor`（**0.8.0**，独立 0.x 硬分叉；S005 皮肤槽位 / S009 undo-redo 全量交付）
> - 外壳包 `@republicroad/jdm-appshell`（**0.9.0**：P1 工具栏 / P2 右缘面板 / P3 ShellHeader 三期槽位齐备）
> - UDF 运行时 `@republicroad/zen-udf`（**0.4.1**，npm 公开发布；多租户名单 / 决策缓存 / 影子评估 / 审计回放）
> - 引擎底座 `@gorules/zen-engine` **2.0.2**（新引擎线）；前端 wasm 0.23.1 独立版本线
> - 工具链：Vite 8（Rolldown）+ TypeScript 6.0 + Storybook 10.6；bun ≥1.3 单锁管理
> - 开发分支：`reui`（shadcn/ReUI 技术栈 + 独立内核 fork）；master 退役冻结于上游 1.16.1
> - editor 为应用不发布 npm；内核三包（jdm-editor / appshell / zen-udf）发布 npm

## 源码直通退役（2026-09-15 决策）

> 本仓对 `@republicroad/jdm-editor` / `@republicroad/jdm-appshell` 的消费方式已决策：从 **submodule 源码直通**（submodule + bun workspace + tsconfig paths + vite alias 四层叠加）退役为 **npm semver 包消费**，对齐边界文档第 3 条「升级只消费公开 npm 包」。
> standalone 开发验证职责由 jdm-editor 仓内的 playground 承接（源码直通 + HMR，`pnpm dev` 即完整验证面板）。
> 背景与演变史、三条循环分工、逐文件操作清单与成功标准见 **[docs/19-standalone-dev-and-source-direct-removal.md](./docs/19-standalone-dev-and-source-direct-removal.md)**。
> **退役执行前**，install 仍按下方 submodule 流程；执行后 clone 不再需要 `--recurse-submodules`。

## install

1. 本项目由 editor 主仓与 `jdm-editor` 子仓库（内核 + appshell + zen-udf）组成
2. 前后端统一使用 bun（monorepo 单一 `bun.lock`），建议 bun ≥ 1.3
3. 开发主线为 **reui 分支**（master 已退役冻结；standalone 分支已合并退役）

克隆并递归拉取子模块：

```bash
git clone --recurse-submodules --branch reui https://github.com/republicroad/editor.git
cd editor && bun i
```

若已直接 clone（未递归），补拉子模块：

```bash
git submodule update --init
```

## 快速开始

```bash
bun i           # 根目录一次性安装所有 workspace 依赖（apps/* + jdm-editor/packages/*）
bun run dev     # 单命令全栈：API 后端(:3000) + 前端 dev server(:5173)
```

- 编辑器：http://localhost:5173/
- OpenAPI 交互文档（Scalar）：http://localhost:3000/openapi

### 编辑器能力速览

- **undo/redo**：Ctrl/Cmd+Z 撤销、Ctrl+Shift+Z / Ctrl+Y 重做（工具栏亦有按钮，disabled 随栈态实时变化；文本输入框内为原生 undo）
- **MiniMap / snapToGrid**：画布内建（小地图位于左下角）
- **版本历史**：打开宿主图后顶栏 Versions 下拉——查看/加载/重命名/钉住历史版本，恢复即前进（立即落盘），恢复前差异以画布标记呈现
- **持久化**：默认 IndexedDB 本地适配器（local-first，无后端即可保存）；`?storage=http` 切换服务端 `/api/graphs` 适配器
- **换肤**：右上角切换皮肤（ocean 皮肤演示 P1 工具栏槽位 / P2 右缘面板 / P3 头部槽位注入）

## backend

后端为 Bun + Hono（`apps/editor`），提供决策仿真/推理、自定义节点 schema、名单（多租户）与图持久化 API。

```bash
bun run dev:api    # 仅启动后端(默认 :3000，PORT 可覆盖)
```

环境变量：`PORT`、`CORS_ORIGINS`（逗号分隔白名单，未设全放行）、`GRAPHS_DIR`/`ROSTERS_DIR`/`LOGS_DIR`（数据目录，生产挂 volume）、`TENANT_ID`（名单租户域，默认 `demo`）、`TRUST_PROXY_HEADERS`/`AUTH_SECRET`（网关头信任与签名身份）。

### Running via Docker

```bash
docker build -t editor .
docker run -p 3000:3000 editor
```

> 图/名单/日志落盘于容器 `/data`（graphs / rosters / logs），生产以 named volume 挂载持久化（容器内非 root 运行，卷属主自动迁移）。

### API 一览

| 方法   | 路径                                        | 说明                                                          |
| ------ | ------------------------------------------- | ------------------------------------------------------------- |
| POST   | `/api/simulate`                             | 决策图仿真执行（trace 全量，逐行落盘决策请求日志）            |
| POST   | `/api/decision`                             | 线上推理（`decisionId` 缓存复用 + `baseRevision` 式内容更新） |
| GET    | `/api/custom-nodes/schema`                  | 自定义节点 schema（由 zen-udf globalUdfRegistry 实时聚合）    |
| GET    | `/api/rosters?q=`                           | 名单列表（大小写不敏感过滤；按会话用户 + 租户域过滤）        |
| GET    | `/api/rosters/{name}`                       | 名单详情（他人私有 404 防探测）                               |
| POST   | `/api/rosters`                              | 创建/覆盖名单（upsert，落盘 + 租户内 owner 私有域）          |
| PUT    | `/api/rosters/{name}`                       | 更新名单（name 不可变，保留原归属）                           |
| DELETE | `/api/rosters/{name}`                       | 删除名单（内存 + 落盘文件一并清理）                           |
| GET    | `/api/graphs`                               | 图列表（分页 + 搜索；当前用户可见集）                         |
| POST   | `/api/graphs`                               | 新建图（owner 注入 + revision v1）                            |
| GET    | `/api/graphs/{id}`                          | 图详情（head 内容 + session 快照）                            |
| PUT    | `/api/graphs/{id}`                          | 更新图（`baseRevision` 乐观锁）                               |
| DELETE | `/api/graphs/{id}`                          | 删除图                                                        |
| GET    | `/api/graphs/{id}/versions`                 | 版本列表（manual 永久 / auto 滚动保留 / 命名与钉住豁免）      |
| PATCH  | `/api/graphs/{id}/versions/{revision}`      | 版本元更新（`versionName` 命名 / `pinned` 钉住）              |
| GET    | `/api/graphs/{id}/versions/{revision}`      | 加载历史版本                                                  |
| GET    | `/api/auth/get-session`                     | Mock 开发用户（better-auth 兼容格式）                         |
| GET    | `/healthz`                                  | 存活探针（匿名可达）                                          |

### 决策请求日志

`/api/simulate` 与 `/api/decision` 的每次请求逐行落盘 JSONL（`$LOGS_DIR/decision-requests-YYYY-MM-DD.jsonl`，UTC 日频滚动，`DECISION_LOG_KEEP_DAYS` 默认保留 14 天）：

```bash
$ LOGS_DIR=./logs bun run dev:api
$ tail -f logs/decision-requests-$(date -u +%F).jsonl
```

对象存储归档（Vector → 阿里云 OSS / S3 / MinIO）编排示例见 `deploy/vector-oss/`。

## 质量门禁

```bash
$ bun run lint             # eslint(含 prettier 规则)
$ bun run typecheck        # 主应用类型检查
$ bun run typecheck:apps   # apps/editor 类型检查
$ bun run test             # 主应用单元测试(bun test src，协议库等)
$ bun test apps/editor     # 后端路由 + 图级回归(编译/执行/深执行三层)
$ bun run test:components  # 组件交互测试(jsdom + RTL，含 undo/redo 语义闭环)
$ bun run test:zen-udf     # zen-udf 套件(vitest，内核包经 workspace 直跑)
$ bun run sync:schema      # 从 globalUdfRegistry 重新生成自定义节点 schema 夹具
$ bun run sync:schema:check# 门禁检查(夹具漂移时非零退出)
$ bun run check:single-instance  # 依赖单实例守卫
$ bun run storybook        # 组件文档(本地 :9009)
$ bun run build            # tsc --noEmit + vite build
$ bun run smoke:deploy     # 部署冒烟链(容器实机全链)
```

图级回归说明：`apps/editor/src/graph-regression.test.ts` 对宿主全部存量 head 图做「编译 → 执行 → 深执行」三层回归（内核 Y7 runDecisionTests 消费），随 `bun test apps/editor` 自动执行。

### Monaco 本地化加载

Monaco 从版本化静态路径加载（如 `/monaco-editor@0.52.2/min/vs/**`），而非 CDN：构建期由 `vite-plugin-static-copy` 拷贝，运行时 `src/lib/monaco.ts` 配置 `loader.config` 指向该基址。

## 以库方式嵌入（无状态）

编辑器定位为**通用无状态库**。鉴权与图存储由**宿主应用**负责，编辑器只消费注入适配器：

```tsx
import { EditorShellProvider, SkinnedDecisionGraph, createGraphsHttpAdapter } from '@republicroad/jdm-appshell';

<EditorShellProvider
  options={{
    // 宿主自己的鉴权（无状态：只管把会话用户填进执行上下文）
    authAdapter: myAuthAdapter,
    // 图持久化参考实现：apps/editor 的 /api/graphs；宿主可换成任意实现
    persistence: createGraphsHttpAdapter('/api/graphs'),
    // 决策仿真（引擎由宿主决定）
    simulate: mySimulate,
  }}
>
  <MyGraphPage />
</EditorShellProvider>;
```

注入 `persistence` 后，页面 Open 出现 "Graph library"、Save/Save-as 走宿主并带 `baseRevision` 乐观锁；实现 `listVersions` 即得版本历史（含命名/钉住/diff/恢复）。不注入则回退浏览器 File System Access API。契约见 `src/shell/persistence.ts`、宿主集成见 `docs/15`。

## 自定义节点（zen-udf）

自定义节点 = **zen-udf 注册 UDF** + **前端手写 spec**。UDF 经 `/api/custom-nodes/schema` 自动下发；
节点模型两档：**集合容器**（每命名空间一个，多行平铺调用）与**专属 UI 节点**（宿主 spec 接管，
图数据以 `config.locked: true` 标记）。

当前注册表（`jdm-editor/packages/zen-udf/src/contrib/`，参考域随 npm 包发布）：

| kind               | 名称       | 表达式协议(位置参数)                                                                | 说明                                 |
| ------------------ | ---------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `roster`           | 查询名单   | `['roster', "名单名", 值表达式]`                                                     | actor 隔离 + 租户域                  |
| `http_request`     | HTTP 请求  | `['http_request', url, "method", headers?, body?, params?, timeout?, retry?, auth?]` | SSRF 防护/超时重试/认证头注入        |
| `crypto`           | 摘要签名   | `['crypto', input, "algorithm", secret?, "encoding"?, upper?]`                       | md5/sha 家族 + HMAC                  |
| `current_date`     | 当前日期   | `['current_date']`                                                                   | 专属 UI 示范节点（ocean 皮肤接管）   |
| `custom_list_query`| 名单查询   | `['custom_list_query', "名单名", 值]`                                                | 复用 queryRoster（撞库图依赖）       |
| `ip_location`      | IP 属地    | `['ip_location', ip]`                                                                | env 可插拔数据集（不捆绑）           |
| `rate_1h` / `group_distinct_1h` | 频控/组去重 | 见 contrib/rate-window.ts                                                      | 进程内滑动窗口（生产 Redis 化归宿主）|
| `debug`            | 调试       | `['inout', value]` / `['func_without_args']`                                         | namespace 档集合容器示范             |

约定：

- 可选尾参**变长序列化**：末尾连续空值截断、中段空串占位；引擎侧对缺省/空值回退声明默认值 → 旧图零迁移
- 协议纯函数统一放 `src/lib/*-protocol.ts`（parse/serialize/normalize）并配套单测
- 新增 UDF 后执行 `bun run sync:schema` 同步离线夹具；开发流程见 `docs/13-custom-node-development.md`
- 历史已退役域：`json_path`/`template`（zen 表达式已覆盖，存量图由 normalize 层兼容，见 docs/18）

## 参考资料

### git submodule（退役执行前仍适用）

子仓库以 commit 锁定；子仓变更需先在子仓提交，再回主仓记录 gitlink：

```bash
$ cd jdm-editor/
jdm-editor$ git add xxxx && git commit -m 'xxxxx'
jdm-editor$ cd ..
$ git add jdm-editor/
```

子模块跟踪分支：`git submodule set-branch --branch reui jdm-editor`。

### Proxy Configuration (for network-restricted environments)

Ubuntu / macOS：

```bash
export HTTPS_PROXY=https://127.0.0.1:7890
export HTTP_PROXY=http://127.0.0.1:7890
export NO_PROXY=localhost,127.0.0.1
```

PowerShell：

```powershell
$env:HTTPS_PROXY="http://127.0.0.1:7890"
$env:HTTP_PROXY="http://127.0.0.1:7890"
$env:NO_PROXY="localhost,127.0.0.1"
```

## 文档索引

- `docs/README.md` — 全量文档索引
- `docs/02-architecture.md` — 架构与目录结构
- `docs/03-project-status.md` — 项目状态与批次记录（§7.3 变更日志）
- `docs/13-custom-node-development.md` — 自定义节点开发指南
- `docs/16-deployment-plan.md` — 部署方案（Docker/Podman）
- `docs/17-development-plan.md` — 开发计划（三轨道 + 批次排期）
- `docs/18-legacy-graph-compatibility.md` — 历史图兼容机制
- `docs/19-standalone-dev-and-source-direct-removal.md` — 源码直通退役决策与操作手册
- `docs/libsuggest/` — 对内核的单向建议队列（S001–S010）
