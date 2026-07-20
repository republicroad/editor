# GoRules Editor 项目文档

> 基于 JDM（JSON Decision Model）标准的开源业务规则引擎可视化编辑器

**项目地址**: https://github.com/republicroad/editor  
**在线演示**: https://editor.gorules.io  
**当前版本**: v1.16.1（主项目）/ v1.52.0（jdm-editor 组件库）

---

## 文档目录

| 文档 | 说明 |
|------|------|
| [01-需求文档](./01-requirements.md) | 项目背景、功能需求与非功能需求 |
| [02-架构文档](./02-architecture.md) | 系统架构、技术栈与设计模式 |
| [03-项目状态](./03-project-status.md) | 当前版本、分支状态与依赖快照 |
| [04-开发指南](./04-development-guide.md) | 环境搭建、开发流程与构建部署 |
| [05-API 参考](./05-api-reference.md) | 后端 API 与前端组件 API 文档 |
| [06-jdm-editor 子仓库](./06-jdm-editor-submodule.md) | jdm-editor 组件库详解与分支差异 |

---

## 快速开始

### 克隆项目

```bash
git clone --recurse-submodules --branch standalone https://github.com/republicroad/editor.git
```

### 启动开发

```bash
# 安装依赖（需要 Bun 1.3+）
bun i

# 启动前端开发服务器
bun run dev

# 启动后端（另一个终端）
make watch
```

### 访问应用

打开浏览器访问 `http://localhost:5173`（Vite 默认端口），后端 API 运行在 `http://localhost:3000`。

---

## 项目结构概览

```
editor/
├── src/                    # 前端应用源码（React SPA）
├── jdm-editor/             # 核心组件库（git submodule）
├── backend/                # Rust/Axum 后端
├── apps/                   # Bun/Elysia 替代后端
├── static/                 # 构建输出目录
├── docs/                   # 项目文档（本目录）
└── Dockerfile              # Docker 构建文件
```

---

## 许可证

MIT License - Copyright (c) 2023 GoRules.io
