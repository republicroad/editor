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
