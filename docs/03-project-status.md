# 项目状态

> 快照时间：2026-07-26

---

## 1. 当前环境

### 1.1 分支状态

| 仓库 | 当前分支 | 基于分支 | 说明 |
|------|----------|----------|------|
| editor（主项目） | `opencode` | `standalone` | 定制化开发分支 |
| jdm-editor（子模块） | `zrule` | `master` | 外部化改造分支 |

### 1.2 版本信息

| 组件 | 版本 | 说明 |
|------|------|------|
| @gorules/editor | v1.16.1 | 主项目版本 |
| @gorules/jdm-editor | v1.52.0 | 组件库版本 |
| zen-engine | 0.53 | Rust 决策引擎 |
| zen-engine-wasm | ^0.23.1 | WASM 引擎绑定 |

---

## 2. 版本历史里程碑

| 版本 | 日期 | 关键变更 |
|------|------|----------|
| v1.0.0 | 2023-12-04 | 初始发布 |
| v1.1.0 | 2023-12-12 | 更新 zen-engine |
| v1.2.0 | 2024-01-31 | 升级 gorules editor |
| v1.3.0 | 2024-01-31 | 添加暗色模式 |
| v1.4.0 | 2024-02-06 | 可选的宽松 CORS |
| v1.5.0 | 2024-05-17 | 更新 jdm-editor |
| v1.6.0 | 2024-07-05 | 升级 zen v0.23 |
| v1.7.0 | 2024-07-17 | 升级 zen engine v0.24.x |
| v1.8.0 | 2024-08-07 | 升级 gorules deps |
| v1.9.0 | 2024-08-28 | 更新 editor |
| v1.10.0 | 2024-09-23 | 添加 Intellisense |
| v1.11.0 | 2024-10-25 | 升级 zen 0.33.0 |
| v1.12.0 | 2024-12-07 | 更新 packages |
| v1.13.0 | 2025-04-15 | 升级依赖 |
| v1.14.0 | 2025-05-15 | 更新 zen |
| v1.15.0 | 2025-05-23 | 更新 zen |
| v1.16.0 | 2026-01-22 | 更新引擎和编辑器 |
| v1.16.1 | 2026-02-13 | 降级到 React 18 |

---

## 3. 依赖快照

### 3.1 前端核心依赖

| 依赖 | 版本 | 状态 |
|------|------|------|
| react / react-dom | ^18.3.1 | 稳定 |
| antd | ^5.29.3 | 稳定 |
| @ant-design/icons | ^6.1.0 | 稳定 |
| react-router / react-router-dom | ^7.13.0 | 稳定 |
| reactflow | 11.11.4 | 锁定版本 |
| zustand | ^4.5.5 | 稳定 |
| immer | 10.1.1 | 锁定版本 |
| @codemirror/* | ^6.x | 稳定 |
| @monaco-editor/react | ^4.7.0 | 稳定 |
| graphology | ^0.26.0 | 稳定 |
| graphology-dag | ^0.4.1 | 稳定 |
| axios | ^1.13.5 | 稳定 |
| zod | ^4.3.6 | 稳定 |

### 3.2 开发依赖

| 依赖 | 版本 | 状态 |
|------|------|------|
| typescript | ^5.9.3 | 最新 |
| vite | ^7.3.1 | 最新 |
| @vitejs/plugin-react-swc | ^4.2.3 | 稳定 |
| eslint | ^10.0.0 | 最新 |
| prettier | ^3.8.1 | 稳定 |
| semantic-release | ^25.0.3 | 稳定 |

### 3.3 后端依赖

| 依赖 | 版本 | 状态 |
|------|------|------|
| zen-engine | 0.53 | 最新 |
| axum | 0.7 | 稳定 |
| tokio | 1 | 稳定 |
| tower-http | 0.5 | 稳定 |

---

## 4. Git 分支结构

### 4.1 主项目分支

| 分支 | 说明 | 状态 |
|------|------|------|
| `master` | 上游同步分支 | 活跃 |
| `standalone` | 开源发布分支 | 活跃 |
| `opencode` | 定制化开发分支 | **当前** |
| `mono_v1` | Monorepo 实验 | 历史 |
| `workspace_v1/v2/v3` | 工作空间实验 | 历史 |

### 4.2 jdm-editor 分支

| 分支 | 说明 | 状态 |
|------|------|------|
| `master` | 上游发布分支 | 活跃 |
| `standalone` | 开发分支（同 opencode） | 历史 |
| `zrule` | 外部化改造分支 | **当前** |
| `opencode` | 定制化开发分支 | 参考 |

---

## 5. 构建状态

### 5.1 前端

- **构建命令**: `bun run build`
- **输出目录**: `static/`
- **状态**: 正常

### 5.2 后端

- **构建命令**: `cargo build`
- **输出**: `target/debug/editor`
- **状态**: 正常

### 5.3 Docker

- **镜像**: `gorules/editor`
- **平台**: linux/amd64
- **状态**: 正常

---

## 6. 已知问题与待办

### 6.1 已知问题
- HTTP 协议下 `crypto.randomUUID` 不可用，已通过 polyfill 解决
- lezer-zen 和 zen-engine-wasm 包源码在 opencode 分支中已移除，改为外部 npm 依赖

### 6.2 待办事项
- [ ] Bun 后端生产化（当前为实验状态）
- [ ] lezer-zen 源码恢复或迁移
- [ ] zen-engine-wasm 源码恢复或迁移
- [ ] 完善单元测试覆盖
- [ ] 补充 Storybook 组件文档
- [ ] 修复 vite build 预存在问题（vite-plugin-dts 加载失败）

---

## 7. 最近活动

### 7.1 主项目最近提交

```
030525c chore: use jdm-editor opencode branch to test opencode
04f703f refactor: let jdm-editor manage it's dependency and remove useless libs
0a0f5da Merge branch 'standalone'
f5131eb chore: add mode DecisionGraph
bca4bc8 Merge branch 'master' into standalone
1a413b3 chore(release): 1.16.1
c2e0af1 fix: downgrade to react 18 (#42)
```

### 7.2 jdm-editor zrule 分支提交

```
7a2bc3d feat: export TabRequest, request-schema, json-schema from barrel
1a5e7cc feat: replace TabJsonSchema with TabRequest for input node
6fe2e29 feat: upgrade simulator request panel with full feature set
6586653 feat: add simulator request/binding state to zustand store
246f376 feat: add request-schema, json-schema helpers and i18n infrastructure
5d16d11 feat: customNode renderTab routing, Input schema expansion
e188084 feat: add UserResolver and components override mechanism
```

### 7.3 zrule 分支变更摘要

**jdm-editor 库（zrule 分支）：**
- UserResolver 类型 + store + wrapper + exports
- components override 机制（specOverrides in TabContents）
- customNode renderTab 路由（.otherwise() 检查 customNodes by kind）
- Input Schema 扩展 → 完整 Request 节点改造（TabRequest 3-Tab 编辑器）
- request-schema.ts（~1,010 行）+ json-schema.ts（~66 行）
- i18n 基础设施（zh/en 翻译）
- Simulator Request Panel 升级（~700 行，含 Format/Sync/Save/Copy/Run）

**编辑器项目（未提交）：**
- better-auth 客户端 + UserResolver 工厂
- DecisionGraph 集成 userResolver prop
