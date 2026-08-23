# 项目需求文档

## 1. 项目背景

GoRules Editor 是一个开源的业务规则引擎可视化编辑器，基于 **JDM(JSON Decision Model)** 标准构建。JDM 是一种用有向无环图(DAG)表示业务决策逻辑的标准格式。

本项目旨在为业务分析师和开发者提供一个直观的浏览器端工具，用于创建、编辑和模拟执行业务决策模型。

**项目地址**: https://github.com/republicroad/editor  
**在线演示**: https://editor.gorules.io  
**开源协议**: MIT

---

## 2. 用户角色

| 角色 | 描述 | 使用场景 |
|------|------|----------|
| 业务分析师 | 非技术人员，负责定义业务规则 | 通过 Business 模式编辑决策表、表达式 |
| 开发者 | 技术人员，负责系统集成 | 通过 Dev 模式配置节点、编写自定义函数 |
| DevOps | 运维人员 | Docker 部署、API 集成 |

---

## 3. 功能需求

### 3.1 核心编辑功能

#### 3.1.1 可视化 DAG 图编辑
- 支持拖拽创建节点
- 支持节点间连线(边)
- 支持节点移动、删除、复制、粘贴
- 自动检测循环依赖(使用 graphology-dag)
- 图形缩放与平移

#### 3.1.2 节点类型支持

| 节点类型 | 说明 | 模式 |
|----------|------|------|
| Input Node | 输入节点，定义上下文输入 | Dev/Business |
| Output Node | 输出节点，定义决策输出 | Dev/Business |
| Decision Table | 决策表节点，表格化规则 | Dev/Business |
| Expression | 表达式节点，条件表达式 | Dev/Business |
| Function | 函数节点，自定义代码 | Dev |
| Custom Function | 自定义函数节点(zrule 开发分支新增) | Dev |
| Switch | 分支节点，多路条件分支 | Dev/Business |
| Request | 请求节点(zrule 开发分支新增) | Dev |

#### 3.1.3 决策表编辑器
- 表格式规则编辑
- 输入/输出字段管理
- 字段类型定义(string、number、boolean、enum 等)
- Excel 导入/导出支持
- 右键上下文菜单

#### 3.1.4 表达式编辑器
- 基于 Zen 表达式语言
- CodeMirror 6 语法高亮与自动补全
- Monaco Editor 可选支持
- Lezer 语法解析器

#### 3.1.5 自定义函数编辑器(zrule 开发分支新增)
- 代码编辑器(Monaco)
- 函数参数 Schema 定义
- 调试器与日志输出
- 表达式值支持数组形式(`string | string[]`)，旧 `;;` 分隔字符串上传时自动迁移为数组

#### 3.1.6 Request 节点(zrule 开发分支新增)
- 请求/响应定义管理
- JSON Schema 支持
- 示例数据源管理
- 请求面板 UI

### 3.2 模拟执行

- 内置模拟器面板
- 支持输入上下文配置
- 支持执行结果可视化
- 支持执行轨迹追踪
- 前端 WASM 引擎 + 后端 Rust 引擎双引擎支持

### 3.3 文件管理

- 新建决策文件
- 打开本地 JSON 文件(FileSystem API)
- 保存/另存为(FileSystem API 降级为下载)
- 支持 `application/vnd.gorules.decision` MIME 类型
- 模板文件加载

### 3.4 UI 模式

| 模式 | 描述 | 可用节点 |
|------|------|----------|
| Dev | 开发者模式，完整功能 | 所有节点类型 |
| Business | 业务模式，简化视图 | Input/Output/Decision Table/Expression/Switch |

### 3.5 主题与国际化

- 暗色/亮色/自动主题切换
- 中文/英文双语支持(zrule 开发分支新增)
- CSS 变量主题系统(40+ `--grl-*` 变量)

### 3.6 图 Diff(差异追踪)

- 节点变更状态标记(added/removed/modified/moved/unchanged)
- 边变更追踪
- Diff 面板展示

---

## 4. 非功能需求

### 4.1 性能
- 前端 SPA 加载时间 < 3 秒
- 模拟执行响应时间 < 1 秒(简单规则)
- 支持 100+ 节点的决策图

### 4.2 兼容性
- 现代浏览器(Chrome 90+、Firefox 88+、Safari 14+、Edge 90+)
- 支持 HTTPS 和 HTTP 协议(HTTP 下自动 polyfill crypto.randomUUID)

### 4.3 部署
- Docker 容器化部署
- 支持 Linux AMD64 平台
- 端口 3000 可配置

### 4.4 开源
- MIT 开源协议
- 完整的构建与部署文档
- Git submodule 工作流支持

---

## 5. 技术标准

### 5.1 JDM 格式

决策文件使用 JSON 格式存储，包含以下结构：

```json
{
  "contentType": "application/vnd.gorules.decision",
  "nodes": [...],
  "edges": [...]
}
```

### 5.2 Zen 表达式语言

内置的表达式语言，支持：
- 变量访问(`user.age`)
- 比较运算符(==、!=、>、<、>=、<=)
- 逻辑运算符(&&、||、!)
- 函数调用
- 模板字符串

---

## 6. 版本历史

- **v1.0.0** (2023-12-04): 初始发布
- **v1.3.0** (2024-01-31): 添加暗色模式
- **v1.10.0** (2024-09-23): 添加 Intellisense 支持
- **v1.16.0** (2026-01-22): 更新引擎和编辑器
- **v1.16.1** (2026-02-13): 降级到 React 18

详见 [CHANGELOG.md](../CHANGELOG.md)
