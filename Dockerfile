# ---- 构建阶段：安装依赖 + 构建前端静态产物 ----
FROM docker.io/oven/bun:1.3.14 AS builder

WORKDIR /app

# 先复制依赖清单以利用层缓存(workspace 含 apps/* 与 jdm-editor/packages/*)
COPY package.json bun.lock ./
COPY apps/editor/package.json apps/editor/package.json
COPY apps/zen-rule/package.json apps/zen-rule/package.json
COPY jdm-editor/package.json jdm-editor/package.json
COPY jdm-editor/packages/jdm-editor/package.json jdm-editor/packages/jdm-editor/package.json
RUN bun install --frozen-lockfile

# 复制全部源码(含 jdm-editor 子模块)并构建前端(tsc && vite build → /app/static)
COPY . .
RUN bun run build

# ---- 运行时阶段：Bun/Hono 后端 + 静态产物 ----
FROM docker.io/oven/bun:1.3.14-slim AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/jdm-editor ./jdm-editor
COPY --from=builder /app/package.json ./package.json
# 前端构建产物放到 Hono serveStatic 目录(apps/editor/public，见 src/index.ts staticConfig)
COPY --from=builder /app/static ./apps/editor/public

WORKDIR /app/apps/editor

EXPOSE 3000

# 图与名单落盘目录(生产以 volume 持久化)
VOLUME ["/app/apps/editor/graphs", "/app/apps/editor/lists"]

CMD ["bun", "src/index.ts"]
