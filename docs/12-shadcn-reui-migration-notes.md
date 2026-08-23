# 12. shadcn/ReUI 迁移实施记录与主题集成经验

> 状态：已实施
> 日期：2026-08-23
> 分支：zrule

## 1. 结果总览

docs/09 的「混合共存」路线已在**主 app(src/)层面全部落地**,jdm-editor 子模块维持 antd(§09-5.1 决策不变):

| 指标 | 迁移前 | 迁移后 |
|---|---|---|
| src/ 内导入 `antd` 的文件 | 7 | **1**(`theme.provider.tsx` 的 ConfigProvider,jdm-editor 硬依赖,永久保留) |
| src/ 内 `@ant-design/icons` | 1 文件 4 图标 | **0**(lucide-react 替代) |
| 新增依赖 | — | `@radix-ui/{switch,dropdown-menu,alert-dialog}`、`sonner`;`next-themes` 装后即删 |
| 主 chunk 体积(min) | 8,449 kB | 8,158 kB(**-291 kB**) |

迁移文件:`http-request-node`、`query-list-node`、`custom-node-summary-card`(custom-node 目录零 antd)、`page-header`、`not-found`、`decision-simple`、`error-message.ts`、`context/customnode.tsx`。

## 2. 主题集成三个关键决策

### 2.1 双信号 dark 模式

`theme.provider.tsx` 的 effect 同时设置两个信号:

- `document.body[data-theme = dark|light]` —— jdm-editor 的 `JdmConfigProvider` 在自身容器上用 `[data-theme]` 作用域取色;
- `document.documentElement.classList.toggle('dark', isDark)` —— shadcn 色板的 `.dark{}` token 块挂在 html 上。

两者互不冲突:jdm-editor 从不操作 `html.dark`,shadcn 组件从不读 `[data-theme]`,因此编辑器内 antd 与页面上 shadcn 各取所需。

### 2.2 Tailwind preflight 缺失教训(重要)

`src/main.css` 原本只引入 `theme.css` + `utilities.css`,**没有 preflight**。后果:

- UA 样式 `button { color: buttontext }` 是直接声明,**阻断继承**;`buttontext` 跟随 OS 主题而非页面主题,导致暗色页面下按钮文字不可见(且与 `.dark` 类无关,任何组件级修补都是打地鼠);
- 修复:`@import "tailwindcss/preflight.css" layer(base);`,此后 `button { color: inherit }` 生效,先前为绕过而打的 `text-foreground` 补丁全部删除。

**规则:凡使用 shadcn token 体系,preflight 必须在位;否则 UA 元素样式会系统性污染暗色模式。**

### 2.3 body 底色

preflight 不设置页面底色,`main.css` 显式补:

```css
body { margin: 0; background-color: var(--background); color: var(--foreground); }
```

## 3. token 映射(antd token → tailwind 类)

| antd | 替代 |
|---|---|
| `token.colorPrimaryBg`(选中行底色) | `bg-primary/10` |
| `token.colorSuccess` | `text-success` |
| `token.colorBgLayout`(页头底) | `bg-muted/50` |
| `token.colorBorder`(页头分隔线) | `border-b`(border-input/border-border 视场景) |
| `token.fontSizeSM` / `fontSize: 12` | `text-xs` |
| Typography.Text `type="secondary"` | `text-muted-foreground` |

## 4. 组件替换映射

| antd 用法 | shadcn/reui 实现 |
|---|---|
| `Button type="text" size="small"` | `<Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs">` |
| 图标 ghost 钮(行内删除) | `variant="ghost" size="sm" className="h-6 w-6 p-0"` + `aria-label` |
| `type="dashed" block`(添加行) | `variant="outline" size="sm" className="h-7 w-full border-dashed text-xs"` |
| `Input addonBefore` | 外层 `flex h-8 rounded-md border` + label span(`border-r bg-muted/50`) + 无边框 Input(`rounded-none border-0 shadow-none focus-visible:ring-0`) |
| `Alert type="info" message description` | reui `<Alert variant="info"><ShieldSearchIcon/><AlertTitle/><AlertDescription/></Alert>` |
| `Result status="404"` | 手写居中布局(h1 + muted p + Button asChild Link) |
| `Typography.Title editable` | 自制 ~40 行 `EditableTitle`:span 态点击进无边框 input,blur/Enter 提交、Escape 取消,渲染期 prev 对比同步外部值 |
| `message.success/error`(React 内) | `toast.success/error`(sonner) |
| 静态 `message.error`(非 React helper,error-message.ts) | 直接静态导入 `toast.error` —— **sonner 允许非 React 调用**,docs/10-P6 预设的模块级事件总线不需要,全局 `<Toaster>` 挂在 `ThemeContextProvider` 即可 |
| `Modal.confirm({title,content,onOk})` ×2 | `pendingConfirm` 状态机 + `<AlertDialog>`(Action onClick 支持异步,语义等价) |
| `Dropdown menu={{items}}` | `DropdownMenu + DropdownMenuItem + DropdownMenuSeparator` |
| 主题三选项(CheckOutlined visibility 技巧) | `DropdownMenuCheckboxItem checked=...`(内建指示器) |
| `Switch size="small"` | `<Switch className="h-4 w-7 [&>span]:size-3 data-[state=checked]:[&>span]:translate-x-3">` |
| `Divider type="vertical"` | `<Separator orientation="vertical" className="h-5 self-center">` |
| BulbOutlined/CheckOutlined/PlayCircleOutlined/ApartmentOutlined/ApiOutlined/LeftOutlined/RightOutlined | lucide:Lightbulb/CirclePlay/Network/Plug/ChevronLeft/ChevronRight |

## 5. 工程注意点

- **react-hooks/set-state-in-effect**:由 props 同步本地 state 禁止用 useEffect,改渲染期 prev 对比模式(`if (prev !== value) { setPrev(value); setX(value); }`,与子模块 QueryInstanceEditor 同款)。
- **shadcn CLI 覆盖交互**:add 已存在文件会挂起等输入;批处理用 `-y -o`。本次覆盖 `ui/button.tsx` 仅引号风格差异,API 无变化。
- **sonner 模板适配**:官方模板 import `next-themes`;改为读本项目 `useTheme().isDarkTheme`,`bun remove next-themes`。
- **PageHeader**:保留原 props 兼容,新增 `className` 透传(Stack 展开 rest)。

## 6. 相关提交(zrule)

```
fd55528 chore: add shadcn switch, dropdown-menu, alert-dialog and sonner primitives
ff45ec4 refactor: migrate query-list node and summary card off antd to shadcn/reui
7199b64 refactor: migrate page-header and not-found off antd to shadcn
7ede4c1 refactor: migrate decision-simple page off antd to shadcn primitives
3590e2e refactor: replace antd static message with sonner toast in error helper
f2f0aa4 refactor: replace ant-design icons with lucide in demo custom nodes
```
