# 10. 从零重写 jdm-editor 的评估与路线图

> 状态：评估存档(未实施，不重写)。未来若重写，将另起新项目，不在本仓库进行。
> 日期：2026-08-08
> 分支：zrule
> 技术栈：react + react-flow + shadcn + ReUI(对比现有 antd 栈)

## 1. 结论一句话

**不建议在本仓库从零重写。** 若未来确要重写，应理解为"结构化源码级移植"：store/序列化/编辑器智能/wasm 全部保留，只重写 UI 层(antd→shadcn/ReUI)与 react-flow v12 升级。纯从零实现 20–35 人周，移植式可省 40–50% 且风险更低。本仓库维持现状(antd 核心 + ReUI 增量，见 `09-shadcn-reui-replacing-antd.md`)。

## 2. 重写目标现状(要重建什么)

### 2.1 规模

| 维度         | 数值                                                                                                                                                                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 源码         | 166 文件 / 29,165 行(组件部分 23,784 行，已除 2,878 行 zod.d.ts)                                                                                                                                                                                                              |
| 运行时依赖   | 41 个                                                                                                                                                                                                                                                                         |
| 最大单体文件 | `tab-request.tsx` 1,719 行、`request-schema.ts` 1,010 行、`dg.scss` 868 行、`expression-builder.tsx` 751 行、`simulator-request-panel.tsx` 641 行、`dg-store.context.tsx` 637 行、`dt-excel-dialog.tsx` 630 行、`expression-item.tsx` 520 行、`graph-excel-dialog.tsx` 520 行 |
| 决策表       | `decision-table/` 目录合计 4,004 行                                                                                                                                                                                                                                           |

### 2.2 功能清单(每项核心依赖)

| 功能                     | 核心库                                                            | 复杂度                                                                |
| ------------------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------- |
| 决策画布(拖拽/连线/边)   | **reactflow 11.11.4**(17 import / 14 文件)                        | 🟢 已在用                                                             |
| 7 类节点规范             | reactflow + 自研                                                  | 🟡 input/output/expression/function/switch/decision-table/custom-node |
| 决策表编辑器             | @tanstack/react-table + @tanstack/react-virtual + 自研单元格      | 🔴 最重                                                               |
| 表达式/自定义函数表      | CodeMirror 6 + @gorules/lezer-zen + react-dnd                     | 🔴 编辑器智能                                                         |
| 模拟器/调试              | @gorules/zen-engine-wasm + Monaco                                 | 🔴                                                                    |
| 请求编辑器               | Monaco + 自研 schema 构建(tab-request+request-schema 共 2,729 行) | 🔴                                                                    |
| 表达式构建器(类型字面量) | antd DatePicker/TimePicker/Select + dayjs                         | 🟡 硬缺口                                                             |
| graph tabs               | antd Tabs                                                         | 🟡 需自建 tab bar                                                     |
| 节点右键菜单             | antd Dropdown + MenuProps                                         | 🟡 公开 API                                                           |
| 序列化/导入导出          | serializer.context + json5 + exceljs                              | 🟢 纯逻辑可复用                                                       |
| 剪贴板                   | 自研 use-graph-clipboard + antd message                           | 🟡                                                                    |
| diff 系统                | 自研 diff/comparison                                              | 🟡                                                                    |
| 权限/本地化/主题         | 自定义 + antd token                                               | 🟡                                                                    |
| 自定义节点插件 API       | 自研(主 app 已实现 query-list 节点)                               | 🟡                                                                    |

## 3. 保留资产清单(重写时原样复用，不重写)

| 资产           | 位置                                                                             | 理由                                                                      |
| -------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| wasm 引擎      | `@gorules/zen-engine-wasm` + `helpers/wasm.ts`(62 行)                            | evaluate/inferTypes/类型计算纯 API，与 UI 无关                            |
| Zen 编辑器智能 | `@gorules/lezer-zen` + CodeMirror6 集成                                          | 语法高亮/lint/补全，非 UI；**不换 Monaco**(Monaco 仅用于请求/JSON 大文本) |
| 序列化契约     | `serializer.context.tsx`(147 行)                                                 | graph JSON 与 zen-rule 引擎的硬契约，字节兼容                             |
| 纯逻辑 helpers | 自定义函数 schema、request-schema、json-schema、excel、traversal、trace、utility | 无 UI 依赖                                                                |

## 4. 分阶段路线图(若未来重写)

每阶段独立可回归，建议按序交付：

| 阶段            | 交付物                                                                                                                        | 依托                    | 参考规模                         |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------- |
| P1 基础设施     | zustand store 骨架(state/references/listeners 三 store)+ serializer + 主题(CSS vars) + i18n + @/\* aliases + shadcn/ReUI 基座 | 保留 serializer         | 对齐 dg-store 748 行             |
| P2 画布         | react-flow v12 升级 + 7 节点规范 + 拖连线 + graph tabs                                                                        | reactflow 已在用        | dg 系列                          |
| P3 节点编辑 tab | 7 个 renderTab + CodeMirror 集成                                                                                              | lezer-zen               | tab-expression/function          |
| P4 决策表       | tanstack+virtual 网格 + 单元格编辑 + 列重排 + dnd + hit policy + 字段弹层                                                     | ReUI data-grid 底座可借 | decision-table 4,004 行          |
| P5 模拟器       | Monaco 请求编辑器 + wasm trace + debug 步进 + 输出高亮                                                                        | 保留 wasm               | simulator + tab-request 2,729 行 |
| P6 命令式/装饰  | message/notification/modal 事件桥 + 装饰组件 shadcn 化                                                                        | sonner/radix            | 19 文件                          |
| P7 专项         | exceljs 导入导出、diff 系统、剪贴板、Storybook 回归                                                                           |                         | excel 630+520 行                 |
| P8 收尾         | 公开 API 冻结、序列化回归、暗色回归、性能                                                                                     |                         | —                                |

### 里程碑估算

- P1→P2：可拖拽决策画布，2–4 周
- P4 决策表：6–8 周(最重，占 ~30% 工作量)
- P5 模拟器：4–6 周(占 ~25%)
- 其余：3–6 周
- **总工作量：20–35 人周**；决策表与模拟器合计占 ~60%，且为 2–3 人年迭代产物——这两块建议"复制式移植"而非从零实现。

## 5. 关键设计决策(重写时必须定)

1. **store 结构保留 zustand 三 store**——nodes↔tabs↔simulate↔类型推断一致性唯一来源，不要另起炉灶。
2. **决策表编辑器模型**：ReUI `data-grid` 只当表格底座；单元格编辑/类型推断/hit policy 是自定义逻辑，不要用 data-grid 编辑 API 硬套。
3. **tab 架构**：shadcn Tabs 无 closable/contextMenu/tabBarExtraContent，需自建 tab bar 封装层。
4. **命令式 API**：非 React 环境(error-message.ts、clipboard)用模块级事件总线 + sonner 兜底。
5. **公开 API 契约**：若新项目要兼容旧 graph JSON，序列化格式冻结；否则允许 schema 演化但需迁移器。

## 6. 决策记录

- **决策**：本仓库**不重写、不实施**；维持 antd 核心 + ReUI 增量(doc-09)。
- **未来**：若重写，另起新项目，采用本路线图 P1–P8，并遵循"保留资产清单"。
- **理由**：纯从零重写 20–35 人周 + 序列化/暗色/Storybook 回归风险；移植式省 40–50% 且业务不停摆。
- **复盘点**：3 个月后结合 antd 升级成本、ReUI 成熟度、业务对决策编辑器的新需求复审。

## 7. 相关文档

- `09-shadcn-reui-replacing-antd.md`：antd 替换评估(混合共存结论)
- `06-jdm-editor-submodule.md`：jdm-editor 子模块集成方式
- `02-architecture.md`：总体架构
