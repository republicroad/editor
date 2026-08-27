# Open-source Rules Engine Editor with build in Simulator

URL: https://editor.gorules.io

## install

注意以下点:
1. 此项目是以 editor 和 jdm-editor (editor的 jdm-editor 子仓库)组成
2. 未来editor项目的前后端都会使用bun, 为了使用mono pacakge, 建议使用 bun >=1.3 版本.
3. editor 和 jdm-editor 的 master 分支用于同步上游分支, 使用 standalone 分支用于开源分支版本.
4. 使用 zrule 完成前后端 typescript 的开发和改造.

使用以下命令clone项目:
克隆 editor 项目的 zrule 分支, 并递归 clone git 子模块，用于完成前后端 monorepo 的 typescript 的构造.
> git clone --recurse-submodules --branch zrule  https://github.com/republicroad/editor.git

克隆 editor 项目的 standalone 分支, 并递归 clone git 子模块，用于探索
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
jdm-editor$ git fetch origin zrule:zrule
jdm-editor$ git checkout zrule
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

> 注：`bun run build` 等价于 `tsc && vite build`。monaco 双实例类型冲突修复后(zrule 分支)typecheck 全绿，可直接构建。

### 质量门禁

```bash
$ bun run lint           # eslint(含 prettier 规则)
$ bun run typecheck      # 主应用类型检查
$ bun run typecheck:apps # apps/editor 与 apps/zen-rule 类型检查
$ bun run test           # 主应用单元测试(bun test src，协议库等)
$ bun run test:zen-rule  # zen-rule 引擎单测(bun test)
$ bun run sync:schema    # 从 udfManager 重新生成自定义节点 schema 夹具
```

### Monaco 本地化加载

Monaco 编辑器从版本化静态路径加载(如 `/monaco-editor@0.52.2/min/vs/**`)，而非 CDN。`monaco-editor` 依赖(锁定 0.52.2)挂在根 package.json，构建期由 `vite-plugin-static-copy` 将 `node_modules/monaco-editor/min/vs/**` 拷贝到 `static/monaco-editor@<version>/min/vs/**`，运行时由 `src/lib/monaco.ts` 配置 `loader.config` 指向该基址。

### 构建 jdm-editor 依赖包

zrule 分支为单包 workspace(三个 `@gorules` 库已改为外部 npm 依赖，与 opencode 对齐)：

```bash
$ cd jdm-editor/
jdm-editor$ bun install        # 首次需安装(生成 bun.lock)
jdm-editor$ bun run build      # 等价于 packages/jdm-editor 下 vite build → dist/
```

发布到 npm(`prepublishOnly: vite build` 自动重跑构建)：

```bash
jdm-editor$ cd packages/jdm-editor && npm publish
```

详见 `docs/06-jdm-editor-submodule.md` §3.6。

## apps (Bun/Hono API 后端)

`apps/editor`(Hono 规则仿真后端)与 `apps/zen-rule`(zen-engine 自定义处理函数库)已纳入根 workspace，
统一使用 bun 管理依赖(单一 `bun.lock`)，`zen-rule` 通过 `workspace:*` 协议被 `apps/editor` 引用，
无需再手动 `bun link`。

```bash
$ bun i                # 根目录一次性安装所有 workspace 依赖
$ bun run dev:api      # 启动 API 后端 (apps/editor)，默认 http://localhost:3000，可用 PORT 环境变量覆盖
$ bun run test:zen-rule   # 运行 zen-rule 单元测试
$ bun run typecheck:apps  # 类型检查 apps/*
```

OpenAPI 交互文档: http://localhost:3000/openapi

### API 一览

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/simulate` | 决策图仿真执行 |
| GET | `/api/custom-nodes/schema` | 自定义节点 schema(由 zen-rule udfManager 运行时生成) |
| GET | `/api/lists?q=` | 名单列表(大小写不敏感过滤) |
| GET | `/api/lists/{name}` | 名单详情 |
| POST | `/api/lists` | 创建/覆盖名单(upsert，落盘 `apps/editor/lists/*.json`) |
| PUT | `/api/lists/{name}` | 更新名单(name 不可变) |
| DELETE | `/api/lists/{name}` | 删除名单(含落盘文件清理) |
| GET | `/api/auth/get-session` | Mock 开发用户(better-auth 兼容格式) |

## 以库方式嵌入(无状态)

编辑器定位为**通用无状态库**。鉴权与图存储由**宿主应用**负责，编辑器只消费注入适配器：

```tsx
import { EditorShellProvider, createGraphsHttpAdapter, createDefaultSimulate } from '@ryefccd/editor';

<EditorShellProvider
  options={{
    // 宿主自己的鉴权(无状态：只管把会话用户填进执行上下文)
    authAdapter: myAuthAdapter,
    // 参考图形托管：apps/editor 的 /api/graphs；宿主可换成任意实现
    persistence: createGraphsHttpAdapter('/api/graphs'),
    // 决策仿真(引擎由宿主决定；这里用 zd/默认仿真）
    simulate: createDefaultSimulate(),
  }}
>
  <MyGraphPage />
</EditorShellProvider>
```

注入 `persistence` 后，页面 Open 出现 "Graph library"(宿主存储)、Save/Save-as 走宿主并带 `baseRevision` 乐观锁；不注入则回退浏览器 File System Access API。契约见 `src/shell/persistence.ts`、宿主集成见 `docs/15`、页面接线见 `src/lib/graph-persistence.ts`。

## 自定义节点(zrule)

自定义节点 = **zen-rule 注册 UDF** + **前端手写 spec**。UDF 经 `/api/custom-nodes/schema` 自动下发；
有富编辑器的节点在前端以 `createJdmNode` 覆盖(`useCustomNodes.ts` 的 `overriddenKinds`)。

| kind | 名称 | 表达式协议(位置参数) | 富编辑器 |
|---|---|---|---|
| `risk.query_list` | 查询名单 | `['query_list', "名单名", 值表达式]` | ✅ 双栏 + 服务端名单搜索 |
| `contrib.http_request` | HTTP 请求 | `['http_request', url, "method", headers?, body?, params?, timeout?, retry?, auth?]` | ✅ 页签化(Headers/Body/Params/高级) |
| `contrib.crypto` | 摘要签名 | `['crypto', input, "algorithm", secret?, "encoding"?, upper?]` | ✅ 级联选择(普通/HMAC)+ 分段编码按钮 |
| `contrib.json_path` | JSON 提取 | `['json_path', input, "path", default?]` | ✅ 实例行列表 |
| `contrib.template` | 模板渲染 | `['template', "tpl", vars?]` | ✅ 模板体 + 变量键值表 |

约定：
- 可选尾参**变长序列化**：末尾连续空值截断、中段空串占位；引擎侧对缺省/空值回退声明默认值 → 旧图零迁移
- 协议纯函数统一放 `src/lib/*-protocol.ts`(parse/serialize/normalize)并配套单测；开发流程见 `docs/13-custom-node-development.md`
- 新增 UDF 后执行 `bun run sync:schema` 同步离线夹具

详细文档见 `docs/`(索引在 `docs/README.md` 或仓库 docs 目录)。

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

修改 git submodule 中的子仓库分支:
```bash
# .gitmodules 中的 branch 会修改为 zrule
git submodule set-branch --branch zrule jdm-editor
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
