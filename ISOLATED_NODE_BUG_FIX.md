# 孤立节点偶现错误修复总结

## 问题描述

### 错误信息
```
TypeError: Cannot read properties of undefined (reading '5671ab42-af79-4764-bf37-419d1cb1ee87')
    at tab-custom-function-table.tsx:38:39
```

### 复现场景
1. 创建一个新的孤立节点（未连接到输入节点）
2. 运行 simulator
3. 立即点击该孤立节点进行编辑
4. **偶现**报错（不是每次必现）

### 影响范围
- 自定义函数节点 (CustomFunctionTable)
- 表达式节点 (Expression)
- 决策表节点 (DecisionTable)
- 请求节点 (Request)

## 根本原因分析

### 直接原因
代码在访问 `result.trace[id]` 时，没有检查该节点是否存在于 trace 中。对于孤立节点（未被服务端执行的节点），`result.trace[id]` 返回 `undefined`，后续代码尝试访问 `undefined` 的属性导致报错。

### 为什么是偶现的？

这是一个**竞态条件（Race Condition）**问题，取决于以下因素：

#### 1. 组件渲染时机
- **不报错情况**：如果孤立节点的编辑面板在 simulator 运行前就已经打开，组件会重新渲染，走 `otherwise()` 分支返回 `null`
- **报错情况**：如果是 simulator 运行后才打开编辑面板，组件首次渲染时会尝试访问不存在的 `trace[id]`

#### 2. Zustand Store 更新时序
- 当 `simulate.result` 更新时，如果组件未订阅或未渲染 → 不报错
- 如果组件正在渲染过程中，`simulate.result` 被设置 → 容易报错

#### 3. React 批量更新
- React 18 的自动批处理可能影响状态更新顺序
- 有时候多个状态更新会合并，有时候不会

#### 4. ts-pattern 匹配逻辑问题
```typescript
nodeTrace: match(simulate)
  .with(
    { result: P.nonNullable },  // ← 只检查 result 是否非空
    ({ result }) => result.trace[id]  // ← 但没检查 trace[id] 是否存在！
  )
  .otherwise(() => null),
```

**问题**：
- `P.nonNullable` 只检查 `result` 是否非空
- **不检查** `result.trace[id]` 是否存在
- 当 `result.trace[id]` 是 `undefined` 时，后续代码会崩溃

## 修复方案

### 选择的方案
**方案 A**：点击编辑时不显示调试信息（debug 为 undefined），但不报错

### 方案优势
1. 符合现有代码逻辑（已有 debug 为 undefined 的处理）
2. 用户体验最好（孤立节点仍可编辑，只是没有调试信息）
3. 最小改动（只需修改 selector 中的匹配逻辑）
4. 语义正确（孤立节点 = 未执行 = 没有 trace = debug 为 undefined）

## 修复的文件

### 1. tab-custom-function-table.tsx
**位置**：`jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/tab-custom-function-table.tsx`

**修改前（第 35-50 行）**：
```typescript
nodeTrace: match(simulate)
  .with(
    { result: P.nonNullable },
    ({ result }) => result.trace[id] as SimulationTrace<SimulationTraceDataExpression>,
  )
  .otherwise(() => null),
inputData: match(simulate)
  .with({ result: P.nonNullable }, ({ result }) => getNodeData(id, { trace: result.trace, decisionGraph }))
  .otherwise(() => null),
nodeSnapshot: match(simulate)
  .with(
    { result: P.nonNullable },
    ({ result }) =>
      result.snapshot?.nodes?.find((n) => n.id === id)?.content as z.infer<typeof customNodeSchema>['content'],
  )
  .otherwise(() => null),
```

**修改后**：
```typescript
nodeTrace: match(simulate)
  .with(
    { result: P.nonNullable },
    ({ result }) => (result.trace?.[id] as SimulationTrace<SimulationTraceDataExpression>) ?? null,
  )
  .otherwise(() => null),
inputData: match(simulate)
  .with({ result: P.nonNullable }, ({ result }) =>
    result.trace?.[id] ? getNodeData(id, { trace: result.trace, decisionGraph }) : null
  )
  .otherwise(() => null),
nodeSnapshot: match(simulate)
  .with(
    { result: P.nonNullable },
    ({ result }) =>
      (result.snapshot?.nodes?.find((n) => n.id === id)?.content as z.infer<typeof customNodeSchema>['content']) ?? null,
  )
  .otherwise(() => null),
```

### 2. tab-expression.tsx
**位置**：`jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/tab-expression.tsx`

**修改内容**：与 tab-custom-function-table.tsx 相同的修复逻辑

### 3. tab-decision-table.tsx
**位置**：`jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/tab-decision-table.tsx`

**修改内容**：与 tab-custom-function-table.tsx 相同的修复逻辑

### 4. tab-request.tsx
**位置**：`jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/tab-request.tsx`

**修改内容**：与 tab-custom-function-table.tsx 相同的修复逻辑

## 修复的关键点

### 1. 使用可选链操作符（Optional Chaining）
```typescript
result.trace?.[id]  // 而不是 result.trace[id]
```
- 如果 `trace` 是 `undefined` 或 `null`，返回 `undefined` 而不是报错
- 如果 `trace[id]` 不存在，返回 `undefined`

### 2. 使用空值合并操作符（Nullish Coalescing）
```typescript
(result.trace?.[id] as SimulationTrace<...>) ?? null
```
- 如果 `result.trace?.[id]` 是 `undefined` 或 `null`，返回 `null`
- 保持与 `otherwise(() => null)` 的一致性

### 3. 条件检查 inputData
```typescript
result.trace?.[id] ? getNodeData(id, { trace: result.trace, decisionGraph }) : null
```
- 只有当 `trace[id]` 存在时，才调用 `getNodeData`
- 避免传递不完整的数据给 `getNodeData` 函数

## 测试验证

### 构建测试
```bash
npm run build
```
✅ 构建成功，无错误

### 手动测试步骤

1. **创建孤立节点**
   - 在决策图中创建一个新节点（自定义函数、表达式、决策表或请求节点）
   - 不要将其连接到输入节点

2. **运行 Simulator**
   - 点击 Simulator 按钮
   - 验证 simulator 成功运行（孤立节点不会被执行）

3. **编辑孤立节点**
   - 立即点击孤立节点
   - 点击编辑按钮
   - ✅ 验证：不应该报错
   - ✅ 验证：编辑面板正常打开
   - ✅ 验证：没有调试信息显示（因为节点未被执行）

4. **多次重复测试**
   - 重复步骤 1-3 多次
   - ✅ 验证：每次都不应该报错

5. **测试正常节点**
   - 将节点连接到输入节点
   - 运行 Simulator
   - 编辑节点
   - ✅ 验证：调试信息正常显示

## 预期行为

### 修复前
- **孤立节点**：偶现报错 `Cannot read properties of undefined`
- **正常节点**：正常显示调试信息

### 修复后
- **孤立节点**：不报错，可以正常编辑，但没有调试信息（debug 为 undefined）
- **正常节点**：正常显示调试信息（行为不变）

## 影响评估

### ✅ 无影响的功能
- 正常节点的调试功能
- Simulator 的执行逻辑
- 节点的编辑功能
- 其他页面和组件

### ✅ 改进的功能
- 孤立节点的编辑体验（不再报错）
- 代码的健壮性（增加了空值检查）
- 用户体验（不会因为偶现错误而中断操作）

### ⚠️ 需要注意
- 孤立节点编辑时不会显示调试信息（这是预期行为）
- 如果用户期望看到调试信息，需要将节点连接到执行路径

## 技术债务

### 已解决
- ✅ 孤立节点的空值检查
- ✅ 4个文件的统一修复
- ✅ 类型安全（使用 TypeScript 的可选链和空值合并）

### 未来优化建议
1. **添加单元测试**
   - 测试孤立节点的 selector 逻辑
   - 测试 trace 不存在时的降级行为

2. **用户提示**
   - 可以考虑在编辑面板显示提示："此节点未被执行，无调试信息"
   - 但这需要修改 UI 组件，不在本次修复范围内

3. **代码重构**
   - 4个文件有相同的逻辑，可以考虑提取为公共函数
   - 但需要评估是否值得（每个文件的类型略有不同）

## 总结

这次修复解决了一个由**竞态条件**导致的偶现错误。通过在访问 `result.trace[id]` 时增加空值检查，确保了即使节点不在 trace 中（如孤立节点），代码也能优雅降级，不会报错。

修复后的代码更加健壮，用户体验更好，同时保持了原有功能的完整性。

---

**修复日期**：2026-01-20
**修复文件数**：4
**构建状态**：✅ 成功
**测试状态**：待手动测试
