# 字段插入功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现字段拖拽、点击插入和智能补全功能，让用户在编辑节点时可以方便地引用上游数据

**Architecture:** 采用分层架构：(1) 字段解析层 - 将 JSON 数据解析为字段树结构；(2) UI 组件层 - 提供树形视图和拖拽交互；(3) 编辑器集成层 - 在 Monaco 编辑器中支持拖拽接收和自动补全

**Tech Stack:** React, TypeScript, Ant Design, Monaco Editor, react-resizable-panels

---

## 阶段一：核心基础设施 (P0)

### Task 1: 创建字段解析工具

**Files:**
- Create: `jdm-editor/packages/jdm-editor/src/helpers/field-parser.ts`
- Test: Manual verification in browser console

**Step 1: 创建字段类型定义**

在文件顶部添加类型定义：

```typescript
/**
 * 字段信息
 */
export interface FieldInfo {
  /** 字段名 */
  name: string;
  /** 字段路径，如 'data.user.name' */
  path: string;
  /** 节点路径，如 '$nodes.NodeA.user.name' */
  nodePath: string;
  /** 字段类型 */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'undefined';
  /** 字段值（用于预览） */
  value?: unknown;
  /** 嵌套字段 */
  children?: FieldInfo[];
  /** 数组元素示例（如果是数组类型） */
  arrayItemType?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'mixed';
}

/**
 * 字段解析选项
 */
export interface ParseFieldsOptions {
  /** 最大嵌套层级，默认 5 */
  maxDepth?: number;
  /** 是否包含值预览，默认 true */
  includeValues?: boolean;
  /** 路径前缀，用于 $nodes. 格式 */
  pathPrefix?: string;
}
```

**Step 2: 实现字段解析函数**

```typescript
/**
 * 获取值的类型
 */
function getValueType(value: unknown): FieldInfo['type'] {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value as FieldInfo['type'];
}

/**
 * 获取数组元素类型
 */
function getArrayItemType(arr: unknown[]): FieldInfo['arrayItemType'] {
  if (arr.length === 0) return 'undefined';

  const types = new Set(arr.map(item => getValueType(item)));
  if (types.size === 1) {
    return Array.from(types)[0] as FieldInfo['arrayItemType'];
  }
  return 'mixed';
}

/**
 * 处理特殊字符的字段名
 * 如果字段名包含特殊字符，返回 ['fieldName'] 格式
 */
function escapeFieldName(fieldName: string): string {
  // 检查是否需要转义：包含空格、特殊字符或以数字开头
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(fieldName)) {
    return `.${fieldName}`;
  }
  return `['${fieldName}']`;
}

/**
 * 解析 JSON 数据为字段树结构
 */
export function parseFields(
  data: unknown,
  options: ParseFieldsOptions = {}
): FieldInfo[] {
  const {
    maxDepth = 5,
    includeValues = true,
    pathPrefix = 'data'
  } = options;

  function parse(
    value: unknown,
    name: string,
    parentPath: string,
    depth: number
  ): FieldInfo | null {
    if (depth > maxDepth) {
      return null;
    }

    const type = getValueType(value);
    const fieldPath = parentPath + escapeFieldName(name);

    const field: FieldInfo = {
      name,
      path: fieldPath,
      nodePath: fieldPath.replace(/^data/, pathPrefix),
      type,
    };

    if (includeValues && value !== undefined) {
      // 截断长字符串
      if (typeof value === 'string' && value.length > 50) {
        field.value = value.substring(0, 50) + '...';
      } else if (type === 'object' || type === 'array') {
        field.value = undefined; // 复杂类型不显示值
      } else {
        field.value = value;
      }
    }

    // 处理对象
    if (type === 'object' && value !== null && depth < maxDepth) {
      const obj = value as Record<string, unknown>;
      field.children = Object.keys(obj)
        .map(key => parse(obj[key], key, fieldPath, depth + 1))
        .filter((f): f is FieldInfo => f !== null);
    }

    // 处理数组
    if (type === 'array' && depth < maxDepth) {
      const arr = value as unknown[];
      field.arrayItemType = getArrayItemType(arr);

      // 只展示第一个元素的结构
      if (arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null) {
        field.children = Object.keys(arr[0] as Record<string, unknown>)
          .map(key => parse((arr[0] as Record<string, unknown>)[key], key, `${fieldPath}[0]`, depth + 1))
          .filter((f): f is FieldInfo => f !== null);
      }
    }

    return field;
  }

  if (data === null || data === undefined) {
    return [];
  }

  if (typeof data !== 'object') {
    return [];
  }

  const obj = data as Record<string, unknown>;
  return Object.keys(obj)
    .map(key => parse(obj[key], key, pathPrefix, 0))
    .filter((f): f is FieldInfo => f !== null);
}

/**
 * 扁平化字段树，用于自动补全
 */
export function flattenFields(fields: FieldInfo[]): FieldInfo[] {
  const result: FieldInfo[] = [];

  function traverse(field: FieldInfo) {
    result.push(field);
    if (field.children) {
      field.children.forEach(traverse);
    }
  }

  fields.forEach(traverse);
  return result;
}
```

**Step 3: 测试字段解析**

在浏览器 console 测试：

```javascript
const testData = {
  user: {
    name: 'John',
    age: 30,
    tags: ['admin', 'user']
  },
  items: [
    { id: 1, title: 'Item 1' },
    { id: 2, title: 'Item 2' }
  ]
};

const fields = parseFields(testData);
console.log(fields);
```

Expected: 返回包含 user 和 items 的字段树，正确识别类型和嵌套结构

**Step 4: Commit**

```bash
git add jdm-editor/packages/jdm-editor/src/helpers/field-parser.ts
git commit -m "feat: add field parser utility for extracting field info from JSON"
```

---

### Task 2: 创建字段树视图组件

**Files:**
- Create: `jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/field-tree-view.tsx`
- Create: `jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/field-tree-view.scss`

**Step 1: 创建字段项组件**

```typescript
import {
  CaretDownOutlined,
  CaretRightOutlined,
  NumberOutlined,
  FontSizeOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  UnorderedListOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { Tooltip, Typography, theme } from 'antd';
import React, { useState } from 'react';
import type { FieldInfo } from '../../../helpers/field-parser';
import './field-tree-view.scss';

const { Text } = Typography;

/**
 * 获取字段类型图标
 */
const getTypeIcon = (type: FieldInfo['type']) => {
  switch (type) {
    case 'string': return <FontSizeOutlined />;
    case 'number': return <NumberOutlined />;
    case 'boolean': return <CheckSquareOutlined />;
    case 'array': return <UnorderedListOutlined />;
    case 'object': return <DatabaseOutlined />;
    default: return <FileTextOutlined />;
  }
};

/**
 * 格式化显示值
 */
const formatValue = (value: unknown, type: FieldInfo['type']): string => {
  if (value === undefined || value === null) return '';
  if (type === 'string') return `"${value}"`;
  return String(value);
};

export interface FieldTreeItemProps {
  field: FieldInfo;
  depth: number;
  onFieldClick?: (field: FieldInfo) => void;
  onFieldDragStart?: (field: FieldInfo, e: React.DragEvent) => void;
}

export const FieldTreeItem: React.FC<FieldTreeItemProps> = ({
  field,
  depth,
  onFieldClick,
  onFieldDragStart
}) => {
  const { token } = theme.useToken();
  const [expanded, setExpanded] = useState(depth < 2); // 默认展开前2层

  const hasChildren = field.children && field.children.length > 0;
  const isExpandable = hasChildren || field.type === 'array' || field.type === 'object';

  const handleClick = () => {
    if (!isExpandable) {
      // 叶子节点：触发点击插入
      onFieldClick?.(field);
    } else {
      // 容器节点：切换展开状态
      setExpanded(!expanded);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    onFieldDragStart?.(field, e);
  };

  return (
    <div className="field-tree-item">
      <div
        className="field-tree-item__content"
        style={{
          paddingLeft: depth * 16 + 8,
          cursor: isExpandable ? 'pointer' : 'grab',
          backgroundColor: 'transparent'
        }}
        onClick={handleClick}
        draggable={!isExpandable}
        onDragStart={handleDragStart}
      >
        {/* 展开/收起图标 */}
        <span className="field-tree-item__expand-icon" style={{ width: 16, display: 'inline-block' }}>
          {isExpandable && (
            expanded ? <CaretDownOutlined /> : <CaretRightOutlined />
          )}
        </span>

        {/* 类型图标 */}
        <span className="field-tree-item__type-icon" style={{ color: token.colorTextSecondary, marginRight: 8 }}>
          {getTypeIcon(field.type)}
        </span>

        {/* 字段名 */}
        <Tooltip title={field.path}>
          <Text strong style={{ marginRight: 8 }}>{field.name}</Text>
        </Tooltip>

        {/* 类型标签 */}
        <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>
          {field.type}
        </Text>

        {/* 值预览 */}
        {field.value !== undefined && (
          <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
            {formatValue(field.value, field.type)}
          </Text>
        )}

        {/* 数组类型提示 */}
        {field.type === 'array' && field.arrayItemType && (
          <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
            ({field.arrayItemType}[])
          </Text>
        )}
      </div>

      {/* 子字段 */}
      {expanded && hasChildren && (
        <div className="field-tree-item__children">
          {field.children!.map((child, index) => (
            <FieldTreeItem
              key={`${child.path}-${index}`}
              field={child}
              depth={depth + 1}
              onFieldClick={onFieldClick}
              onFieldDragStart={onFieldDragStart}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

**Step 2: 创建字段树视图容器**

```typescript
export interface FieldTreeViewProps {
  fields: FieldInfo[];
  onFieldClick?: (field: FieldInfo) => void;
  onFieldDragStart?: (field: FieldInfo, e: React.DragEvent) => void;
  emptyText?: string;
}

export const FieldTreeView: React.FC<FieldTreeViewProps> = ({
  fields,
  onFieldClick,
  onFieldDragStart,
  emptyText = '暂无字段'
}) => {
  const { token } = theme.useToken();

  if (!fields || fields.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: token.colorTextSecondary
        }}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div className="field-tree-view" style={{ height: '100%', overflowY: 'auto' }}>
      {fields.map((field, index) => (
        <FieldTreeItem
          key={`${field.path}-${index}`}
          field={field}
          depth={0}
          onFieldClick={onFieldClick}
          onFieldDragStart={onFieldDragStart}
        />
      ))}
    </div>
  );
};
```

**Step 3: 创建样式文件**

```scss
// field-tree-view.scss
.field-tree-view {
  font-size: 13px;
  user-select: none;
}

.field-tree-item {
  &__content {
    padding: 4px 8px;
    transition: background-color 0.2s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    &:active {
      background-color: rgba(0, 0, 0, 0.08);
    }
  }

  &__expand-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &__type-icon {
    display: inline-flex;
    align-items: center;
  }

  &__children {
    animation: slideDown 0.2s ease-out;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Step 4: Commit**

```bash
git add jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/field-tree-view.tsx
git add jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/field-tree-view.scss
git commit -m "feat: add field tree view component for displaying data fields"
```

---

### Task 3: 增强 InputDataPreview 组件支持双模式

**Files:**
- Modify: `jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/input-data-preview.tsx`

**Step 1: 添加模式切换状态**

在 `DataPreview` 组件中添加：

```typescript
import { EyeOutlined, ApartmentOutlined } from '@ant-design/icons';
import { Segmented } from 'antd';
import { parseFields } from '../../../helpers/field-parser';
import { FieldTreeView } from './field-tree-view';

type ViewMode = 'tree' | 'json';

export type DataPreviewProps = {
  data: unknown;
  title: string;
  emptyText?: string;
  onFieldClick?: (fieldPath: string) => void;
  onFieldDragStart?: (fieldPath: string, e: React.DragEvent) => void;
};

export const DataPreview: React.FC<DataPreviewProps> = ({
  data,
  title,
  emptyText = '暂无数据',
  onFieldClick,
  onFieldDragStart
}) => {
  const { token } = theme.useToken();
  const [viewMode, setViewMode] = React.useState<ViewMode>('tree');

  const jsonString = React.useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return '{}';
    }
  }, [data]);

  const fields = React.useMemo(() => {
    if (!data) return [];
    return parseFields(data, { maxDepth: 5, includeValues: true });
  }, [data]);

  const handleFieldClick = (field: FieldInfo) => {
    onFieldClick?.(field.path);
  };

  const handleFieldDragStart = (field: FieldInfo, e: React.DragEvent) => {
    const dragData = {
      path: field.path,
      nodePath: field.nodePath,
      type: field.type
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';

    onFieldDragStart?.(field.path, e);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: token.colorBgContainer }}>
      {/* 标题栏 */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${token.colorBorder}`,
          backgroundColor: token.colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Text strong style={{ fontSize: 13 }}>
          {title}
        </Text>

        {data && (
          <Segmented
            size="small"
            value={viewMode}
            onChange={(value) => setViewMode(value as ViewMode)}
            options={[
              { label: '树形', value: 'tree', icon: <ApartmentOutlined /> },
              { label: 'JSON', value: 'json', icon: <EyeOutlined /> }
            ]}
          />
        )}
      </div>

      {/* 内容区 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {data ? (
          viewMode === 'tree' ? (
            <FieldTreeView
              fields={fields}
              onFieldClick={handleFieldClick}
              onFieldDragStart={handleFieldDragStart}
            />
          ) : (
            <Editor
              language="json"
              value={jsonString}
              options={monacoOptions}
              theme={token.colorBgContainer === '#ffffff' ? 'light' : 'vs-dark'}
            />
          )
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: token.colorTextSecondary,
            }}
          >
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
};
```

**Step 2: 更新导出的别名组件**

```typescript
export const InputDataPreview: React.FC<{
  data: unknown;
  onFieldClick?: (fieldPath: string) => void;
  onFieldDragStart?: (fieldPath: string, e: React.DragEvent) => void;
}> = ({ data, onFieldClick, onFieldDragStart }) => {
  return (
    <DataPreview
      data={data}
      title="输入数据"
      emptyText="运行 Simulator 后显示上游节点输出"
      onFieldClick={onFieldClick}
      onFieldDragStart={onFieldDragStart}
    />
  );
};
```

**Step 3: 在浏览器中测试**

1. 运行 `npm run dev`
2. 打开决策图编辑器
3. 运行 Simulator
4. 点击任一节点编辑
5. 验证：
   - 输入数据预览面板显示
   - 可以在「树形」和「JSON」模式之间切换
   - 树形模式显示字段层级结构
   - 可以展开/收起对象和数组

Expected: 所有验证项通过

**Step 4: Commit**

```bash
git add jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/input-data-preview.tsx
git commit -m "feat: add tree/json view mode toggle to input data preview"
```

---

### Task 4: 在表达式节点中集成字段点击插入

**Files:**
- Modify: `jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/tab-expression.tsx`
- Modify: `jdm-editor/packages/jdm-editor/src/components/expression/expression.tsx`

**Step 1: 在 tab-expression.tsx 中添加字段点击处理**

```typescript
import { message } from 'antd';

export const TabExpression: React.FC<TabExpressionProps> = ({ id, manager, onRunNode, runLoading }) => {
  const { token } = theme.useToken();
  const graphActions = useDecisionGraphActions();
  const expressionEditorRef = React.useRef<any>(null);

  // ... 现有代码 ...

  const handleFieldClick = (fieldPath: string) => {
    // 通过 ref 通知 Expression 组件插入字段
    if (expressionEditorRef.current?.insertField) {
      expressionEditorRef.current.insertField(fieldPath);
      message.success(`已插入: ${fieldPath}`);
    }
  };

  const handleFieldDragStart = (fieldPath: string, e: React.DragEvent) => {
    console.log('Drag start:', fieldPath);
  };

  return (
    <PanelGroup direction="horizontal" style={{ height: '100%' }}>
      {/* 左侧：输入数据预览 */}
      <Panel defaultSize={25} minSize={15} maxSize={40}>
        <InputDataPreview
          data={inputData?.data}
          onFieldClick={handleFieldClick}
          onFieldDragStart={handleFieldDragStart}
        />
      </Panel>

      <PanelResizeHandle style={{ width: 4, backgroundColor: token.colorBorder }} />

      {/* 中间：编辑区 + 运行按钮 */}
      <Panel defaultSize={50} minSize={30}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* ... 运行按钮代码 ... */}

          {/* 编辑区 */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <Expression
              ref={expressionEditorRef}
              value={content?.expressions}
              disabled={disabled}
              permission={(viewConfig?.enabled ? viewConfig?.permissions?.[id] : 'edit:full') as ExpressionPermission}
              manager={manager}
              debug={debug}
              onChange={(val) => {
                graphActions.updateNode(id, (draft) => {
                  draft.content.expressions = val;
                  return draft;
                });
              }}
            />
          </div>
        </div>
      </Panel>

      {/* ... 右侧输出预览 ... */}
    </PanelGroup>
  );
};
```

**Step 2: 在 Expression 组件中暴露 insertField 方法**

修改 `expression.tsx`:

```typescript
import { useImperativeHandle, forwardRef } from 'react';

export interface ExpressionRef {
  insertField: (fieldPath: string) => void;
}

export const Expression = forwardRef<ExpressionRef, ExpressionProps>(
  ({ manager, debug, hideCommandBar, ...props }, ref) => {
    const [_, setMounted] = useState(false);
    const container = useRef<HTMLDivElement>(null);
    const expressionStoreRaw = useExpressionStoreRaw();

    useImperativeHandle(ref, () => ({
      insertField: (fieldPath: string) => {
        // 获取当前激活的编辑器
        const state = expressionStoreRaw?.getState();
        const activeEditor = state?.activeEditor;

        if (activeEditor) {
          // 在光标位置插入字段路径
          const selection = activeEditor.getSelection();
          const range = selection || {
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 1
          };

          activeEditor.executeEdits('insert-field', [{
            range,
            text: fieldPath
          }]);

          // 聚焦编辑器
          activeEditor.focus();
        }
      }
    }), [expressionStoreRaw]);

    // ... 其余代码保持不变 ...
  }
);
```

**Step 3: 在 ExpressionStoreContext 中存储 activeEditor**

修改 `context/expression-store.context.ts`:

```typescript
export interface ExpressionStore {
  // ... 现有字段 ...
  activeEditor?: editor.IStandaloneCodeEditor;
}
```

在编辑器组件中设置 activeEditor（后续任务中实现）。

**Step 4: 在浏览器中测试**

1. 运行 Simulator
2. 点击表达式节点编辑
3. 在左侧输入数据预览中点击任一字段
4. 验证：字段路径插入到编辑器光标位置

Expected: 点击字段后，字段路径成功插入编辑器

**Step 5: Commit**

```bash
git add jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/tab-expression.tsx
git add jdm-editor/packages/jdm-editor/src/components/expression/expression.tsx
git commit -m "feat: support click-to-insert field path in expression editor"
```

---

## 阶段二：拖拽和自动补全 (P1)

### Task 5: 实现 Monaco 编辑器拖拽接收

**Files:**
- Create: `jdm-editor/packages/jdm-editor/src/components/expression/hooks/use-field-drop.ts`
- Modify: 表达式编辑器组件以使用 hook

**Step 1: 创建拖拽处理 Hook**

```typescript
import { useEffect } from 'react';
import type { editor } from 'monaco-editor';

export interface UseFieldDropOptions {
  onFieldDrop?: (fieldPath: string) => void;
}

export function useFieldDrop(
  editor: editor.IStandaloneCodeEditor | null,
  options: UseFieldDropOptions = {}
) {
  useEffect(() => {
    if (!editor) return;

    const domNode = editor.getDomNode();
    if (!domNode) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'copy';
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        const data = e.dataTransfer?.getData('application/json');
        if (!data) return;

        const fieldInfo = JSON.parse(data);
        const fieldPath = fieldInfo.path || '';

        // 获取鼠标位置对应的编辑器位置
        const position = editor.getTargetAtClientPoint(e.clientX, e.clientY);
        if (!position) return;

        // 在目标位置插入字段路径
        editor.executeEdits('drop-field', [{
          range: {
            startLineNumber: position.position.lineNumber,
            startColumn: position.position.column,
            endLineNumber: position.position.lineNumber,
            endColumn: position.position.column
          },
          text: fieldPath
        }]);

        // 移动光标到插入文本后
        const newColumn = position.position.column + fieldPath.length;
        editor.setPosition({
          lineNumber: position.position.lineNumber,
          column: newColumn
        });

        editor.focus();
        options.onFieldDrop?.(fieldPath);
      } catch (error) {
        console.error('Failed to handle field drop:', error);
      }
    };

    domNode.addEventListener('dragover', handleDragOver);
    domNode.addEventListener('drop', handleDrop);

    return () => {
      domNode.removeEventListener('dragover', handleDragOver);
      domNode.removeEventListener('drop', handleDrop);
    };
  }, [editor, options.onFieldDrop]);
}
```

**Step 2: 在表达式编辑器中使用**

找到表达式编辑器的 Monaco 编辑器实例，添加：

```typescript
import { useFieldDrop } from './hooks/use-field-drop';

// 在组件中
const [editor, setEditor] = useState<editor.IStandaloneCodeEditor | null>(null);

useFieldDrop(editor, {
  onFieldDrop: (fieldPath) => {
    console.log('Field dropped:', fieldPath);
  }
});

// 在 Editor 组件的 onMount 回调中
<Editor
  onMount={(ed) => {
    setEditor(ed);
    // ... 其他初始化代码
  }}
  // ... 其他 props
/>
```

**Step 3: 测试拖拽功能**

1. 运行 Simulator
2. 点击表达式节点编辑
3. 从左侧输入数据预览拖拽一个字段到编辑器
4. 验证：字段路径在拖拽释放位置插入

Expected: 拖拽成功插入字段路径

**Step 4: Commit**

```bash
git add jdm-editor/packages/jdm-editor/src/components/expression/hooks/use-field-drop.ts
git commit -m "feat: add drag-and-drop support for field insertion in Monaco editor"
```

---

### Task 6: 实现智能自动补全

**Files:**
- Create: `jdm-editor/packages/jdm-editor/src/components/expression/providers/field-completion-provider.ts`
- Modify: 编辑器初始化代码以注册 provider

**Step 1: 创建自动补全提供器**

```typescript
import * as monaco from 'monaco-editor';
import type { FieldInfo } from '../../../helpers/field-parser';
import { flattenFields } from '../../../helpers/field-parser';

export interface FieldCompletionProviderOptions {
  /** 当前输入数据字段 */
  inputFields: FieldInfo[];
  /** 所有节点数据 */
  nodesData?: Record<string, { name: string; fields: FieldInfo[] }>;
}

/**
 * 创建字段自动补全提供器
 */
export function createFieldCompletionProvider(
  options: FieldCompletionProviderOptions
): monaco.languages.CompletionItemProvider {
  const { inputFields, nodesData = {} } = options;

  return {
    triggerCharacters: ['.'],

    provideCompletionItems: (model, position) => {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      // 检查是否在输入 data.
      if (/\bdata\.$/.test(textUntilPosition)) {
        return {
          suggestions: createFieldSuggestions(inputFields, range)
        };
      }

      // 检查是否在输入 data.xxx.
      const dataPathMatch = textUntilPosition.match(/\bdata\.([\w.]+)\.$/);
      if (dataPathMatch) {
        const path = dataPathMatch[1];
        const nestedFields = findNestedFields(inputFields, path);
        return {
          suggestions: createFieldSuggestions(nestedFields, range)
        };
      }

      // 检查是否在输入 $nodes.
      if (/\$nodes\.$/.test(textUntilPosition)) {
        return {
          suggestions: createNodeSuggestions(nodesData, range)
        };
      }

      // 检查是否在输入 $nodes.NodeName.
      const nodePathMatch = textUntilPosition.match(/\$nodes\.([\w]+)\.$/);
      if (nodePathMatch) {
        const nodeName = nodePathMatch[1];
        const nodeFields = nodesData[nodeName]?.fields || [];
        return {
          suggestions: createFieldSuggestions(nodeFields, range)
        };
      }

      return { suggestions: [] };
    },
  };
}

/**
 * 创建字段建议项
 */
function createFieldSuggestions(
  fields: FieldInfo[],
  range: monaco.IRange
): monaco.languages.CompletionItem[] {
  return fields.map(field => ({
    label: field.name,
    kind: getCompletionItemKind(field.type),
    detail: field.type,
    documentation: field.value !== undefined ? String(field.value) : undefined,
    insertText: field.name,
    range,
  }));
}

/**
 * 创建节点建议项
 */
function createNodeSuggestions(
  nodesData: Record<string, { name: string; fields: FieldInfo[] }>,
  range: monaco.IRange
): monaco.languages.CompletionItem[] {
  return Object.entries(nodesData).map(([nodeId, node]) => ({
    label: node.name,
    kind: monaco.languages.CompletionItemKind.Module,
    detail: 'node',
    insertText: node.name,
    range,
  }));
}

/**
 * 查找嵌套字段
 */
function findNestedFields(fields: FieldInfo[], path: string): FieldInfo[] {
  const parts = path.split('.');
  let current = fields;

  for (const part of parts) {
    const field = current.find(f => f.name === part);
    if (!field || !field.children) {
      return [];
    }
    current = field.children;
  }

  return current;
}

/**
 * 获取补全项类型
 */
function getCompletionItemKind(type: FieldInfo['type']): monaco.languages.CompletionItemKind {
  switch (type) {
    case 'string':
      return monaco.languages.CompletionItemKind.Text;
    case 'number':
      return monaco.languages.CompletionItemKind.Value;
    case 'boolean':
      return monaco.languages.CompletionItemKind.Constant;
    case 'array':
      return monaco.languages.CompletionItemKind.Enum;
    case 'object':
      return monaco.languages.CompletionItemKind.Struct;
    default:
      return monaco.languages.CompletionItemKind.Property;
  }
}
```

**Step 2: 在编辑器初始化时注册提供器**

```typescript
import { createFieldCompletionProvider } from './providers/field-completion-provider';

// 在组件中
useEffect(() => {
  if (!editor || !inputFields) return;

  const provider = monaco.languages.registerCompletionItemProvider('javascript',
    createFieldCompletionProvider({
      inputFields,
      nodesData: {} // TODO: 传入所有节点数据
    })
  );

  return () => {
    provider.dispose();
  };
}, [editor, inputFields]);
```

**Step 3: 测试自动补全**

1. 在编辑器中输入 `data.`
2. 验证：显示当前输入数据的所有字段
3. 输入 `data.user.`（假设有 user 对象）
4. 验证：显示 user 对象的子字段
5. 按 Tab 或 Enter 选择建议
6. 验证：字段名正确插入

Expected: 所有自动补全功能正常工作

**Step 4: Commit**

```bash
git add jdm-editor/packages/jdm-editor/src/components/expression/providers/field-completion-provider.ts
git commit -m "feat: add intelligent field autocomplete for data. and $nodes. paths"
```

---

## 阶段三：其他节点支持和优化 (P2)

### Task 7: 在自定义函数节点中集成

**Files:**
- Modify: `jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/tab-custom-function-table.tsx`

**Step 1: 添加字段插入支持**

参照 Task 4 的实现方式，在自定义函数节点的编辑器中添加相同的字段点击和拖拽支持。

**Step 2: 测试并提交**

```bash
git add jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/tab-custom-function-table.tsx
git commit -m "feat: add field insertion support to custom function editor"
```

---

### Task 8: 在决策表节点中集成

**Files:**
- Modify: `jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/tab-decision-table.tsx`
- 可能需要修改决策表的输入框组件

**Step 1: 添加字段选择器浮层**

在决策表的输入/输出列配置中，当焦点在输入框时，显示字段选择器浮层。

**Step 2: 支持字段拖拽到输入框**

**Step 3: 测试并提交**

```bash
git commit -m "feat: add field selection support to decision table inputs"
```

---

### Task 9: 在 HTTP 请求节点中集成

**Files:**
- Modify: `jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/tab-request.tsx`

**Step 1: 在 URL、Headers、Body 字段中支持变量插入**

使用模板语法 `{{data.fieldName}}`。

**Step 2: 测试并提交**

```bash
git commit -m "feat: add template variable support to HTTP request node"
```

---

### Task 10: 添加节点选择器

**Files:**
- Modify: `jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/input-data-preview.tsx`

**Step 1: 添加节点选择下拉框**

在输入数据预览面板顶部添加下拉框，允许切换查看不同节点的输出数据。

**Step 2: 更新字段路径格式**

选择非当前输入节点时，字段路径使用 `$nodes.NodeName.` 格式。

**Step 3: 测试并提交**

```bash
git commit -m "feat: add node selector to view output from any executed node"
```

---

### Task 11: 性能优化 - 虚拟滚动

**Files:**
- Create: `jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/field-tree-view-virtualized.tsx`

**Step 1: 使用 react-window 实现虚拟滚动**

当字段数量超过 1000 时，使用虚拟滚动优化渲染性能。

**Step 2: 测试并提交**

```bash
git commit -m "perf: add virtual scrolling for large field lists"
```

---

### Task 12: UX 优化 - 拖拽反馈和高亮

**Files:**
- Modify: `jdm-editor/packages/jdm-editor/src/components/expression/hooks/use-field-drop.ts`
- Modify: 编辑器样式

**Step 1: 添加拖拽时的视觉反馈**

拖拽时显示半透明的字段路径预览。

**Step 2: 插入后高亮显示**

插入字段路径后，短暂高亮显示插入的文本（500ms）。

**Step 3: 测试并提交**

```bash
git commit -m "feat: add visual feedback for drag-drop and insertion"
```

---

## 测试清单

- [ ] 字段解析正确处理各种数据类型
- [ ] 树形视图正确显示嵌套结构
- [ ] 树形/JSON 模式切换正常
- [ ] 点击字段成功插入到编辑器
- [ ] 拖拽字段成功插入到编辑器
- [ ] 输入 `data.` 显示自动补全
- [ ] 输入 `$nodes.` 显示节点列表
- [ ] 嵌套路径自动补全正常
- [ ] 特殊字符字段名正确转义
- [ ] 数组字段显示正确
- [ ] 在所有4种节点类型中功能正常
- [ ] 大数据集性能良好
- [ ] 错误情况有合适的降级处理

---

## 技术注意事项

1. **类型安全**：所有新增代码都要有完整的 TypeScript 类型定义
2. **性能**：使用 useMemo 缓存字段解析结果
3. **兼容性**：保持与现有功能的向后兼容
4. **错误处理**：优雅处理边界情况和错误
5. **测试**：每个 Task 完成后都要在浏览器中测试

---

## 实施顺序

建议按照以下顺序实施：

**第一天**：Task 1-3（基础设施）
**第二天**：Task 4-6（核心功能）
**第三天**：Task 7-9（其他节点）
**第四天**：Task 10-12（优化）

总预计时间：4天
