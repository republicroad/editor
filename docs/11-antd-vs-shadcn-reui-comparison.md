# 11. antd vs shadcn + ReUI 对比与选型建议

> 状态：存档评估(未实施、未装依赖)。供未来新项目选型参考。
> 日期：2026-08-08
> 分支：zrule
> 定位：详尽版对比文档。结合本仓库 jdm-editor 审计(doc-09)与 ReUI MCP 全量调研。

## 1. 总览结论

**antd = 一体化 npm 依赖全家桶 + 运行时 token 算法**；**shadcn + ReUI = 开源源码组件 + 构建期 CSS 变量**，组件代码直接进入项目、可任意修改。

未来新项目倾向 ReUI 的前提：**必须自带"基础原语补齐层 + 缺口组件自建层"**。ReUI 只提供 20 个高阶数据组件，不提供 select/tabs/dialog/toast 等基础原语——这些要靠 shadcn 官方 registry 补齐，其余 antd 全家桶缺口需自建或引入第三方。

## 2. 核心差异对比表

| 维度             | antd                                                                                                          | shadcn + ReUI                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 形态             | npm 依赖，黑盒                                                                                                | 源码拷入项目，白盒可改                                                   |
| 主题             | `ConfigProvider` + `darkAlgorithm`/`defaultAlgorithm` + `theme.useToken()`(~40 token 泵成 `--grl-*` CSS 变量) | CSS 变量 + `.dark` variant + `@custom-variant`，无运行时算法             |
| 定制             | 覆盖 token / prefixCls，样式摸内部类(本项目 53 处 `ant-*` 引用)                                               | 直接改组件源码 + class 透传 + data-slot 钩子                             |
| 体积             | `antd.min.js` 1.47MB(按需引入后远低于此)                                                                      | 按需源码，tree-shake 友好，只带用到的组件                                |
| 更新             | 升级依赖(升级有 breaking 风险，如 5.x CSS-in-JS 内部结构)                                                     | 复制源码自管，无上游升级锁，但需自行跟进修复                             |
| 表单             | `Form` + 内置校验 + 布局(Form.Item)                                                                           | `react-hook-form` + `zod`(shadcn Form/Field 是 RHF 包装层)               |
| 反馈             | 静态命令式 `message`/`notification`/`Modal.confirm`                                                           | `sonner`(React 上下文绑定，非 React 调用需事件桥)                        |
| 日期             | `DatePicker`/`TimePicker` 任意时间点(dayjs)                                                                   | `date-selector`(周期筛选) + `react-day-picker` 自封装时间点              |
| 组件生态         | 全家桶完整(Form/Upload/Cascader/Transfer/DatePicker/Menu…)                                                    | ReUI 20 组件 + shadcn 官方 ~30 基础原语 + 缺口自建/第三方                |
| 命令式 vs 声明式 | 两者皆可(message 命令式)                                                                                      | 以声明式为主，命令式需桥接层                                             |
| 许可             | MIT 依赖，商用需遵循 antd 许可                                                                                | ReUI 组件/示例免费；blocks 需 Pro、图标需 Ultimate(均有 .env.local 密钥) |
| React 版本       | v5 支持 React 16–18                                                                                           | shadcn/radix 面向 React 18+，与 @base-ui 兼容 React 18                   |

## 3. 组件覆盖对照矩阵

标记说明：✅ shadcn/ReUI 覆盖；🟡 ReUI 独有强化；❌ antd 有但需自建/第三方。

### 3.1 基础原语

| 组件               | antd     | shadcn 官方 | 差异要点                                                                                                                                       |
| ------------------ | -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Button             | ✅       | ✅          | antd size/link/ghost 体系；shadcn variant(default/secondary/destructive/outline/ghost/link)+ size，`asChild` 用于路由链接                      |
| Input / Textarea   | ✅       | ✅          | antd addonBefore/prefix/suffix；shadcn 用 InputGroup 组合，`data-slot` 透传                                                                    |
| Checkbox           | ✅       | ✅          | 无表单单测逻辑差异；shadcn 基于 radix checkbox                                                                                                 |
| Radio / RadioGroup | ✅       | ✅          | 均支持分组；shadcn 需手动排布 items                                                                                                            |
| Switch             | ✅       | ✅          | API 一致(checked/onCheckedChange)                                                                                                              |
| Avatar             | ✅       | ✅          | shadcn 用 radix avatar，fallback 占位                                                                                                          |
| Badge              | ✅       | ✅/🟡       | ReUI badge 更强：variant(solid/-outline/-light per color)、size xs..xl、radius default/full；本项目已装                                        |
| Card               | ✅       | ✅          | shadcn Card 结构(header/title/content/footer)；ReUI 的 Frame 提供结构化内容容器                                                                |
| Separator          | —        | ✅          | 替代 antd Divider 纯横线                                                                                                                       |
| Label              | —        | ✅          | radix label，配合表单                                                                                                                          |
| Skeleton / Spinner | ✅(Spin) | ✅          | shadcn spinner 组件 + Skeleton；antd Spin 有 tip/全屏                                                                                          |
| Divider            | ✅       | 🟡          | shadcn 无直接对应，用 Separator 或 border                                                                                                      |
| Alert              | ✅       | ✅/🟡       | ReUI alert：`Alert > AlertTitle/Description/Action`，variant default/destructive/info/success/warning/invert，非默认色用扩展 token；本项目已装 |
| Empty / Result     | ✅       | 🟡          | shadcn 无官方 Empty，用 icon-stack / 自建空态；Result 需自建                                                                                   |

### 3.2 输入选择

| 组件                             | antd             | ReUI/shadcn               | 差异要点                                                                                                                                                                                       |
| -------------------------------- | ---------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Select                           | ✅               | ✅ shadcn                 | antd 有远程搜索/大量项/虚拟；shadcn select 是 radix 基础版，远程搜索需自接。**大量项/异步场景换 ReUI autocomplete**                                                                            |
| Combobox                         | —                | ✅ shadcn                 | 基于 radix，替代 antd Select 的可搜索场景                                                                                                                                                      |
| Autocomplete                     | ✅(AutoComplete) | ✅/🟡 ReUI                | ReUI autocomplete 更强：`filter={null}` 远程搜索、`openOnInputClick`、`itemToStringValue`、reason 区分(item-press/input-change/clear-press)、内置 AutocompleteStatus；本项目 query-list 已实战 |
| Number Field                     | ✅(InputNumber)  | ✅/🟡 ReUI number-field   | ReUI：增减按钮 + scrub 区；antd InputNumber 有 step/precision                                                                                                                                  |
| Phone Input                      | ✅(Input + 自接) | ✅/🟡 ReUI phone-input    | ReUI：国家选择、E.164 值(`onChange` 返回 `+1415…` 或 undefined)、defaultCountry ISO 码                                                                                                         |
| Rating                           | ✅(Rate)         | ✅/🟡 ReUI rating         | 交互/只读模式一致                                                                                                                                                                              |
| Date Picker / Time Picker        | ✅               | ❌                        | **硬缺口**：ReUI date-selector 只覆盖周期(day/month/quarter/half-year/year + is/before/after/between)，不覆盖任意时间点。需 react-day-picker 自封装 `DateTimePicker`                           |
| Date Selector(周期)              | ❌               | ✅/🟡 ReUI date-selector  | ReUI 独有：periodTypes、presetMode、i18n、双月视图、yearRange                                                                                                                                  |
| Calendar(事件)                   | ❌               | ✅/🟡 ReUI event-calendar | 月/周/日/N-day/agenda 视图、拖拽排程、时区、外部 CRUD 契约                                                                                                                                     |
| Cascader / TreeSelect / Transfer | ✅               | ❌                        | 均需自建：Cascader/TreeSelect 可用 radix combobox + ReUI tree 组合；Transfer 自建双栏                                                                                                          |
| Upload                           | ✅               | ❌                        | shadcn 无官方；可引 radix 社区组件或自建(拖拽 + 进度)                                                                                                                                          |

### 3.3 数据展示

| 组件                   | antd | ReUI/shadcn          | 差异要点                                                                                                                                                                                                                                                                                            |
| ---------------------- | ---- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Table                  | ✅   | ✅/🟡 ReUI data-grid | **ReUI data-grid 全面胜出**：TanStack Table v9 + `dataGridFeatures`(排序/过滤/分页/列控制/dnd/虚拟滚动/无限滚动/行固定/树行/页脚)；`DataGridTableVirtual` 虚拟化、`DataGridTableDndRows` 拖行、`DataGridTableRowPin` 行固定。本项目决策表底座即 tanstack，与 data-grid 同源。**不要手写 `<table>`** |
| Tree                   | ✅   | ✅/🟡 ReUI tree      | 与 antd Tree 同级；配合 data-grid 树行可做行内层级                                                                                                                                                                                                                                                  |
| Timeline               | ✅   | ✅/🟡 ReUI timeline  | 视觉对齐主题；ReUI 有 12 个免费示例                                                                                                                                                                                                                                                                 |
| Steps / Stepper        | ✅   | ✅/🟡 ReUI stepper   | ReUI stepper 覆盖向导流程                                                                                                                                                                                                                                                                           |
| Gantt                  | ❌   | ✅/🟡 ReUI gantt     | ReUI 独有：树+时间双栏、日到年级缩放、拖拽排程、进度、汇总                                                                                                                                                                                                                                          |
| Kanban                 | ❌   | ✅/🟡 ReUI kanban    | ReUI 独有：拖拽看板                                                                                                                                                                                                                                                                                 |
| Filters                | ❌   | ✅/🟡 ReUI filters   | ReUI 独有：多类型过滤/运算符/视觉指示，12 示例含异步服务端搜索、虚拟大列表、与 data-grid 组合                                                                                                                                                                                                       |
| Frame                  | —    | ✅/🟡 ReUI frame     | 结构化内容容器，54 示例；用于页面分区                                                                                                                                                                                                                                                               |
| Icon Stack / Icon Tile | —    | ✅/🟡 ReUI           | 等距图标/图标瓷片/空态视觉                                                                                                                                                                                                                                                                          |
| Statistic              | ✅   | ❌                   | 自建(Label + Typography)                                                                                                                                                                                                                                                                            |
| Descriptions           | ✅   | ❌                   | 自建(dl 或 Card 网格)                                                                                                                                                                                                                                                                               |
| Progress               | ✅   | ❌                   | shadcn 无官方 progress 组件？有社区版；或用 radix progress 自封装                                                                                                                                                                                                                                   |
| Collapse / Carousel    | ✅   | ❌                   | 自建(radix collapsible / carousel 或社区版)                                                                                                                                                                                                                                                         |

### 3.4 反馈层

| 组件                   | antd    | shadcn/ReUI                            | 差异要点                                                                                                                                           |
| ---------------------- | ------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modal / Dialog         | ✅      | ✅ shadcn dialog / alert-dialog        | 结构一致(trigger/content/footer)；`AlertDialog` 对应 antd confirm                                                                                  |
| 命令式 Modal.confirm   | ✅      | ❌                                     | shadcn 无命令式；需用 state 控制 dialog 或事件桥                                                                                                   |
| message / notification | ✅ 静态 | ❌ sonner                              | **硬缺口**：antd 可在非 React 模块调用(本项目 error-message.ts、use-graph-clipboard.ts)；sonner 是 React 绑定，需模块级事件总线 + 全局 `<Toaster>` |
| Tooltip                | ✅      | ✅                                     | 一致；shadcn 有 delayDuration/side                                                                                                                 |
| Popover                | ✅      | ✅                                     | 一致                                                                                                                                               |
| Dropdown / ContextMenu | ✅      | ✅ shadcn dropdown-menu / context-menu | antd `MenuProps` 是库公开 API；shadcn 用 MenuContent/MenuItem，需迁移公开类型                                                                      |
| Popconfirm             | ✅      | ❌                                     | 用 AlertDialog + 状态替代                                                                                                                          |
| Spin / loading         | ✅      | ✅                                     | spinner + Skeleton                                                                                                                                 |

### 3.5 导航 / 布局

| 组件                  | antd | shadcn/ReUI          | 差异要点                                                                                                   |
| --------------------- | ---- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| Tabs                  | ✅   | ✅ shadcn tabs       | shadcn 无 closable/contextMenu/tabBarExtraContent，**graph tab bar 需自建封装层**(本项目 tab 架构依赖这些) |
| Menu(导航)            | ✅   | ❌                   | shadcn 用 sidebar + scrollspy + 自建菜单                                                                   |
| Sidebar               | —    | ✅ shadcn sidebar    | ReUI blocks(profile-9)依赖 shadcn sidebar，替代 antd Sider/Menu                                            |
| Stepper               | ✅   | ✅/🟡 ReUI stepper   | 同 3.3                                                                                                     |
| Scrollspy             | ❌   | ✅/🟡 ReUI scrollspy | 长页导航高亮                                                                                               |
| Sortable              | ❌   | ✅/🟡 ReUI sortable  | 拖拽排序，含嵌套                                                                                           |
| Pagination            | ✅   | ✅(data-grid 内置)   | 独立分页需自建或复用 data-grid Pagination                                                                  |
| Anchor                | ✅   | ❌                   | 用 scrollspy + 锚点替代                                                                                    |
| Layout / Sider / Grid | ✅   | ❌                   | shadcn 用 CSS grid + sidebar；无 Layout 抽象，但源码更可控                                                 |

## 4. ReUI 相对 antd 需要补充的内容(新项目落地清单)

按优先级分组，作为新项目前置任务。

### P0 必补(选 ReUI 的硬前提)

1. **shadcn 官方基础原语**：安装完整 registry(button、input、textarea、checkbox、radio-group、switch、avatar、badge、card、separator、label、skeleton、spinner、select、combobox、tabs、dialog、alert-dialog、dropdown-menu、context-menu、tooltip、popover、sonner、table、scroll-area、calendar、sidebar、input-group、field、item、use-file-upload)。ReUI blocks 的 `registryDependencies` 已证实这些都是 shadcn 标准项。
2. **components.json 基线**：`style: "default"`(base，非 radix 时避免 404)、`aliases: { components/ui, utils, lib, hooks }`、`@reui` registry + `REUI_LICENSE_KEY`(需 Pro 用 blocks / Ultimate 用图标)。
3. **主题基线**：`src/main.css` 用 shadcn 色板 + `@theme inline` 映射 `--color-*` + `@custom-variant dark`(`(&:is(.dark *, [data-theme="dark"] *))`，可接入 antd 或任意宿主暗色)。**锁定一个 surface**(frame 或 card)与一个图标风格(outline/solid/duotone/filled)，全项目一致。

### P1 表单体系

4. **表单**：`react-hook-form` + `zod`，shadcn `Form`/`Field` 作为包装。对比 antd `Form`+内置校验：校验逻辑从组件内迁到 schema 层，需要统一的错误展示约定。

### P2 命令式与缺口

5. **命令式反馈桥**：模块级事件总线(`emit('toast', …)`)+ 全局 `<Toaster>`(sonner)，对齐 antd `message`/`notification` 的静态调用点；Modal.confirm 用 dialog 状态机封装。
6. **时间点选择器**：`react-day-picker` 自封装 `DateTimePicker`(含 dayjs/date-fns 格式化)，填补 date-selector 不覆盖的任意时间点。
7. **复杂选择**：Cascader/TreeSelect(radix combobox + ReUI tree)、Transfer(自建双栏)。
8. **Upload / Segmented / Descriptions / Statistic / Progress / Collapse / Carousel / Menu 导航 / Anchor / Popconfirm**：自建或用 radix 社区版；部分可用 ReUI frame/icon-tile 组合替代。

### P3 迁移工具链

9. **公开 API 类型契约**：若从 antd 迁移，先冻结 `MenuProps`/`ThemeConfig` 等导出类型，逐组件替换时同步改写。
10. **回归**：暗色/亮色双主题 + 触屏/键盘 a11y + 组件示例(ReUI c-\* 免费示例即回归素材)。

## 5. 使用场景推荐

| 场景                                                        | 推荐                     | 理由                                                                                                  |
| ----------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------- |
| CRUD 业务后台、表单密集、需 DatePicker/Upload/Form 开箱即用 | **antd**                 | 全家桶完整度最高，缺口服小                                                                            |
| 数据密集型(表格/看板/甘特/过滤)、深度定制、包体敏感         | **shadcn + ReUI**        | data-grid/kanban/gantt/filters 远超 antd；源码可改；按需体积                                          |
| 决策编辑器 / 规则引擎(本项目)                               | **混合**                 | doc-10：react-flow 画布 + ReUI 面板；保留 lezer/wasm/序列化上游资产；核心编辑体验保留 antd 或逐步替换 |
| 未来全新项目，倾向 ReUI                                     | **ReUI + shadcn 补齐层** | 白盒可控 + 数据组件强；必须按 §4 先搭补齐层                                                           |

### 未来新项目选 ReUI 的落地路径

1. 建项目 → 装 Tailwind v4(@tailwindcss/vite)+ components.json(style=default)+ shadcn 官方 registry 全量基础。
2. 装 ReUI 20 组件(免费)→ 挑 c-\* 示例抄组合 → 定 surface/图标风格。
3. 按 §4 补齐表单、命令式桥、时间点、复杂选择、其余缺口。
4. 数据密集界面直接用 data-grid/kanban/gantt/filters，不手写表格。
5. 用 ReUI MCP + Agent Skill(`curl -fsSL https://mcp.reui.io/install | node -`)贯穿：search → install → get_component 读真实 API → get_examples 抄组合 → adapt by reuse → validate_usage/audit。

## 6. 决策记录

- **决策**：本仓库仅存档评估，不实施、不装依赖。
- **结论**：新项目若选 ReUI，需自带 §4 补齐层；若业务是表单/后台 CRUD 密集且不重定制，antd 仍是性价比选择。
- **关联**：
  - doc-09：antd 替换评估(混合共存结论)
  - doc-10：jdm-editor 从零重写评估与路线图
  - 本项目实战：query-list 节点(ReUI autocomplete + badge + Tailwind/shadcn 基建)已验证 ReUI 路线可行性
- **复盘点**：新项目立项时按 §4 清单先行；3 个月后结合 ReUI 组件成熟度与 antd 升级成本复审。

## 7. 相关文件

- `docs/09-shadcn-reui-replacing-antd.md`：antd 替换评估
- `docs/10-rewrite-roadmap.md`：jdm-editor 重写路线图
- `components.json`：@reui registry 配置(style=default)
- `src/main.css`：shadcn 色板 + dark variant 接入
- `src/components/reui/`：已装 ReUI 组件(autocomplete、badge)
- `src/reui/icons/default/outline/`：Motion Icons 实例
