# GoRules Editor 项目文档

> 基于 JDM(JSON Decision Model)标准的开源业务规则引擎可视化编辑器

**项目地址**: https://github.com/republicroad/editor  
**在线演示**: https://editor.gorules.io  
**当前版本**: v1.16.1(主项目)/ v1.52.0(jdm-editor 组件库)  
**开发分支**: `zrule`(editor 与 jdm-editor 子模块均使用，前后端 TypeScript monorepo)

---

## 文档目录

| 文档                                                                  | 说明                                               |
| --------------------------------------------------------------------- | -------------------------------------------------- |
| [01-需求文档](./01-requirements.md)                                   | 项目背景、功能需求与非功能需求                     |
| [02-架构文档](./02-architecture.md)                                   | 系统架构、技术栈与设计模式                         |
| [03-项目状态](./03-project-status.md)                                 | 当前版本、分支状态与依赖快照                       |
| [04-开发指南](./04-development-guide.md)                              | 环境搭建、开发流程与构建部署                       |
| [05-API 参考](./05-api-reference.md)                                  | 后端 API 与前端组件 API 文档                       |
| [06-jdm-editor 子仓库](./06-jdm-editor-submodule.md)                  | jdm-editor 组件库详解与分支差异                    |
| [07-实施计划](./07-implementation-plan.md)                            | Input/Custom 节点外部化 + better-auth 用户信息集成 |
| [08-Request 节点计划](./08-request-node-plan.md)                      | Request 节点(Input 增强版)集成计划                 |
| [09-shadcn+ReUI 取代 antd 评估](./09-shadcn-reui-replacing-antd.md)   | antd 替换可行性评估(结论：antd 核心 + ReUI 增量)   |
| [10-从零重写评估与路线图](./10-rewrite-roadmap.md)                    | 从零重写 jdm-editor 的评估与 P1–P8 路线图(存档)    |
| [11-antd vs shadcn+ReUI 对比](./11-antd-vs-shadcn-reui-comparison.md) | antd 与 shadcn+ReUI 组件能力对照                   |

---

## 最佳实践

| 文档                                                                                          | 说明                                                     |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [Monorepo 源码直通](./bestpractice/monorepo-source-passthrough.md)                            | 单包子模块的源码直通消费链与防回灌                       |
| [Monorepo 多 npm 包编译与构建](./bestpractice/monorepo-multi-package-build.md)                | 多包依赖策略/类型桥/别名治理/解析矩阵/CI 门禁（多包视角） |
| [Monorepo 别名机制](./bestpractice/monorepo-alias-mechanisms.md)                              | 业界别名实践对比（Nx/Turbo/shadcn）与本仓四层终态        |
| [Bun Workspaces 最佳实践](./bestpractice/bun-workspaces-best-practices.md)                    | bun 工作区协议/lockfile/布局收敛/别名运行时语义/CI       |
| [决策复盘：Subpath Imports](./bestpractice/decision-retrospective-subpath-imports.md)         | 内核别名方案六轮演进复盘与可迁移工程教训                 |
| [TS imports 字段解析语义](./bestpractice/ts-imports-field-resolution.md)                      | 扩展探测/通配字面填充/不回落 paths——imports 写法守则     |

---

## 快速开始

### 克隆项目

```bash
# 开发分支(前后端 TypeScript monorepo，推荐)
git clone --recurse-submodules --branch zrule https://github.com/republicroad/editor.git

# 开源发布/探索分支
git clone --recurse-submodules --branch standalone https://github.com/republicroad/editor.git
```

### 启动开发

```bash
# 安装依赖(需要 Bun 1.3+)
bun i

# 启动前端开发服务器
bun run dev

# 启动 Hono 规则仿真后端(apps/editor，替代 Rust 后端)
bun run dev:api

# 启动后端(另一个终端，Rust)
make watch
```

### 运行测试

```bash
# jdm-editor 组件库单元测试(bun test，位于子模块)
cd jdm-editor && bun run test
# 等价于 cd packages/jdm-editor && bun test src
```

### 访问应用

打开浏览器访问 `http://localhost:5173`(Vite 默认端口)，后端 API 运行在 `http://localhost:3000`。

---

## 项目结构概览

```
editor/
├── src/                    # 前端应用源码(React SPA)
├── jdm-editor/             # 核心组件库(git submodule)
├── backend/                # Rust/Axum 后端
├── apps/                   # Bun/Hono 替代后端
├── static/                 # 构建输出目录
├── docs/                   # 项目文档(本目录)
└── Dockerfile              # Docker 构建文件
```

---

## 许可证

MIT License - Copyright (c) 2023 GoRules.io
