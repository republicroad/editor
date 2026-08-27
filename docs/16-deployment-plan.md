# 第十五批：部署收尾(第十六份文档)

> 日期：2026-08-27
> 目标：清除 Rust/pnpm 遗留，后端收敛为 Bun/Hono 单后端，Docker 镜像重建，CI 从"纸面绿"升级为真门禁。

## 1. 范围

| 项 | 说明 |
|----|------|
| Rust/pnpm 遗留清除 | 删 `backend/`、根 `Cargo.toml`/`Cargo.lock`、`pnpm-lock.yaml`、`.gitignore` `/target`；CI 删 rust-codequality job |
| 后端收敛 | `apps/editor`(Bun/Hono)为唯一后端，取消 Rust/Axum 双后端描述 |
| Dockerfile 重写 | `oven/bun` 多阶段；前端产物 `static/` 复制到 `apps/editor/public`(Hono `serveStatic` 目录)；graphs/lists 以 volume 持久化 |
| `.dockerignore` | 排除 node_modules / static / graphs / lists / logs |
| CI 真门禁 | 去 `continue-on-error`；加主仓 test + apps test；新增 build job；checkout `submodules: recursive`；push 触发 master + zrule |

## 2. 提交划分

- B1：Rust/pnpm 遗留清除 + 文档清理(docs/02、docs/04、CI rust job)
- B2：Dockerfile 重写 + `.dockerignore`
- B3：`validate.yml` 真门禁
- B4：docs/03 §5/§6/changelog + README + 新增本计划文档 + 已知问题记录

## 3. 验证

- 本地回归：lint 0 errors、typecheck/apps 绿、主仓 `bun run test`、apps `bun test apps/zen-rule apps/editor`
- 镜像：podman 本地 `podman build -t editor .` + 冒烟运行 `podman run -p 3000:3000 editor`

## 4. 已知问题 backlog

### request 节点 Schema 数据保存丢失

- **现象**：保存规则时 `contrib.http_request` 节点(content: `{name, config}`)的 Schema 数据未保存。
- **定位结论**：服务端非根因(`GraphContentSchema` 用 `z.record(z.string(), z.unknown())`，不剥字段)；`graphs-http-adapter` 与 `graph-persistence.ts` 均透传。
- **待查(backlogged)**：request 节点 Schema 目前存储在 node.content 之外的位置，未进入保存序列化路径。已知方向，留待处理。
- **状态**：未修复(留给后续批次)。

## 5. 开放项(推进部署后续还需要的)

- 真实部署配置：镜像对外推送仓库名、生产 env(`TRUST_PROXY_HEADERS`/`X-User-Id` 网关、`PORT`)、卷挂载编排(docker-compose / k8s)。
- request 节点 Schema 保存修复(docs/03 §6.1 已知问题)。
