# Open-source Rules Engine Editor with build in Simulator

URL: https://editor.gorules.io

## Running via Docker

Running locally:
```bash
docker run -p 3000:3000 --platform=linux/amd64 gorules/editor
```

Repository:
https://hub.docker.com/r/gorules/editor

## Quickstart

Run rust backend:
```bash
make watch
```

Run frontend:
```bash
npm i pnpm -g
pnpm i
pnpm dev
```

### run with bun

使用 bun 启动 node vite 开发服务器.
```bash
bunx --node vite --host
```

使用 bun 启动 vite 开发服务器.
```bash
bunx --bun vite --host
```

package.json 中的运行脚本如下:
```json
...
  "scripts": {
    "dev": "bunx --bun vite --host",
    "build": "bunx --bun tsc && bunx --bun vite build",
    "lint": "bunx --bun eslint . --ext ts,tsx --report-unused-disable-directives",
    "lint:fix": "bunx --bun eslint . --ext ts,tsx --fix",
    "typecheck": "bunx --bun tsc --noEmit",
    "preview": "bunx --bun vite preview"
  },
...
```

打开测试服务器:

> bun run dev 

构建线上静态资源文件:

> bun run build

测试构建的线上静态资源文件:

> bun run preview


### Local HTTPS

To create a local HTTPS certificate:
```bash
brew install mkcert

mkcert --install
cd cert && mkcert localhost
```

## vite

在 bun 中运行 vite 命令.
```bash
bunx --bun vite
```

- 使用 vite build 用来构建线上的静态资源文件.

```bash
vite build

bunx --bun vite build
```

- 使用 vite preview 用来测试打包的静态资源文件.

```bash
vite preview

bunx --bun vite preview
```

### 参考资料

[vite 部署静态站点 build preview](https://cn.vite.dev/guide/static-deploy)  
[Build a frontend using Vite and Bun](https://bun.sh/guides/ecosystem/vite)  
[Is Bun Ready for Complex Builds Like Vite?](https://www.reddit.com/r/bun/comments/1ikj6ou/is_bun_ready_for_complex_builds_like_vite/)  
[GitHub Pages by vite](https://cn.vite.dev/guide/static-deploy#github-pages)

## systemd

[Run Bun as a daemon with systemd](https://bun.sh/guides/ecosystem/systemd)