# Request 节点集成计划

> 将 opencode 分支的 Request 节点（Input 节点增强版）移植到 zrule 分支，使 jdm-editor 的 Input 节点默认拥有友好的 3-Tab 编辑器（Definitions/Examples/Schema）。

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
| **Option A** | jdm-editor 库内部：Input 节点默认使用 TabRequest（3-Tab 编辑器） |
| **Option B** | editor 项目外部：通过 `components` 机制可覆盖 Input 节点 Tab |

---

## 二、现状对比

| | zrule（当前） | opencode（参考） |
|---|---|---|
| Input Tab | `TabJsonSchema` — 单一 Monaco 编辑器，~228 行 | `TabRequest` — 3-Tab 编辑器（Definitions/Examples/Schema），~1,719 行 |
| Schema 工具 | 无 | `request-schema.ts` — ~1,010 行，自包含无内部依赖 |
| Simulator 集成 | 简单版（~115 行，仅 Run 按钮） | 完整版（~700 行，含 Format/Sync/Save/Copy/Run） |
| Store 字段 | 无 simulator 相关 | `simulatorRequest`, `simulatorExampleBinding` |
| inputNodeSchema | `{ schema, fields, example, jsonSchema }` | `{ schema, schemaUI, expressions }` |
| i18n | 无（硬编码英文） | 完整 i18n（~200 key） |

---

## 三、文件清单

### 需要新增的文件（jdm-editor）

| # | 文件 | 来源 | 行数 | 依赖 |
|---|------|------|------|------|
| 1 | `helpers/request-schema.ts` | opencode 复制 | ~1,010 | 仅 `json5`（已有） |
| 2 | `helpers/json-schema.ts` | opencode 复制 | ~66 | 仅 `@gorules/zen-engine-wasm`（已有） |
| 3 | `locales/context.tsx` | opencode 复制 | ~60 | 仅 React Context |
| 4 | `locales/index.ts` | opencode 复制 | ~10 | re-export |
| 5 | `locales/en_US.json` | opencode 复制 | ~200 | 无 |
| 6 | `locales/zh_CN.json` | opencode 复制 | ~200 | 无 |
| 7 | `graph/tab-request.tsx` | opencode 复制 + 适配 | ~1,719 | 上述所有 |

### 需要修改的文件（jdm-editor）

| # | 文件 | 改动 |
|---|------|------|
| 8 | `context/dg-store.context.tsx` | 新增 `simulatorRequest`, `simulatorExampleBinding` 等字段 |
| 9 | `nodes/specifications/input.specification.tsx` | `renderTab` 切换为 `TabRequest`，适配 schema 结构 |
| 10 | `helpers/schema.ts` | `inputNodeSchema` 改为 `{ schema, expressions }` |
| 11 | `simulator/simulator-request-panel.tsx` | 从 opencode 复制替换（~115 → ~700 行） |
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

- [x] **步骤 1**：复制 `request-schema.ts`（opencode → zrule）✅ `246f376`
- [x] **步骤 2**：复制 `json-schema.ts`（opencode → zrule）✅ `246f376`
- [x] **步骤 3**：复制 `locales/` 4 个文件（opencode → zrule）✅ `246f376`
- [x] **步骤 4**：提交 `feat: add request-schema, json-schema helpers and i18n infrastructure` ✅ `246f376`

### 阶段二：Store 扩展

- [x] **步骤 5**：扩展 `dg-store.context.tsx`（新增 SimulatorExampleBinding 类型 + 字段 + actions）✅ `6586653`
- [x] **步骤 6**：提交 `feat: add simulator request/binding state to zustand store` ✅ `6586653`

### 阶段三：Simulator Request Panel 升级

- [x] **步骤 7**：替换 `simulator-request-panel.tsx`（opencode 版本替换简单版本）✅ `6fe2e29`
- [x] **步骤 8**：适配 `dg-simulator.tsx`（i18n + 面板宽度）✅ `6fe2e29`
- [x] **步骤 9**：提交 `feat: upgrade simulator request panel with full feature set` ✅ `6fe2e29`

### 阶段四：Input 节点核心改造

- [x] **步骤 10**：移植 `tab-request.tsx`（opencode 复制 + 适配导入路径）✅ `1a5e7cc`
- [x] **步骤 11**：改写 `input.specification.tsx`（renderTab → TabRequest，inferTypes 移植）✅ `1a5e7cc`
- [x] **步骤 12**：适配 `inputNodeSchema`（改为 `{ schema, expressions, inputField, outputPath }`，移除 schemaUI）✅ `1a5e7cc`
- [x] **步骤 13**：提交 `feat: replace TabJsonSchema with TabRequest for input node` ✅ `1a5e7cc`

### 阶段五：导出和验证

- [x] **步骤 14**：导出新模块（`index.ts`）✅ `7a2bc3d`
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
