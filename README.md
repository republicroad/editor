# Open-source Rules Engine Editor with build in Simulator

URL: https://editor.gorules.io

## Running via Docker

Running locally:
```bash
docker run -p 3000:3000 --platform=linux/amd64 gorules/editor
```

Repository:
https://hub.docker.com/r/gorules/editor

## run with rust

也可以编译 rust 后端来运行程序.
```bash
# 构建rust后端
$ cargo build
# 运行rust后端
$ target/debug/editor

2025-06-04T03:32:03.231397Z  INFO editor: 🚀 Listening on http://127.0.0.1:3000
```

## Quickstart

Run rust backend:
```bash
make watch
```

我们可以使用 pnpm 和 bun 来进行依赖管理和构建.

### bun(monorepo)

Run frontend:
```bash
$ bun i
$ cd jdm-editor/
jdm-editor$ bun i
jdm-editor$ rm -r packages/jdm-editor/node_modules'
```
`bun i` 安装当前 editor 项目的依赖. 而在 jdm-editor 中 `bun i` 是安装 jdm-editor 的依赖, 但是需要把 workspace 下的 jdm-editor 的 node_modules
包中的 @types/react 会导致构建冲突, 所以删除这个文件夹.


#### 开发

```bash
$ bun run dev
```

#### 构建应用

```bash
$ bun run build
```

#### 构建 jdm-editor 依赖包

```bash
$ cd jdm-editor/
jdm-editor$ bun run build
```


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