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

### 构建 jdm-editor 依赖包

```bash
$ cd jdm-editor/
jdm-editor$ bun run build
```


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