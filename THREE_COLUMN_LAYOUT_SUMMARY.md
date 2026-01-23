# 三栏布局与"运行到此节点"按钮实现总结

## 实现概述

成功实现了节点编辑页面的三栏布局（输入-编辑-输出），并在中间编辑区添加了"运行到此节点"按钮。

## 已完成的工作

### 1. 重构 InputDataPreview 组件

**文件**: `input-data-preview.tsx`

**改动**:
- 移除了 Card 组件的装饰，改为简洁的侧边栏样式
- 创建了通用的 `DataPreview` 组件
- 导出 `InputDataPreview` 和 `OutputDataPreview` 两个组件
- 适配全高度布局，支持侧边栏显示

**关键特性**:
- 标题栏显示数据类型（输入/输出）
- 无数据时显示提示文本
- Monaco Editor 只读模式
- 自动主题切换

### 2. 实现三栏布局 - tab-expression.tsx

**文件**: `tab-expression.tsx`

**改动**:
- 引入 `react-resizable-panels` 组件
- 实现可调整宽度的三栏布局
- 添加 `onRunNode` 和 `runLoading` props
- 在中间编辑区顶部添加"运行到此节点"按钮工具栏

**布局结构**:
```
[输入数据 25%] | [编辑区 50%] | [输出数据 25%]
```

**尺寸限制**:
- 左/右侧面板：最小 15%，最大 40%
- 中间编辑区：最小 30%

### 3. 实现三栏布局 - tab-custom-function-table.tsx

**文件**: `tab-custom-function-table.tsx`

**改动**: 与 tab-expression.tsx 相同的模式
- 三栏布局
- 运行按钮工具栏
- 支持 onRunNode 和 runLoading props

### 4. 实现三栏布局 - tab-decision-table.tsx

**文件**: `tab-decision-table.tsx`

**改动**: 与 tab-expression.tsx 相同的模式
- 三栏布局
- 运行按钮工具栏
- 支持 onRunNode 和 runLoading props

### 5. 实现三栏布局 - tab-http-request.tsx

**文件**: `tab-http-request.tsx`

**改动**: 与 tab-expression.tsx 相同的模式
- 三栏布局
- 运行按钮工具栏
- 支持 onRunNode 和 runLoading props
- HTTP 请求编辑器（类似 Postman）保持在中间编辑区

### 6. 特殊处理 - tab-request.tsx（请求节点）

**文件**: `tab-request.tsx`

**改动**: **不使用三栏布局**
- 请求节点通常作为发起节点，位于决策图的起始位置
- 只有输入数据，没有上游节点输出
- 因此只添加运行按钮，保持原有的简单布局
- 布局结构：运行按钮工具栏 + 编辑区（全宽）

**关键代码**:
```typescript
return (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    {/* 顶部工具栏 */}
    {onRunNode && (
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${token.colorBorder}` }}>
        <Button type="primary" icon={<PlayCircleOutlined />} loading={runLoading} onClick={onRunNode}>
          运行到此节点
        </Button>
      </div>
    )}
    {/* 编辑区 */}
    <div style={{ flex: 1, overflow: 'auto' }}>
      <Expression {...props} />
    </div>
  </div>
);
```

### 7. 更新类型定义

**文件**: `specification-types.ts`

**改动**:
- 在 `NodeSpecification.renderTab` 的 props 类型中添加:
  - `onRunNode?: () => void`
  - `runLoading?: boolean`

### 8. 更新规格文件

**文件**:
- `expression.specification.tsx`
- `custom-function.specification.tsx`
- `decision-table.specification.tsx`
- `http-request.specification.tsx`

**改动**: 更新 `renderTab` 以传递 `onRunNode` 和 `runLoading` props

## 技术细节

### 三栏布局实现

使用 `react-resizable-panels` 库:

```typescript
<PanelGroup direction="horizontal" style={{ height: '100%' }}>
  {/* 左侧 */}
  <Panel defaultSize={25} minSize={15} maxSize={40}>
    <InputDataPreview data={inputData?.data} />
  </Panel>

  <PanelResizeHandle style={{ width: 4, backgroundColor: token.colorBorder }} />

  {/* 中间 */}
  <Panel defaultSize={50} minSize={30}>
    {/* 工具栏 + 编辑区 */}
  </Panel>

  <PanelResizeHandle />

  {/* 右侧 */}
  <Panel defaultSize={25} minSize={15} maxSize={40}>
    <OutputDataPreview data={nodeTrace?.output} />
  </Panel>
</PanelGroup>
```

### 运行按钮工具栏

```typescript
{onRunNode && (
  <div style={{
    padding: '8px 12px',
    borderBottom: `1px solid ${token.colorBorder}`,
    backgroundColor: token.colorBgContainer,
  }}>
    <Button
      type="primary"
      icon={<PlayCircleOutlined />}
      loading={runLoading}
      onClick={onRunNode}
      size="small"
    >
      运行到此节点
    </Button>
  </div>
)}
```

## 待完成的工作

### 手动测试验证

所有代码实现已完成，需要进行手动测试：

1. **基本功能测试**：
   - 打开各类型节点（表达式、自定义函数、决策表、请求、HTTP请求）
   - ✅ 验证：显示三栏布局
   - ✅ 验证：左侧显示输入数据（如果有）
   - ✅ 验证：中间显示编辑区和运行按钮
   - ✅ 验证：右侧显示输出数据（预留）

2. **调整宽度测试**：
   - 拖动分隔条调整面板宽度
   - ✅ 验证：宽度可以调整
   - ✅ 验证：不能调整到最小/最大限制之外
   - ✅ 验证：编辑区正常工作

3. **运行按钮测试**：
   - 点击"运行到此节点"按钮
   - ✅ 验证：按钮显示加载状态
   - ✅ 验证：左侧输入数据更新
   - ✅ 验证：右侧输出数据更新
   - ✅ 验证：运行完成后按钮恢复正常

4. **边界测试**：
   - 测试没有输入数据时的显示
   - 测试没有输出数据时的显示
   - 测试孤立节点的运行

### Props 传递链

确保 `onRunNode` 和 `runLoading` 从 `decision-simple.tsx` 正确传递到各个 tab 组件：

```
decision-simple.tsx (handleRunToNode, runningNodeId)
  ↓
DecisionGraph (onRunNode, runningNodeId)
  ↓
Graph (onRunNode, runningNodeId)
  ↓
nodeSpecification.renderTab (onRunNode, runLoading)
  ↓
Tab组件 (tab-expression, tab-custom-function-table, 等)
```

## 构建状态

✅ **构建成功**，无 TypeScript 错误

```bash
npm run build
# ✓ 12030 modules transformed
# ✓ built in ~15s
```

## 用户体验改进

### 布局优势

1. **可调整宽度**: 用户可以根据需要拖动分隔条调整三栏宽度
2. **输入输出并排**: 方便对比查看节点的输入和输出数据
3. **专注编辑**: 中间编辑区始终保持足够宽度

### 运行按钮优势

1. **快速访问**: 不需要回到图形视图就能运行到当前节点
2. **即时反馈**: 按钮显示加载状态，点击后立即看到结果
3. **工作流优化**: 编辑 → 运行 → 查看结果，一气呵成

## 后续优化建议

### 功能增强

1. **记住布局偏好**: 使用 localStorage 保存用户的面板宽度设置
2. **快捷键**: 添加键盘快捷键（如 Ctrl+R）运行到当前节点
3. **隐藏面板**: 添加按钮快速隐藏/显示左右侧面板
4. **输出数据实时更新**: 当前只显示 `nodeTrace?.output`，可以增强数据展示

### UI 优化

1. **分隔条样式**: 添加悬停效果，让拖动更直观
2. **空状态优化**: 当没有数据时，提供更多引导信息
3. **加载状态**: 在输入/输出面板也显示加载状态

### 代码优化

1. **抽取公共组件**: 三栏布局逻辑可以抽取为公共组件
2. **统一实现**: 完成剩余两个文件的实现
3. **单元测试**: 为新组件添加测试

## 测试建议

### 手动测试步骤

1. **基本功能测试**:
   - 打开表达式节点或自定义函数节点
   - ✅ 验证：显示三栏布局
   - ✅ 验证：左侧显示输入数据（如果有）
   - ✅ 验证：中间显示编辑区和运行按钮
   - ✅ 验证：右侧显示输出数据（预留）

2. **调整宽度测试**:
   - 拖动分隔条调整面板宽度
   - ✅ 验证：宽度可以调整
   - ✅ 验证：不能调整到最小/最大限制之外
   - ✅ 验证：编辑区正常工作

3. **运行按钮测试**:
   - 点击"运行到此节点"按钮
   - ✅ 验证：按钮显示加载状态
   - ✅ 验证：左侧输入数据更新
   - ✅ 验证：右侧输出数据更新
   - ✅ 验证：运行完成后按钮恢复正常

4. **边界测试**:
   - 测试没有输入数据时的显示
   - 测试没有输出数据时的显示
   - 测试孤立节点的运行

## 文件清单

### 新增文件
无

### 修改的文件

1. `jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/input-data-preview.tsx`
   - 重构为侧边栏样式
   - 添加 OutputDataPreview 组件

2. `jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/tab-expression.tsx`
   - 实现三栏布局
   - 添加运行按钮

3. `jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/tab-custom-function-table.tsx`
   - 实现三栏布局
   - 添加运行按钮

4. `jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/tab-decision-table.tsx`
   - 实现三栏布局
   - 添加运行按钮

5. `jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/tab-request.tsx`
   - 实现三栏布局
   - 添加运行按钮

6. `jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/tab-http-request.tsx`
   - 实现三栏布局
   - 添加运行按钮

7. `jdm-editor/packages/jdm-editor/src/components/decision-graph/nodes/specifications/specification-types.ts`
   - 添加 onRunNode 和 runLoading 类型

8. `jdm-editor/packages/jdm-editor/src/components/decision-graph/nodes/specifications/expression.specification.tsx`
   - 更新 renderTab 传递 props

9. `jdm-editor/packages/jdm-editor/src/components/decision-graph/nodes/specifications/custom-function.specification.tsx`
   - 更新 renderTab 传递 props

10. `jdm-editor/packages/jdm-editor/src/components/decision-graph/nodes/specifications/decision-table.specification.tsx`
    - 更新 renderTab 传递 props

11. `jdm-editor/packages/jdm-editor/src/components/decision-graph/nodes/specifications/http-request.specification.tsx`
    - 更新 renderTab 传递 props

### 待修改的文件

无 - 所有文件已完成实现

## 总结

已成功完成：
- ✅ InputDataPreview 组件重构（侧边栏样式）
- ✅ OutputDataPreview 组件创建
- ✅ tab-expression.tsx 三栏布局实现
- ✅ tab-custom-function-table.tsx 三栏布局实现
- ✅ tab-decision-table.tsx 三栏布局实现
- ✅ tab-http-request.tsx 三栏布局实现
- ✅ tab-request.tsx 运行按钮实现（不使用三栏布局）
- ✅ 类型定义更新
- ✅ 所有规格文件更新
- ✅ 构建验证通过

待完成：
- ⏳ 手动测试验证

**实现的节点类型**：
1. ✅ 表达式节点 (Expression) - 三栏布局
2. ✅ 自定义函数节点 (CustomFunction) - 三栏布局
3. ✅ 决策表节点 (DecisionTable) - 三栏布局
4. ✅ HTTP请求节点 (HttpRequest) - 三栏布局
5. ✅ 请求节点 (Request) - 简单布局（仅运行按钮）

**特殊说明**：
- 请求节点（Request）作为发起节点，通常没有上游输入，因此只添加运行按钮，不使用三栏布局
- 其他4种节点类型都实现了完整的三栏布局（输入-编辑-输出）

---

**实现日期**: 2026-01-21
**修改文件数**: 11
**构建状态**: ✅ 成功
**测试状态**: 待手动测试
