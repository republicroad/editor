# 09. 用 shadcn + ReUI 取代 antd 的可行性评估

> 状态：存档评估（未实施）。结论：**保留 antd 核心 + 新 UI 用 ReUI**。
> 日期：2026-08-08
> 分支：zrule

## 1. 结论一句话

技术上可行，但**不建议整体替换**。这是涉及公开 API 破坏、约 70 个文件、核心 token 体系的大改，且 ReUI 并不能覆盖 antd 的多数基础组件。推荐**混合共存**：编辑器核心保留 antd，新增界面一律用 shadcn + ReUI。

## 2. 现状量化

### 2.1 使用规模

| 指标 | 数值 |
|---|---|
| 导入 `antd` 的文件数 | 70（jdm-editor 子模块 + 主 app） |
| 导入 `@ant-design/icons` 的文件数 | 32 |
| antd 组件品种 | ~30（Typography 39、Button 35、Input 29、theme 28、message 19、Select 14、Tooltip 14、Dropdown 9、Tabs 6、Modal 7、Form 7、DatePicker/TimePicker 各 1-2 …） |
| `theme.useToken()` 调用点 | ~23 |
| 项目 SCSS 中 `ant-*` 类名引用 | 53 处 / 10 个文件（含 `.ant-select-selection-overflow-item`、`.ant-picker-suffix` 等内部类） |
| antd 直接 CSS 变量引用 | `var(--ant-color-text-*)` 等（expression-builder.scss） |
| antd 产物体积 | `antd.min.js` 1.47 MB（本地实测，按需引入后远低于此） |

### 2.2 架构性耦合

- **主题体系**：`jdm-editor/src/theme.tsx` 的 `JdmConfigProvider` 用 `ConfigProvider` + `darkAlgorithm`/`defaultAlgorithm`，`GlobalCssVariables` 将 ~40 个 antd token 泵进 `--grl-*` CSS 变量，**全部 SCSS 从这里取色**。
- **公开 API 暴露 antd 类型**：`JdmConfigProviderProps.theme = Omit<AntThemeConfig, …>`、`prefixCls`、`locale`（theme.tsx:30）；`DecisionNode.menuItems?: MenuProps['items']` 是节点规范的公开契约（6 个节点规范都构建 antd menu）。
- **命令式 API**：静态 `message`/`notification`/`Modal.confirm` 在 19 个文件使用，包括纯 helper（`src/helpers/error-message.ts`、`hooks/use-graph-clipboard.ts`）。
- **深埋 CSS 耦合**：SCSS 直接摸 antd **内部** DOM 类名（非公开类），升级 antd 自身即有断裂风险。
- **主 app 主题**：`src/context/theme.provider.tsx` 用 antd `ConfigProvider` 切 dark/light/auto，并依赖 `JdmConfigProvider theme={{ mode }}`。

### 2.3 好消息（迁移负担低的部分）

- 决策表/表达式列表**不是** antd Table——基于 `@tanstack/react-table` + `@tanstack/react-virtual` 的自研网格，最大隐患点已排除。
- antd locale 未启用（自定义 i18n `I18nProvider`），无本地化迁移。
- 纯装饰组件（Typography/Card/Avatar/Badge/Alert/Switch/Checkbox 等）替换成本低。

## 3. 四个动机逐条结论

### 3.1 antd 维护问题 → 保留，但需管理

| 风险 | 证据 | 处置 |
|---|---|---|
| 版本漂移 | 子模块锁 `antd 5.21.2`、主 app `^5.29.3`，workspace 依赖下 CSS-in-JS 差异易致 token 不一致 | 强制对齐到同一版本 |
| 深层 CSS 耦合 | 53 处 `ant-*` 内部类 + `var(--ant-color-*)` | 换栈即全量重写；留在 antd 则需随升级回归 |
| 公开 API 暴露 antd 类型 | `MenuProps`、`Omit<AntThemeConfig>`、`prefixCls` | 替换 = major breaking，需冻结类型 |
| 命令式 API 脱离 React | 静态 message/notification 在纯 helper 中 | 换栈需事件桥接层 |

### 3.2 减依赖/体积 → 收益存疑

- 替换后新增依赖：`@radix-ui/*`（多包）、`class-variance-authority`、`tailwind-merge`、`sonner`、`react-day-picker` 等。
- antd 按需 + tree-shake 后净体积与 radix 栈接近；真正的赢点是**只保留被用到的 30 个组件**（当前已按需受控），而非整体移除。

### 3.3 视觉统一 → 不换栈，做 token 映射

- `GlobalCssVariables` 已把 antd token 泵成 `--grl-*`（theme.tsx:76-131），这是统一钩子。
- shadcn 色板（`--background/--foreground/--primary/--border/--ring/…`）与 `--grl-*` 做双向映射（主 app 已接 `[data-theme="dark"]`，见 `src/main.css`）。
- 业务新页用 shadcn/ReUI、编辑器内用 antd，同一设计语言下观感一致。

### 3.4 核心组件硬缺口（ReUI/shadcn 无法低成本替代）

| antd 能力 | 替代情况 |
|---|---|
| `DatePicker`/`TimePicker`（dayjs） | 表达式构建器类型字面量编辑核心；ReUI `date-selector` 是周期筛选器，**不覆盖任意时间点** |
| `Tabs`（可关闭、contextMenu、tabBarExtraContent） | shadcn `Tabs` 无 closable/extraContent，graph tab bar 需重写 |
| `Dropdown` + `MenuProps` 公开类型 | radix ContextMenu/DropdownMenu API 不同，公开契约破坏 |
| `Select`（异步搜索/大量项） | shadcn `Select` 无远程搜索、无虚拟滚动 |
| 静态 `message`/`notification` | shadcn/sonner 为 React 上下文绑定，非 React 调用需桥接 |

## 4. ReUI 覆盖范围（为何不能当"antd 替代品"）

ReUI 的 20 个组件是**高阶数据 UI**：data-grid、kanban、filters、date-selector、stepper、tree、timeline、gantt、autocomplete、badge、frame 等。

**没有**：select、tabs、dialog、toast/message、tooltip、context-menu、form、基础 input/button。这些基础原语要靠 shadcn/ui + radix，功能比 antd 简单。ReUI 的价值在**新增高价值数据界面**（query-list 节点已示范：autocomplete + badge）。

## 5. 推荐路径（存档）

### 5.1 现在：混合共存

- **新增界面**：一律 shadcn + ReUI（query-list 节点已验证此路线，`src/components/reui/*`、`src/reui/icons/*`）。
- **编辑器核心**（决策表/表达式/tab/菜单/命令式反馈/DatePicker）：**保留 antd**，是性价比最优解。
- **依赖管理**：强制 antd 单一版本对齐子模块与主 app。

### 5.2 长期去 antd（若未来决定）

6 阶段路线图，预估 **4-6 周专人** + 视觉回归（暗色算法、Storybook）：

1. token 变量层解耦：SCSS 全面改用 `--grl-*`，消除 `var(--ant-color-*)`。
2. 命令式 API 事件桥：message/notification/Modal.confirm 抽象为事件总线。
3. 装饰组件替换：Typography/Alert/Empty/Result/Card 等 radix 化。
4. 核心组件逐个 radix 化：Tabs → Dropdown → Select → DatePicker/TimePicker。
5. `ant-*` SCSS 清理：按新 DOM 重写 53 处内部类样式。
6. 公开 API 类型冻结与 major 发布：重定义 `JdmConfigProviderProps`/`MenuProps`。

## 6. 决策记录

- **决策**：保持 antd 核心 + 新 UI 用 ReUI（shadcn）。
- **理由**：公开 API 破坏成本、token 体系重写、命令式 API 桥接、DatePicker/Tabs/Select 功能缺口，均指向保留核心。
- **复盘点**：3 个月后结合 antd 升级成本与 ReUI 组件成熟度复审。

## 7. 相关文件

- `jdm-editor/packages/jdm-editor/src/theme.tsx`：ConfigProvider + token 桥
- `src/context/theme.provider.tsx`：主 app 主题切换
- `src/main.css`：shadcn 色板 + dark variant 接入 antd
- `src/components/custom-node/query-list-node.tsx`：ReUI 混合路线示范
- `components.json`：`@reui` registry 配置
