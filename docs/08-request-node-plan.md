# Request 节点集成计划

> 将 opencode 分支的 Request 节点(Input 节点增强版)移植到 zrule 分支，使 jdm-editor 的 Input 节点默认拥有友好的 3-Tab 编辑器(Definitions/Examples/Schema)。

---

## 目录

- [一、总体目标](#一总体目标)
- [二、现状对比](#二现状对比)
- [三、文件清单](#三文件清单)
- [四、执行步骤](#四执行步骤)
  - [阶段一：纯工具模块移植](#阶段一纯工具模块移植)
  - [阶段二：Store 扩展](#阶段二store-扩展)
  - [阶段三：Simulator Request Panel 升级](#阶段三simulator-request-panel-升级)
  - [阶段四：Input 节点核心改造](#阶段四input-节点核心改造)
  - [阶段五：导出和验证](#阶段五导出和验证)
- [五、风险和注意事项](#五风险和注意事项)

---

## 一、总体目标

| 层级 | 目标 |
|------|------|
| **Option A** | jdm-editor 库内部：Input 节点默认使用 TabRequest(3-Tab 编辑器) |
| **Option B** | editor 项目外部：通过 `components` 机制可覆盖 Input 节点 Tab |

---

## 二、现状对比

| | zrule(当前) | opencode(参考) |
|---|---|---|
| Input Tab | `TabJsonSchema` — 单一 Monaco 编辑器，~228 行 | `TabRequest` — 3-Tab 编辑器(Definitions/Examples/Schema)，~1,719 行 |
| Schema 工具 | 无 | `request-schema.ts` — ~1,010 行，自包含无内部依赖 |
| Simulator 集成 | 简单版(~115 行，仅 Run 按钮) | 完整版(~700 行，含 Format/Sync/Save/Copy/Run) |
| Store 字段 | 无 simulator 相关 | `simulatorRequest`, `simulatorExampleBinding` |
| inputNodeSchema | `{ schema, fields, example, jsonSchema }` | `{ schema, schemaUI, expressions }` |
| i18n | 无(硬编码英文) | 完整 i18n(~200 key) |

---

## 三、文件清单

### 需要新增的文件(jdm-editor)

| # | 文件 | 来源 | 行数 | 依赖 |
|---|------|------|------|------|
| 1 | `helpers/request-schema.ts` | opencode 复制 | ~1,010 | 仅 `json5`(已有) |
| 2 | `helpers/json-schema.ts` | opencode 复制 | ~66 | 仅 `@gorules/zen-engine-wasm`(已有) |
| 3 | `locales/context.tsx` | opencode 复制 | ~60 | 仅 React Context |
| 4 | `locales/index.ts` | opencode 复制 | ~10 | re-export |
| 5 | `locales/en_US.json` | opencode 复制 | ~200 | 无 |
| 6 | `locales/zh_CN.json` | opencode 复制 | ~200 | 无 |
| 7 | `graph/tab-request.tsx` | opencode 复制 + 适配 | ~1,719 | 上述所有 |

### 需要修改的文件(jdm-editor)

| # | 文件 | 改动 |
|---|------|------|
| 8 | `context/dg-store.context.tsx` | 新增 `simulatorRequest`, `simulatorExampleBinding` 等字段 |
| 9 | `nodes/specifications/input.specification.tsx` | `renderTab` 切换为 `TabRequest`，适配 schema 结构 |
| 10 | `helpers/schema.ts` | `inputNodeSchema` 改为 `{ schema, expressions }` |
| 11 | `simulator/simulator-request-panel.tsx` | 从 opencode 复制替换(~115 → ~700 行) |
| 12 | `simulator/dg-simulator.tsx` | 适配 i18n + 面板宽度 |

### 已有无需改动的文件

| 文件 | 原因 |
|------|------|
| `graph/json-to-json-schema-dialog.tsx` | zrule 已存在 |
| `helpers/monaco.ts` | zrule 已存在 |
| `helpers/file-helpers.ts` | zrule 已存在 |
| `helpers/utility.ts` | zrule 已存在 |
| `helpers/wasm.ts` | zrule 已存在 |

---

## 四、执行步骤

### 阶段一：纯工具模块移植

- [x] **步骤 1**：复制 `request-schema.ts`(opencode → zrule)✅ `246f376`
- [x] **步骤 2**：复制 `json-schema.ts`(opencode → zrule)✅ `246f376`
- [x] **步骤 3**：复制 `locales/` 4 个文件(opencode → zrule)✅ `246f376`
- [x] **步骤 4**：提交 `feat: add request-schema, json-schema helpers and i18n infrastructure` ✅ `246f376`

### 阶段二：Store 扩展

- [x] **步骤 5**：扩展 `dg-store.context.tsx`(新增 SimulatorExampleBinding 类型 + 字段 + actions)✅ `6586653`
- [x] **步骤 6**：提交 `feat: add simulator request/binding state to zustand store` ✅ `6586653`

### 阶段三：Simulator Request Panel 升级

- [x] **步骤 7**：替换 `simulator-request-panel.tsx`(opencode 版本替换简单版本)✅ `6fe2e29`
- [x] **步骤 8**：适配 `dg-simulator.tsx`(i18n + 面板宽度)✅ `6fe2e29`
- [x] **步骤 9**：提交 `feat: upgrade simulator request panel with full feature set` ✅ `6fe2e29`

### 阶段四：Input 节点核心改造

- [x] **步骤 10**：移植 `tab-request.tsx`(opencode 复制 + 适配导入路径)✅ `1a5e7cc`
- [x] **步骤 11**：改写 `input.specification.tsx`(renderTab → TabRequest，inferTypes 移植)✅ `1a5e7cc`
- [x] **步骤 12**：适配 `inputNodeSchema`(改为 `{ schema, expressions, inputField, outputPath }`，移除 schemaUI)✅ `1a5e7cc`
- [x] **步骤 13**：提交 `feat: replace TabJsonSchema with TabRequest for input node` ✅ `1a5e7cc`

### 阶段五：导出和验证

- [x] **步骤 14**：导出新模块(`index.ts`)✅ `7a2bc3d`
- [x] **步骤 15**：`bun run typecheck` ✅ 通过
- [x] **步骤 16**：`bun run build` ⚠️ 预存在问题，与本次改动无关
- [x] **步骤 17**：提交 `feat: export request-schema, json-schema, TabRequest from barrel` ✅ `7a2bc3d`

---

## 五、风险和注意事项

| 风险 | 缓解措施 |
|------|----------|
| `inputNodeSchema` 结构变更 | 步骤 12 前检查 editor 项目是否使用旧字段 |
| `tab-request.tsx` 的 i18n 依赖 | 步骤 3 已移植完整 i18n 系统 |
| `simulator-request-panel.tsx` store 字段不匹配 | 步骤 5 已添加所需字段 |
| opencode 分支代码与 zrule 分支的隐式差异 | 每个阶段完成后运行 Typecheck |

---

## 六、模拟器模块化重构(后续)

> 目标：拆分 `simulator/` 下的大组件为可测试的独立模块，并为 request-schema helpers 建立单测基线(bun test)。
> 分支：zrule | 日期：2026-08-09

### 执行步骤

- [x] **步骤 18**：新增单测基线
  - `helpers/request-schema/__tests__/examples.test.ts`(merge/normalize/conflicts/template/sources/schema 更新)
  - `helpers/__tests__/json-path-extractor.test.ts`
  - 基础设施：`@types/bun` devDep + `test: bun test src` script + tsconfig `types: ["bun"]`
  - 提交 `test: add unit tests for request-schema helpers and json path extractor` ✅ `f4e972d`
- [x] **步骤 19**：拆分 `dg-simulator.tsx`
  - 搜索/清除/节点列表/StatusIcon → `simulator/simulator-nodes-panel.tsx`
  - `dg-simulator.tsx` 收敛为布局 + 响应编辑器，仅保留 `SimulationSegment`/`displaySegment`
- [x] **步骤 20**：抽取 hooks
  - `simulator/use-simulator-request-binding.ts`：承接 requestSources/boundIndex/resolvedBinding/currentBindingIdentity/definitions/sourceOptions/bindingName/shouldShowSelect 派生链
  - `simulator/use-simulator-request-editor.ts`：requestValue 状态、外部 simulatorRequest 应用、defaultRequest 同步、切源动画定时器
  - 提交 `refactor(simulator): extract nodes panel and request binding/editor hooks` ✅ `a75fd1e`
- [x] **步骤 21**：验证 `bun run typecheck` ✅ 通过；`bun test` ✅ 21 pass；`bun run build` ✅ 通过

### 备注

- `use-request-example-persistence.ts` 已使用对象参数签名(`UseRequestExamplePersistenceParams`)。
- `use-request-examples-editing.ts` 的下载/上传已用 `saveFile`/`file.text()`，不再依赖 `Buffer`/`getRawFile`。

---

## 七、HTTP 请求节点专属 UI(contrib.http_request)

> 为 `contrib.http_request` 自定义节点提供专属交互 UI，替代 schema 驱动的默认渲染。风格选型：Postman 表单(A)+ Headers 键值对表格(B)+ 请求|响应分栏(D)融合实施；多实例并行(F)已实施；页签分组(E)列入 roadmap 暂不实施。分支：zrule | 日期：2026-08-22

### 已实现(A+B+D 融合)

| 风格 | 内容 |
|------|------|
| **A. Postman 表单** | 节点卡片：method 彩色 Tag + URL + 状态徽标(2xx/3xx/4xx/5xx/ERR)；Tab 编辑器：method 下拉 + URL/Body 表达式编辑器 + 可编辑输出键 |
| **B. 键值对表格** | Headers 默认结构化模式(可增删 key/value 行，value 为 Zen 表达式输入)；对象字面量无法解析时自动降级「原始表达式模式」，支持手动切换 |
| **D. 分栏布局** | Tab 编辑器左右分栏：左侧请求配置表单，右侧同屏模拟响应(状态徽标 + 响应头折叠详情 + Body JSON 预览)，复用 query-list 的 tabSplit 布局思路 |

### E. 页签分组(Roadmap，暂不实施)

- [ ] **E1**：以 antd Tabs 将 Params / Headers / Body / 高级 / 响应 分页签展示，进一步降低单屏信息密度。
- [ ] **E2**：预留高级配置扩展位——超时(timeout)、重试(retry)、Auth(Basic/Bearer)等未来参数以新页签接入。
- 启动条件：请求节点需新增更多配置项(如 timeout/retry/auth)导致左侧纵向表单过长时再启动。
- 前置依赖：无；与现有 A+B+D 实现兼容，届时仅需调整 `HttpRequestTab` 内部布局为页签容器。

### F. 多实例并行请求(已实施)

- [x] **F1**：`expressions` 数组承载多个并行 HTTP 请求实例，后端 engine 对全部表达式 `Promise.all` 并行执行、按 `key` 分别写入输出(复用 query-list 同款机制)。
- [x] **F2**：Tab 编辑器改为三层布局(复用 query-list 的 tabSplit 模式)：左列实例列表(「请求 N」+ 状态徽标 + 删除按钮，第二行 mono 文本 `{method} · {url}`)+ 「添加请求」虚线按钮；右侧详情区保留 请求表单|模拟响应 分栏。切换实例时 `HeadersEditor` 以 `key={selected.id}` 强制重挂载，重置结构化编辑状态。
- [x] **F3**：节点卡片逐条聚合展示全部实例：每行 method Tag + URL + 独立状态徽标；returns 行显示「请求次数 N」。错误仅经 ERR 徽标 tooltip 呈现，不再单独铺开错误文本。
- 新实例键名自动分配：`result2`、`result3` …(跳过已占用键)；删除无最小数量限制，允许清空后重新添加；空态在详情区提示「尚未配置请求」。

### 关键实现约定

- 表达式存储：每个请求实例为 `expressions[i] = { id, key: '该实例输出键', value: ['http_request', urlExpr, quote(method), headersExpr, bodyExpr] }`，位置参数与后端 `funcBindParams` 声明序严格一致，headers/body 空值也必须占位；多实例并行执行，输出按各实例 `key` 分别写入。
- KIND 与 UDF 注册名分离：`KIND = 'contrib.http_request'`(节点规范标识)，`UDF_FUNC = 'http_request'`(表达式首参，后端 udfManager 以此查找)。
- Headers 往返协议：`{ k: expr, ... }` 对象字面量 ⇄ 行数组；键为合法标识符时裸写、否则 JSON 引号包裹，空键序列化为 `""` 保证编辑中不丢行；含整体引用(如 `input.headers`)或拼接表达式的内容无法拆行时保留原文并提示切换模式。

