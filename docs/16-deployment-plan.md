# 第十五批：部署收尾(第十六份文档)

> 日期：2026-08-27
> 目标：清除 Rust/pnpm 遗留，后端收敛为 Bun/Hono 单后端，Docker 镜像重建，CI 从"纸面绿"升级为真门禁。

## 1. 范围

| 项                 | 说明                                                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Rust/pnpm 遗留清除 | 删 `backend/`、根 `Cargo.toml`/`Cargo.lock`、`pnpm-lock.yaml`、`.gitignore` `/target`；CI 删 rust-codequality job           |
| 后端收敛           | `apps/editor`(Bun/Hono)为唯一后端，取消 Rust/Axum 双后端描述                                                                |
| Dockerfile 重写    | `oven/bun` 多阶段；前端产物 `static/` 复制到 `apps/editor/public`(Hono `serveStatic` 目录)；graphs/rosters 以 volume 持久化 |
| `.dockerignore`    | 排除 node_modules / static / graphs / lists / logs                                                                          |
| CI 真门禁          | 去 `continue-on-error`；加主仓 test + apps test；新增 build job；checkout `submodules: recursive`；push 触发 master + zrule |

## 2. 提交划分

- B1：Rust/pnpm 遗留清除 + 文档清理(docs/02、docs/04、CI rust job)
- B2：Dockerfile 重写 + `.dockerignore`
- B3：`validate.yml` 真门禁
- B4：docs/03 §5/§6/changelog + README + 新增本计划文档 + 已知问题记录

## 3. 验证

- 本地回归：lint 0 errors、typecheck/apps 绿、主仓 `bun run test`、apps `bun test apps/zen-rule apps/editor`
- 镜像：podman 本地 `podman build -t editor .` + 冒烟运行 `podman run -p 3000:3000 editor`

## 4. 已知问题 backlog

### request 节点 Schema 数据保存丢失（已关闭：由第五十批规则历史重设计吸收）

- **现象（历史记录，2026-08-27 第十五批）**：保存规则时 `contrib.http_request` 节点(content: `{name, config}`)的 Schema 数据未保存。
- **当时的定位结论**：服务端非根因(`GraphContentSchema` 用 `z.record(z.string(), z.unknown())`，不剥字段)；`graphs-http-adapter` 与 `graph-persistence.ts` 均透传；初判"Schema 存于 node.content 之外"。
- **第五十批处置（2026-09-04）**：需求方确认不再复现旧场景（该节点实现已经历 zrule→reui→appshell 三轮完全重写，当时的实现已无代码继承）。处置方式：**规则历史重设计**——保存内容升级为完整现场快照（`GraphRef.serialize()` 的 `{viewport, 页签, 各页签 slice}` 随 `content.session` 入库），编辑器在途状态（含未落 content 的草稿）进入历史捕获范围；服务端 `GraphContentSchema` 放行 `session` 键。旧 bug 的根因面（保存边界不完整）由本设计结构性修正。
- **遗留观察项**：input 节点（TabRequest）的在途 schema 编辑仍走 700ms 防抖落 content——其未注册 useTabSerializer，快照不捕获该窗口；如需覆盖，内核仓单点任务（照上游 tab-expression 模式注册，~30 行）。

## 5. 开放项(推进部署后续还需要的)

- 真实部署配置：镜像对外推送仓库名、生产 env(`TRUST_PROXY_HEADERS`/`X-User-Id` 网关、`PORT`)、卷挂载编排(docker-compose / k8s)。
- 日志采集归档：决策请求日志 JSONL 落盘已上线(第六十二批，`LOGS_DIR`)；Vector→对象存储编排示例见 `deploy/vector-oss/`（可运行起点，OSS 侧未实机联调）。

---

## 6. 第五十九批：本地 Podman 部署落地（2026-09-06）

> 决策：部署目标 = 本地 Podman（Windows + WSL2 machine，podman 6.1.1，`podman compose`
> 委托 podman-compose.exe）；域名/反代上线期再议。认证 = 方案 B 签名 cookie（docs/14 §5.1），
> better-auth 为上线期升级方向。

### 6.1 交付物

| 文件                                 | 内容                                                                                                                                                                                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Dockerfile`                         | bun 1.4.2（对齐 CI/本地）；**补 appshell 成员清单 COPY**（appshell 迁入后旧文件缺失该项，frozen-lockfile 必炸）；`bunfig.toml` 提前 COPY（镜像内 isolated linker 生效）；数据目录固定 `/data/{graphs,rosters}` + `VOLUME`；`HEALTHCHECK /healthz`（bun fetch 探针） |
| `.github/workflows/build-docker.yml` | 全面改造（原为上游遗产：master + chore(release) 触发、gorules/editor 镜像名）：reui push / workflow_dispatch 触发 → `ghcr.io/republicroad/editor`（latest + sha tag）→ GHCR 用 GITHUB_TOKEN（packages:write）→ gha 构建缓存                                         |
| `docker-compose.yml`                 | 单服务 `editor`：宿主端口 `${PORT:-3000}` 映射容器 3000；env `AUTH_SECRET`/`CORS_ORIGINS`（默认值仅限本地）；named volumes `graphs-data`/`rosters-data`；compose 级 healthcheck 兜底                                                                                |

### 6.2 运行手册（本地 Podman）

```bash
podman compose up -d --build          # 构建 + 启动（podman compose 委托 podman-compose）
curl http://localhost:3000/healthz    # {"ok":true,"graphsDirWritable":true}
podman ps                             # jdm-editor  Up (healthy)
```

- 数据持久化：named volumes `graphs-data`/`rosters-data`；**备份** = `podman volume export`
  （或 `podman exec jdm-editor tar cz - /data/graphs`）；**升级** = `podman compose up -d --build`
  （卷不动数据在）；**回滚** = checkout 旧 commit 重建镜像（卷数据跨版本兼容——JSON 文件格式稳定）
- 容器内 root 说明：~~rootless Podman 下容器 root 映射宿主当前用户~~——**A3 硬化已落地
  （第六十六批）**：镜像预建 `/data/*` 并 chown 为 `bun(1000)`，`USER bun` 运行（HEALTHCHECK
  同随）。新卷首挂自动继承 bun 属主；**存量卷**（硬化前以容器 root 创建）需一次性迁移：
  `podman run --rm --user 0 --volumes-from jdm-editor ghcr.io/republicroad/editor:local chown -R 1000:1000 /data`
  ——`bun run smoke:deploy` 的 healthz 轮询检测到不可写时会自动执行同一操作
- 浏览器访问 `http://localhost:3000` 即完整应用（前端产物由 Hono serveStatic 托管）；
  首个请求自动签发身份 cookie（AUTH_SECRET 模式）

### 6.3 实机验证记录（全部通过）

podman compose build → up → `(healthy)`；healthz 200；**签名 cookie 身份**（POST 捕获
Set-Cookie → 会话内建图/保存/版本表齐全）；auto 保存 v2/v3 → PATCH 钉住 v2
（`versionName=smoke-pinned, auto=false`）→ **容器重启后版本表与钉住标记完整保留**
（卷持久化证据）；healthz 复验通过。

### 6.4 部署陷阱存档

1. **podman-compose 插值要求字符串**：`environment` 中数值必须加引号（`PORT: '3000'`）——
   YAML 整数进插值字典后 `interpolate_str` 报 `expected str instance, int found`
2. **OCI 镜像格式忽略 HEALTHCHECK**：podman 默认 OCI format——compose 级 healthcheck 兜底
   （docker format 构建时两者并存）
3. **会话即身份**：AUTH_SECRET 态下 curl/脚本不带 cookie = 每请求新匿名身份——API 客户端
   必须自持 cookie jar（`-c/-b`），或部署在网关后改走 `TRUST_PROXY_HEADERS`
