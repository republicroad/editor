# 开发指南

## 1. 环境准备

### 1.1 系统要求

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| Git | 2.30+ | 支持 submodules |
| Bun | 1.3+ | 包管理与构建（推荐） |
| pnpm | 10+ | 替代包管理器 |
| Rust | stable | 后端构建 |
| Node.js | 18+ | 前端构建 |

### 1.2 克隆项目

```bash
# 方式一：直接克隆（推荐）
git clone --recurse-submodules --branch standalone https://github.com/republicroad/editor.git

# 方式二：已有仓库，拉取子模块
git submodule update --init
cd jdm-editor/
git fetch origin standalone:standalone
git checkout standalone
```

### 1.3 分支切换

```bash
# 主项目切换到 opencode 分支
git checkout opencode

# 子模块切换到 opencode 分支
cd jdm-editor/
git fetch origin opencode:opencode
git checkout opencode
```

---

## 2. 依赖安装

### 2.1 使用 Bun（推荐）

```bash
# 安装所有依赖（包括子模块工作空间）
bun i
```

Bun 1.3+ 可以识别 pnpm 的元数据，因此可以直接使用 `bun i` 安装所有工作空间依赖。

### 2.2 使用 pnpm

```bash
npm i pnpm -g
pnpm i
```

---

## 3. 开发流程

### 3.1 启动前端开发服务器

```bash
bun run dev
# 或
pnpm dev
```

Vite 开发服务器默认运行在 `http://localhost:5173`，支持热模块替换（HMR）。

### 3.2 启动后端

```bash
# 方式一：使用 Makefile（推荐，支持文件监听）
make watch

# 方式二：手动构建运行
cargo build
target/debug/editor
```

后端默认运行在 `http://localhost:3000`。

### 3.3 开发工作流

1. 启动后端：`make watch`
2. 启动前端：`bun run dev`
3. 访问 `http://localhost:5173`
4. 前端通过 Vite 代理将 `/api/*` 请求转发到后端 `localhost:3000`

---

## 4. jdm-editor 组件库开发

### 4.1 构建组件库

```bash
cd jdm-editor/
bun run build
# 或
pnpm build
```

这会使用 Lerna 构建所有包（jdm-editor、lezer-zen、zen-engine-wasm）。

### 4.2 Storybook 开发

```bash
cd jdm-editor/packages/jdm-editor/
pnpm storybook
```

在浏览器中预览和开发组件。

### 4.3 运行测试

```bash
cd jdm-editor/
pnpm test
# 或带覆盖率
pnpm test:coverage
```

### 4.4 代码格式化

```bash
cd jdm-editor/
pnpm format       # 检查格式
pnpm format:fix   # 自动修复
```

---

## 5. 代码规范

### 5.1 ESLint

项目使用 ESLint flat config（`eslint.config.mjs`），集成：
- TypeScript 支持
- React Hooks 规则
- React Refresh 规则
- Prettier 格式化

```bash
# 检查
bun run lint

# 自动修复
bun run lint:fix
```

### 5.2 Prettier

配置文件：`.prettierrc`

```json
{
  "singleQuote": true,
  "printWidth": 120
}
```

### 5.3 TypeScript 类型检查

```bash
bun run typecheck
# 或
tsc --noEmit
```

---

## 6. 构建与部署

### 6.1 前端构建

```bash
bun run build
# 等价于
tsc && vite build
```

构建输出到 `static/` 目录。

### 6.2 预览构建结果

```bash
bun run preview
```

启动本地服务器预览构建产物。

### 6.3 后端构建

```bash
# 开发构建
cargo build

# 生产构建
cargo build --release
```

### 6.4 Docker 构建

```bash
# 构建镜像
docker build -t editor .

# 运行容器
docker run -p 3000:3000 --platform=linux/amd64 editor
```

### 6.5 Docker Hub

```bash
# 拉取官方镜像
docker run -p 3000:3000 --platform=linux/amd64 gorules/editor
```

---

## 7. HTTPS 本地开发

### 7.1 安装 mkcert

```bash
# macOS
brew install mkcert

# Windows
choco install mkcert
```

### 7.2 生成证书

```bash
mkcert --install
cd cert/
mkcert localhost
```

### 7.3 启用 HTTPS

在 `vite.config.ts` 中配置 SSL 证书路径。

---

## 8. Git 子模块工作流

### 8.1 查看子模块状态

```bash
git submodule
```

### 8.2 更新子模块

```bash
# 拉取子模块最新代码
git submodule update --remote

# 或进入子模块手动更新
cd jdm-editor/
git fetch origin
git pull origin standalone
```

### 8.3 提交子模块修改

```bash
# 1. 在子模块中提交
cd jdm-editor/
git add .
git commit -m 'feat: xxx'

# 2. 回到主项目，记录子模块新 commit
cd ..
git add jdm-editor/
git commit -m 'chore: update jdm-editor submodule'
```

---

## 9. API 代理配置

Vite 开发服务器配置了 API 代理：

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

前端的所有 `/api/*` 请求会自动代理到后端服务。

---

## 10. 调试技巧

### 10.1 前端调试

- 使用浏览器开发者工具
- React Developer Tools 浏览器扩展
- Vite HMR 支持实时更新

### 10.2 后端调试

```bash
# Rust 日志
RUST_LOG=debug cargo run

# 使用 cargo watch 自动重载
make watch
```

### 10.3 WASM 调试

- WASM 模块在浏览器中加载
- 使用 `ensureWasmLoaded()` 确保加载完成
- 浏览器控制台查看 WASM 错误
