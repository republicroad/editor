# 字段插入功能设计文档

**设计日期**：2026-01-21
**功能概述**：为决策图编辑器添加字段拖拽、点击插入和智能补全功能，类似 n8n 的输入数据交互体验

---

## 一、整体架构

### 1.1 核心组件

#### FieldPicker 组件（字段选择器）
- 显示可用的输入数据字段树
- 支持展开/折叠嵌套对象
- 支持拖拽字段
- 支持点击插入字段

#### DraggableField 组件（可拖拽字段）
- 每个字段项都可以拖拽
- 显示字段类型图标（string、number、object、array）
- 支持点击复制字段路径

#### Monaco 编辑器增强
- 添加自定义自动补全提供器
- 处理拖拽事件，在光标位置插入字段路径
- 支持 `data.` 和 `$nodes.` 两种格式的智能提示

### 1.2 数据结构

```typescript
// 字段信息
interface FieldInfo {
  path: string;              // 字段路径，如 'data.user.name'
  nodePath: string;          // 节点路径，如 '$nodes.NodeA.user.name'
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  value?: any;               // 字段值（用于预览）
  children?: FieldInfo[];    // 嵌套字段
}

// 可用节点数据
interface AvailableNodeData {
  nodeId: string;
  nodeName: string;
  fields: FieldInfo[];
}
```

---

## 二、UI 交互设计

### 2.1 输入数据预览面板增强

在现有的 `InputDataPreview` 组件基础上添加：

#### 字段树视图
- 将 JSON 编辑器改为可交互的树形结构
- 每个字段旁边显示类型图标和拖拽手柄
- 支持展开/折叠嵌套对象和数组
- 显示字段值预览（截断长文本）

#### 双模式切换
- 顶部添加切换按钮：「树形视图」/「JSON 视图」
- 树形视图：用于拖拽和点击插入
- JSON 视图：保持现有的 Monaco 只读编辑器

#### 字段操作
- 鼠标悬停显示完整路径提示
- 点击字段：在编辑器光标位置插入 `data.fieldName`
- 拖拽字段：拖到编辑器时插入路径
- 右键菜单：复制为 `data.` 格式 / 复制为 `$nodes.` 格式

### 2.2 节点选择器

在输入数据预览面板顶部添加下拉选择器：
- 默认显示「当前输入」（上游节点输出）
- 可切换到「所有节点」，显示所有已执行节点的输出
- 选择不同节点时，字段路径自动使用 `$nodes.NodeName.` 格式

---

## 三、Monaco 编辑器集成

### 3.1 拖拽功能实现

#### 拖拽数据传递
```typescript
// 在 DraggableField 组件中
const handleDragStart = (e: DragEvent, fieldInfo: FieldInfo) => {
  e.dataTransfer.setData('application/json', JSON.stringify({
    path: fieldInfo.path,           // data.user.name
    nodePath: fieldInfo.nodePath,   // $nodes.NodeA.user.name
    type: fieldInfo.type
  }));
  e.dataTransfer.effectAllowed = 'copy';
};
```

#### Monaco 编辑器接收拖拽
```typescript
// 监听 drop 事件
editor.onDidDrop((e) => {
  const data = e.event.dataTransfer.getData('application/json');
  const fieldInfo = JSON.parse(data);

  // 在拖拽位置插入字段路径
  const position = e.position;
  editor.executeEdits('', [{
    range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
    text: fieldInfo.path  // 或根据上下文选择 nodePath
  }]);
});
```

### 3.2 智能自动补全

#### 注册自动补全提供器
- 当用户输入 `data.` 时，显示当前输入数据的所有字段
- 当用户输入 `$nodes.` 时，显示所有可用节点列表
- 当用户输入 `$nodes.NodeName.` 时，显示该节点的所有输出字段
- 支持嵌套路径补全，如 `data.user.` 显示 user 对象的子字段

#### 补全项信息
```typescript
{
  label: 'name',
  kind: monaco.languages.CompletionItemKind.Property,
  detail: 'string',          // 显示类型
  documentation: '"John"',    // 显示当前值
  insertText: 'name'
}
```

---

## 四、不同节点类型的适配

### 4.1 表达式节点 (Expression)
- **适配方式**：直接增强 Monaco 编辑器
- **插入格式**：`data.fieldName` 或 `$nodes.NodeName.fieldName`
- **自动补全**：支持完整的 JavaScript 语法提示

### 4.2 自定义函数节点 (CustomFunction)
- **适配方式**：在代码编辑器中启用拖拽和自动补全
- **插入格式**：同表达式节点
- **特殊处理**：识别函数参数上下文，智能提示可用变量

### 4.3 决策表节点 (DecisionTable)
- **适配方式**：在输入/输出列配置的输入框中支持
- **插入格式**：优先使用 `data.fieldName`（简洁格式）
- **交互方式**：
  - 点击输入框时，自动弹出字段选择器浮层
  - 支持从字段选择器拖拽到输入框
  - 输入框内支持 `data.` 自动补全

### 4.4 HTTP 请求节点 (Request)
- **适配方式**：URL、Headers、Body 等字段支持变量插入
- **插入格式**：使用模板语法 `{{data.fieldName}}` 或 `{{$nodes.NodeName.fieldName}}`
- **特殊处理**：
  - 识别 JSON Body 编辑器，使用 Monaco 增强
  - 普通文本输入框，使用内联自动补全

### 4.5 统一的集成接口

创建一个 `useFieldInsertion` Hook：
```typescript
const useFieldInsertion = (editorRef, options) => {
  // 返回统一的方法
  return {
    insertField: (fieldPath: string) => void,
    enableDragDrop: () => void,
    registerAutoComplete: () => void
  };
};
```

每个节点只需要调用这个 Hook，就能获得完整的字段插入能力。

---

## 五、错误处理和边界情况

### 5.1 数据可用性处理
- **未运行 Simulator**：输入数据预览面板显示提示「请先运行 Simulator 查看数据」
- **节点无输入数据**：显示「此节点暂无输入数据」
- **数据解析失败**：降级显示原始 JSON，禁用字段拖拽功能

### 5.2 字段路径处理
- **特殊字符**：字段名包含空格或特殊字符时，使用 `data['field name']` 格式
- **数组索引**：支持 `data.items[0].name` 格式
- **深层嵌套**：限制显示层级（默认5层），超过时显示「...」可展开

### 5.3 性能优化
- **大数据集**：超过1000个字段时，使用虚拟滚动渲染树形视图
- **防抖处理**：自动补全输入延迟200ms触发
- **缓存机制**：缓存已解析的字段树结构，避免重复计算

### 5.4 用户体验细节
- **拖拽反馈**：拖拽时显示半透明的字段路径预览
- **插入确认**：插入后短暂高亮显示插入的文本（500ms）
- **快捷键**：支持 `Ctrl+Space` 手动触发自动补全
- **撤销支持**：所有插入操作支持 `Ctrl+Z` 撤销

---

## 六、技术决策

### 6.1 为什么选择树形视图？
- 嵌套数据结构更直观
- 支持大数据集的按需加载
- 更容易实现拖拽交互

### 6.2 为什么支持两种路径格式？
- `data.`：简洁，适合引用直接上游数据
- `$nodes.`：明确，适合跨节点引用和复杂流程

### 6.3 为什么使用统一的 Hook？
- 减少代码重复
- 保证各节点行为一致
- 便于维护和扩展

---

## 七、实施优先级

### P0（第一阶段 - 核心功能）
1. 创建基础组件（FieldPicker、DraggableField）
2. 实现字段树解析和渲染
3. 实现基本拖拽功能
4. 在表达式节点中集成

### P1（第二阶段 - 功能完善）
5. 实现智能自动补全
6. 添加点击插入功能
7. 支持节点选择器
8. 在其他3种节点中集成

### P2（第三阶段 - 体验优化）
9. 添加双模式切换（树形/JSON）
10. 优化性能（虚拟滚动、缓存）
11. 添加快捷键和细节体验
12. 完善错误处理

---

## 八、设计总结

这个方案将提供：
- ✅ 三种交互方式：拖拽、点击插入、智能补全
- ✅ 两种路径格式：`data.` 和 `$nodes.`
- ✅ 四种节点支持：表达式、自定义函数、决策表、HTTP请求
- ✅ 完整的错误处理和性能优化

预期将显著提升用户在编辑节点时引用上游数据的效率，提供类似 n8n 的流畅体验。
