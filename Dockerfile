# ---- 构建阶段：安装依赖 + 构建前端静态产物 ----
# 第五十九批：bun 1.4.2（对齐 CI/本地）；补 appshell 成员清单（迁入后缺失会导致
# frozen-lockfile 校验失败）；提前 COPY bunfig.toml 使 isolated linker 在镜像内生效。
FROM docker.io/oven/bun:1.4.2 AS builder

WORKDIR /app

# 先复制依赖清单以利用层缓存(workspace 含 apps/* 与 jdm-editor/packages/*；
# zen-udf 自第七十八批起为内核包成员，原 apps/zen-rule 已删除)
COPY package.json bun.lock bunfig.toml ./
COPY apps/editor/package.json apps/editor/package.json
COPY jdm-editor/package.json jdm-editor/package.json
COPY jdm-editor/packages/jdm-editor/package.json jdm-editor/packages/jdm-editor/package.json
COPY jdm-editor/packages/appshell/package.json jdm-editor/packages/appshell/package.json
COPY jdm-editor/packages/zen-udf/package.json jdm-editor/packages/zen-udf/package.json
RUN bun install --frozen-lockfile

# 复制全部源码(含 jdm-editor 子模块)并构建前端(tsc && vite build → /app/static)
COPY . .
RUN bun run build

# ---- 运行时阶段：Bun/Hono 后端 + 静态产物 ----
FROM docker.io/oven/bun:1.4.2-slim AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/jdm-editor ./jdm-editor
COPY --from=builder /app/package.json ./package.json
# 前端构建产物放到 Hono serveStatic 目录(apps/editor/public，见 src/index.ts staticConfig)
COPY --from=builder /app/static ./apps/editor/public

WORKDIR /app/apps/editor

# 数据目录固定到 /data(生产以 named volume 挂载；本地 Podman rootless 下
# 容器内 uid 1000(bun) 映射宿主普通用户，属主语义保持——取舍见 docs/16 §6.2)
ENV GRAPHS_DIR=/data/graphs
ENV ROSTERS_DIR=/data/rosters
# 决策请求日志目录(第六十二批)：JSONL 按日滚动，采集归档示例见 deploy/vector-oss/
ENV LOGS_DIR=/data/logs

# A3 容器 USER 硬化(第六十六批)：预建数据目录并预置属主为 bun(uid 1000)——
# named volume 首次挂载时 Docker/Podman 会把镜像内该目录内容(含属主)拷入卷，
# 此后非 root 进程即可读写；不再依赖"容器内 root 映射宿主用户"的偶然语义
RUN mkdir -p /data/graphs /data/rosters /data/logs && chown -R bun:bun /data
VOLUME ["/data/graphs", "/data/rosters", "/data/logs"]

EXPOSE 3000

# 存活探针：/healthz 匿名可达（进程 + 数据目录可写）
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# 以非 root 运行：/app 构建产物 root 只读即可，进程仅需 /data 写权限(HEALTHCHECK 同随 USER)
USER bun

CMD ["bun", "src/index.ts"]
