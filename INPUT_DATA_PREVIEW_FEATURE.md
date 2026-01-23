# 输入数据预览功能实现总结

## 功能概述

实现了类似 n8n 的 Input JSON 效果，在节点编辑面板顶部显示上游节点的输出数据。运行 simulator 后，每个节点都可以看到来自上一个节点的输出数据。

## 实现方案

采用**方案 A**：在节点编辑面板的顶部添加一个独立的"输入数据预览"区域，类似 n8n 的 Input 面板。

### 方案特点
- ✅ 独立的可折叠面板
- ✅ 使用 Monaco Editor 展示 JSON 数据
- ✅ 支持明暗主题切换
- ✅ 默认展开，可以收起节省空间
- ✅ 只读模式，确保数据不被修改

## 实现的文件

### 1. 新增组件

#### [input-data-preview.tsx](jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/input-data-preview.tsx) (新文件)

**功能**：可折叠的输入数据预览组件

**核心特性**：
- 使用 Ant Design Card 组件作为容器
- 使用 Monaco Editor 展示 JSON 格式的数据
- 支持展开/收起功能
- 自动主题切换（跟随系统主题）
- 当没有数据时自动隐藏

**关键代码**：
```typescript
export const InputDataPreview: React.FC<InputDataPreviewProps> = ({
  data,
  collapsed: initialCollapsed = false
}) => {
  const { token } = theme.useToken();
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const jsonString = React.useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return '{}';
    }
  }, [data]);

  if (!data) {
    return null; // 没有数据时不显示
  }

  return (
    <Card
      size="small"
      title="输入数据预览 (来自上游节点的输出)"
      extra={<Button>展开/收起</Button>}
    >
      {!collapsed && (
        <Editor
          language="json"
          value={jsonString}
          options={monacoOptions}
          theme={token.colorBgContainer === '#ffffff' ? 'light' : 'vs-dark'}
        />
      )}
    </Card>
  );
};
```

### 2. 修改的文件

#### [tab-custom-function-table.tsx](jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/tab-custom-function-table.tsx)

**改动**：
1. 导入 `InputDataPreview` 组件
2. 在顶部添加预览面板

```typescript
return (
  <div style={{ height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
    <div style={{ padding: '8px 8px 0 8px' }}>
      <InputDataPreview data={inputData?.data} />
    </div>
    <CustomFunction
      // ... 原有 props
    />
  </div>
);
```

#### [tab-expression.tsx](jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/tab-expression.tsx)

**改动**：与 tab-custom-function-table.tsx 相同的模式

#### [tab-decision-table.tsx](jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/tab-decision-table.tsx)

**改动**：
1. 导入 `InputDataPreview` 组件
2. 使用 flex 布局确保决策表正确显示

```typescript
return (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <div style={{ padding: '8px 8px 0 8px' }}>
      <InputDataPreview data={inputData?.data} />
    </div>
    <div style={{ flex: 1, minHeight: 0 }}>
      <DecisionTable
        // ... 原有 props
      />
    </div>
  </div>
);
```

#### [tab-request.tsx](jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/tab-request.tsx)

**改动**：与 tab-expression.tsx 相同的模式

## 数据流

### 数据来源

输入数据来自 `inputData.data`，该数据通过以下流程获取：

1. **Simulator 执行**：
   - 用户点击运行 simulator
   - 后端执行决策图，生成 `result.trace`
   - `trace` 包含每个节点的输入和输出

2. **获取节点输入数据**：
```typescript
const { inputData } = useDecisionGraphState(
  ({ simulate, decisionGraph, viewConfig }) => ({
    inputData: match(simulate)
      .with({ result: P.nonNullable }, ({ result }) =>
        result.trace?.[id] ? getNodeData(id, { trace: result.trace, decisionGraph }) : null
      )
      .otherwise(() => null),
  }),
);
```

3. **getNodeData 函数**（从 `helpers/node-data.ts`）：
```typescript
export const getNodeData = (nodeId: string, { trace, decisionGraph }: NodeDataParams) => {
  const data = Object.values(trace).find((t) => t.id === nodeId)?.input;
  const $nodes = Object.fromEntries(
    Object.values(trace)
      .map((t) => {
        const node = decisionGraph.nodes.find((n) => n.id === t.id);
        if (!node || node.type === 'outputNode') {
          return null;
        }
        return [t.name, t.output];
      })
      .filter((s) => !!s),
  );

  return { data, $nodes };
};
```

**关键点**：
- `data`：当前节点的输入数据（即上游节点的输出）
- `$nodes`：所有已执行节点的输出映射

### 显示逻辑

```typescript
<InputDataPreview data={inputData?.data} />
```

- 如果 `inputData?.data` 存在 → 显示预览面板
- 如果 `inputData?.data` 为 `null` 或 `undefined` → 不显示面板

## 用户体验

### 使用流程

1. **创建决策图**：
   - 输入节点 → 节点A → 节点B → 输出节点

2. **运行 Simulator**：
   - 点击 Simulator 按钮
   - 输入测试数据
   - 运行执行

3. **查看输入数据**：
   - 点击节点A进行编辑
   - 顶部显示"输入数据预览"面板
   - 展示来自输入节点的输出数据
   - 点击节点B进行编辑
   - 顶部显示来自节点A的输出数据

### UI 特性

1. **可折叠面板**：
   - 默认展开状态
   - 点击"展开/收起"按钮切换状态
   - 收起后只显示标题栏，节省空间

2. **JSON 编辑器**：
   - 高度固定为 200px
   - 语法高亮
   - 自动格式化（2空格缩进）
   - 只读模式（不可编辑）

3. **主题适配**：
   - 自动检测系统主题
   - 亮色主题：使用 Monaco 的 'light' 主题
   - 暗色主题：使用 Monaco 的 'vs-dark' 主题

4. **边界处理**：
   - 没有数据时：不显示面板（返回 null）
   - 数据解析失败：显示 `{}`

## 技术细节

### 性能优化

1. **useMemo 缓存 JSON 字符串**：
```typescript
const jsonString = React.useMemo(() => {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return '{}';
  }
}, [data]);
```

2. **条件渲染**：
```typescript
if (!data) {
  return null;
}
```

### 样式处理

1. **容器样式**：
```typescript
<div style={{ padding: '8px 8px 0 8px' }}>
  <InputDataPreview data={inputData?.data} />
</div>
```

2. **Card 样式**：
```typescript
<Card
  size="small"
  styles={{ body: { padding: collapsed ? 8 : 0 } }}
/>
```

3. **编辑器容器**：
```typescript
<div style={{ height: 200, border: `1px solid ${token.colorBorder}` }}>
  <Editor />
</div>
```

### Monaco Editor 配置

```typescript
const monacoOptions: editor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,        // 自动布局
  contextmenu: false,           // 禁用右键菜单
  fontSize: 13,                 // 字体大小
  fontFamily: 'var(--mono-font-family)', // 等宽字体
  tabSize: 2,                   // Tab 大小
  minimap: { enabled: false },  // 禁用小地图
  overviewRulerBorder: false,   // 禁用概览边框
  scrollbar: {                  // 滚动条样式
    verticalSliderSize: 4,
    verticalScrollbarSize: 4,
    horizontalScrollbarSize: 4,
    horizontalSliderSize: 4,
  },
  lineNumbers: 'off',           // 不显示行号
  folding: false,               // 禁用折叠
  glyphMargin: false,           // 禁用字形边距
  lineDecorationsWidth: 0,      // 行装饰宽度为0
  lineNumbersMinChars: 0,       // 行号最小字符数为0
  readOnly: true,               // 只读模式
};
```

## 影响范围

### ✅ 修改的节点类型
1. **自定义函数节点** (CustomFunctionTable)
2. **表达式节点** (Expression)
3. **决策表节点** (DecisionTable)
4. **请求节点** (Request)

### ⚠️ 未修改的节点类型
- **输入节点** (Input)：不需要显示输入数据
- **输出节点** (Output)：通常不需要编辑
- **Switch 节点**：如果需要，可以后续添加
- **Function 节点**：如果需要，可以后续添加

### 📦 无影响的部分
- Simulator 执行逻辑
- 数据流计算逻辑
- 其他页面和组件
- 后端 API

## 构建状态

✅ **构建成功**，无错误

```bash
npm run build
# ✓ 12028 modules transformed.
# ✓ built in 14.31s
```

## 测试建议

### 手动测试步骤

1. **基础功能测试**：
   - 创建：输入节点 → 表达式节点 → 输出节点
   - 在输入节点配置测试数据：`{ "name": "test", "value": 123 }`
   - 运行 Simulator
   - 点击表达式节点编辑
   - ✅ 验证：顶部显示输入数据预览面板
   - ✅ 验证：数据与输入节点配置一致

2. **折叠功能测试**：
   - 点击"收起"按钮
   - ✅ 验证：面板收起，只显示标题
   - 点击"展开"按钮
   - ✅ 验证：面板展开，显示 JSON 数据

3. **多节点链路测试**：
   - 创建：输入节点 → 节点A → 节点B → 输出节点
   - 节点A 配置表达式：`{ "result": data.value * 2 }`
   - 输入节点数据：`{ "value": 10 }`
   - 运行 Simulator
   - 点击节点B编辑
   - ✅ 验证：显示节点A的输出 `{ "result": 20 }`

4. **空数据测试**：
   - 创建孤立节点（未运行 simulator）
   - 点击编辑
   - ✅ 验证：不显示输入数据预览面板

5. **主题切换测试**：
   - 切换系统亮/暗主题
   - ✅ 验证：JSON 编辑器主题自动切换

6. **不同节点类型测试**：
   - 测试自定义函数节点
   - 测试表达式节点
   - 测试决策表节点
   - 测试请求节点
   - ✅ 验证：所有节点都正确显示输入数据

## 后续优化建议

### 功能增强

1. **复制功能**：
   - 在面板右上角添加"复制"按钮
   - 一键复制 JSON 数据到剪贴板

2. **数据路径导航**：
   - 显示数据来源节点的名称
   - 点击可跳转到源节点

3. **多种展示模式**：
   - 树形视图
   - 表格视图
   - 原始 JSON 视图

4. **搜索和过滤**：
   - 在大数据中搜索关键字
   - 按字段路径过滤

### UI 优化

1. **可调整高度**：
   - 允许用户拖动调整编辑器高度
   - 记住用户偏好

2. **记住折叠状态**：
   - 使用 localStorage 记住用户的折叠偏好
   - 下次打开时恢复

3. **更多节点类型支持**：
   - Switch 节点
   - Function 节点
   - HTTP Request 节点

### 性能优化

1. **虚拟滚动**：
   - 对于超大 JSON 数据，使用虚拟滚动

2. **懒加载**：
   - Monaco Editor 按需加载

## 总结

成功实现了类似 n8n 的输入数据预览功能，为用户提供了便捷的调试体验。该功能：

✅ 在4个主要节点类型中集成
✅ 使用专业的 JSON 编辑器展示
✅ 支持展开/收起，节省空间
✅ 自动主题切换
✅ 构建成功，无错误

用户现在可以在编辑节点时直接查看上游节点的输出数据，大大提升了决策图的调试效率。

---

**实现日期**：2026-01-20
**新增文件数**：1
**修改文件数**：4
**构建状态**：✅ 成功
**测试状态**：待手动测试
