# ---- 构建阶段：安装依赖 + 构建前端静态产物 ----
# 第五十九批：bun 1.4.2（对齐 CI/本地）；补 appshell 成员清单（迁入后缺失会导致
# frozen-lockfile 校验失败）；提前 COPY bunfig.toml 使 isolated linker 在镜像内生效。
FROM docker.io/oven/bun:1.4.2 AS builder

WORKDIR /app

# 先复制依赖清单以利用层缓存(workspace 含 apps/* 与 jdm-editor/packages/*)
COPY package.json bun.lock bunfig.toml ./
COPY apps/editor/package.json apps/editor/package.json
COPY apps/zen-rule/package.json apps/zen-rule/package.json
COPY jdm-editor/package.json jdm-editor/package.json
COPY jdm-editor/packages/jdm-editor/package.json jdm-editor/packages/jdm-editor/package.json
COPY jdm-editor/packages/appshell/package.json jdm-editor/packages/appshell/package.json
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
# 容器内 root 映射宿主当前用户，卷属主即宿主用户，无权限坑——取舍见 docs/16)
ENV GRAPHS_DIR=/data/graphs
ENV ROSTERS_DIR=/data/rosters
VOLUME ["/data/graphs", "/data/rosters"]

EXPOSE 3000

# 存活探针：/healthz 匿名可达（进程 + 数据目录可写）
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["bun", "src/index.ts"]
