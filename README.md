# Open-source Rules Engine Editor with build in Simulator

URL: https://editor.gorules.io

## install

注意以下点:
1. 此项目是以 editor 和 jdm-editor (editor的 jdm-editor 子仓库)组成
2. 未来editor项目的前后端都会使用bun, 为了使用mono pacakge, 建议使用 bun >=1.3 版本.
3. editor 和 jdm-editor 的 master 分支用于同步上游分支, 使用 standalone 分支用于开源分支版本.

使用以下命令clone项目:

> git clone --recurse-submodules --branch standalone  https://github.com/republicroad/editor.git

也可以使用代理下载:
> proxychains git clone --recurse-submodules --branch standalone  https://github.com/republicroad/editor.git

如果是直接clone了 editor 仓库，那么使用如下命令进行代码拉取 jdm-editor 子模块(和上面命令等价):
```bash
$ git clone https://github.com/republicroad/editor.git  # 当前分支是 main 或者 master 分支.
$ git fetch origin standalone:standalone
$ git checkout standalone
$ git submodule      # 查看当前 git 子模块的 commit 信息.
$ cd jdm-editor/     # 当前分支是 main 或者 master 分支.
jdm-editor$ git submodule update --init
jdm-editor$ git fetch origin standalone:standalone
jdm-editor$ git checkout standalone
```

## backend

Run rust backend:
```bash
make watch
```

### Running via Docker

Running locally:
```bash
docker run -p 3000:3000 --platform=linux/amd64 gorules/editor
```

Repository:
https://hub.docker.com/r/gorules/editor

### run with rust

也可以编译 rust 后端来运行程序.
```bash
# 构建rust后端
$ cargo build
# 运行rust后端
$ target/debug/editor

2025-06-04T03:32:03.231397Z  INFO editor: 🚀 Listening on http://127.0.0.1:3000
```

## frontend(monorepo)

bun 1.3可以识别pnpm相关的元数据, 我们可以使用 bun 1.3 及以上版本来进行依赖管理和构建.

### 开源版本
     
使用 **standalone分支**

```bash
$ bun i           # 安装依赖, bun1.3可以识别pnpm相关的元数据. 所以此命令可以安装所有工作间的依赖
$ bun run dev # 开启开发服务器
$ bun run build   # 构建项目静态文件
$ bun run preview # 模拟静态文件服务器加载静态文件(需要在 bun run build 之后执行)
```

### 开发

```bash
$ bun i
$ bun run dev
```

### 构建应用

```bash
$ bun run build
```

> 注意: `bun run build` 等价于 `tsc && vite build`，`tsc` 前置步骤目前会因 `jdm-editor/packages/jdm-editor/src/components/decision-graph/dg-panel.tsx` 中的 3 个既有类型错误退出非 0。需出产物时可直接使用 `bunx vite build`（输出到 `static/`）。

### Monaco 本地化加载

Monaco 编辑器从版本化静态路径加载（如 `/monaco-editor@0.52.2/min/vs/**`），而非 CDN。`monaco-editor` 依赖（锁定 0.52.2）挂在根 package.json，构建期由 `vite-plugin-static-copy` 将 `node_modules/monaco-editor/min/vs/**` 拷贝到 `static/monaco-editor@<version>/min/vs/**`，运行时由 `src/lib/monaco.ts` 配置 `loader.config` 指向该基址。

### 构建 jdm-editor 依赖包

```bash
$ cd jdm-editor/
jdm-editor$ bun run build
```

## apps (Bun/Hono API 后端)

`apps/editor`（Hono 规则仿真后端）与 `apps/zen-rule`（zen-engine 自定义处理函数库）已纳入根 workspace，
统一使用 bun 管理依赖（单一 `bun.lock`），`zen-rule` 通过 `workspace:*` 协议被 `apps/editor` 引用，
无需再手动 `bun link`。

```bash
$ bun i                # 根目录一次性安装所有 workspace 依赖
$ bun run dev:api      # 启动 API 后端 (apps/editor), 监听 http://localhost:3000 (+ 3001 admin)
$ bun run test:zen-rule   # 运行 zen-rule 冒烟测试
$ bun run typecheck:apps  # 类型检查 apps/*
```

OpenAPI 交互文档: http://localhost:3000/openapi

## 参考资料

1. 此仓库目前使用 bun 替换 pnpm 来进行 mono package 管理.
2. 使用 http 协议进行本地开发 

### pnpm

Run frontend:
```bash
npm i pnpm -g
pnpm i
pnpm dev
```


### Local HTTPS

To create a local HTTPS certificate:
```bash
brew install mkcert

mkcert --install
cd cert && mkcert localhost
```

### git submodule

git 子仓库是通过 commit 信息锁定对应的信息.
如果子仓库代码又改动，需要在子仓库修改被commit倒本地仓库后，后在主仓库提交子仓库的修改信息.
如下所示:

```bash
$ git submodule      # 查看当前 git 子模块的 commit 信息.
$ cd jdm-editor/     # 当前分支是 main 或者 master 分支.
jdm-editor$ git add xxxx
jdm-editor$ git commit -m 'xxxxx'
jdm-editor$ cd ..
$ git add jdm-editor/
```


## Proxy Configuration (for network-restricted environments)

### Ubuntu / macOS

```bash
export HTTPS_PROXY=https://127.0.0.1:7890
export HTTP_PROXY=http://127.0.0.1:7890
export NO_PROXY=localhost,127.0.0.1
```

### PowerShell

```powershell
$env:HTTPS_PROXY="http://127.0.0.1:7890"
$env:HTTP_PROXY="http://127.0.0.1:7890"
$env:NO_PROXY="localhost,127.0.0.1"
```
