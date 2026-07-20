# API 参考文档

## 1. 后端 API

### 1.1 健康检查

```
GET /api/health
```

**响应**:
- 状态码: `200 OK`
- 响应体: `"healthy"`

---

### 1.2 决策模拟执行

```
POST /api/simulate
Content-Type: application/json
```

**请求体**:

```json
{
  "context": {
    "user": {
      "age": 25,
      "country": "CN"
    }
  },
  "content": {
    "contentType": "application/vnd.gorules.decision",
    "nodes": [...],
    "edges": [...]
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `context` | `Value` | 输入上下文数据 |
| `content` | `DecisionContent` | JDM 决策图定义 |

**响应体**:

```json
{
  "result": { ... },
  "trace": { ... },
  "performance": "1.2ms"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `result` | `Value` | 执行结果 |
| `trace` | `Value` | 执行轨迹（可选） |
| `performance` | `string` | 执行耗时 |

**错误响应**:

```json
{
  "error": "Error message",
  "trace": { ... }
}
```

**限制**:
- 请求体最大: 16MB
- 最大执行深度: 10 层

---

## 2. 前端组件 API

### 2.1 DecisionGraph

核心图编辑器组件。

```tsx
import { DecisionGraph, DecisionGraphRef } from '@gorules/jdm-editor';

<DecisionGraph
  ref={graphRef}
  value={graph}
  onChange={setGraph}
  mode="business"
  customNodes={customNodes}
  simulate={simulationResult}
  panels={[...]}
/>
```

**Props**:

| 属性 | 类型 | 说明 |
|------|------|------|
| `value` | `DecisionGraphType` | 图数据（nodes + edges） |
| `onChange` | `(value: DecisionGraphType) => void` | 数据变更回调 |
| `mode` | `'dev' \| 'business'` | UI 模式 |
| `customNodes` | `JdmNode[]` | 自定义节点类型 |
| `simulate` | `Simulation` | 模拟执行结果 |
| `panels` | `Panel[]` | 侧面板配置 |
| `reactFlowProOptions` | `object` | React Flow 配置 |

**Ref 方法**:

| 方法 | 说明 |
|------|------|
| `fitView()` | 适应视图 |
| `zoomIn()` | 放大 |
| `zoomOut()` | 缩小 |

---

### 2.2 DecisionTable

决策表编辑器组件。

```tsx
import { DecisionTable } from '@gorules/jdm-editor';

<DecisionTable
  id={nodeId}
  value={tableData}
  onChange={setTableData}
/>
```

**Props**:

| 属性 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 节点 ID |
| `value` | `DecisionTableType` | 表格数据 |
| `onChange` | `(value: DecisionTableType) => void` | 数据变更回调 |

---

### 2.3 GraphSimulator

模拟器面板组件。

```tsx
import { GraphSimulator } from '@gorules/jdm-editor';

<GraphSimulator
  onClear={() => setSimulation(undefined)}
  onRun={async ({ graph, context }) => {
    const result = await axios.post('/api/simulate', { context, content: graph });
    setSimulation({ result: result.data });
  }}
/>
```

**Props**:

| 属性 | 类型 | 说明 |
|------|------|------|
| `onClear` | `() => void` | 清除模拟结果回调 |
| `onRun` | `(params: { graph, context }) => Promise<void>` | 执行模拟回调 |

---

### 2.4 JdmConfigProvider

编辑器全局配置提供者。

```tsx
import { JdmConfigProvider } from '@gorules/jdm-editor';

<JdmConfigProvider
  theme="dark"
  locale="zh"
  prefix="my-editor"
>
  {children}
</JdmConfigProvider>
```

**Props**:

| 属性 | 类型 | 说明 |
|------|------|------|
| `theme` | `'light' \| 'dark' \| 'auto'` | 主题模式 |
| `locale` | `'en' \| 'zh'` | 语言 |
| `prefix` | `string` | CSS 类名前缀 |
| `dictionaries` | `Map<string, { label, value }[]>` | 自定义字典 |

---

### 2.5 createJdmNode

自定义节点创建 API。

```tsx
import { createJdmNode } from '@gorules/jdm-editor';

const myNode = createJdmNode({
  kind: 'myCustomNode',
  displayName: 'My Custom Node',
  group: 'custom',
  icon: <MyIcon />,
  shortDescription: 'A custom node',
  handleLeft: true,
  handleRight: true,
  inputs: [
    { control: 'text', name: 'field1', label: 'Field 1' },
    { control: 'bool', name: 'enabled', label: 'Enabled' },
  ],
});
```

**参数**:

| 属性 | 类型 | 说明 |
|------|------|------|
| `kind` | `string` | 节点类型标识 |
| `displayName` | `string` | 显示名称 |
| `group` | `string` | 节点分组 |
| `icon` | `ReactNode` | 图标组件 |
| `shortDescription` | `string` | 简短描述 |
| `handleLeft` | `boolean` | 是否显示左侧连接点 |
| `handleRight` | `boolean` | 是否显示右侧连接点 |
| `inputs` | `InputField[]` | 输入字段定义 |

---

## 3. 导出的 Helper API

### 3.1 WASM 工具

```typescript
import { ensureWasmLoaded, useWasmReady } from '@gorules/jdm-editor';

// 确保 WASM 已加载
await ensureWasmLoaded();

// React Hook: 检查 WASM 是否就绪
const isReady = useWasmReady();
```

### 3.2 节点类型工具

```typescript
import { useNodeType } from '@gorules/jdm-editor';

// React Hook: 获取节点类型信息
const nodeType = useNodeType(nodeKind);
```

### 3.3 持久化状态

```typescript
import { usePersistentState } from '@gorules/jdm-editor';

// React Hook: 持久化状态（localStorage）
const [value, setValue] = usePersistentState('key', defaultValue);
```

### 3.4 CodeMirror 配置

```typescript
import { codemirror } from '@gorules/jdm-editor';

// 获取 CodeMirror 配置
const extensions = codemirror.getExtensions({ ... });
```

### 3.5 Request Schema 工具（opencode 新增）

```typescript
import {
  getRequestDefinitions,
  getRequestExampleSources,
  buildRequestSchemaFromDefinitions,
  parseRequestSchemaValue,
  stringifyRequestSchemaValue,
  // ...
} from '@gorules/jdm-editor';
```

### 3.6 Schema 工具

```typescript
import { graphSchema, nodeSchema, edgeSchema } from '@gorules/jdm-editor';

// Zod schema 验证
const result = graphSchema.safeParse(data);
```

---

## 4. 类型定义

### 4.1 DecisionGraphType

```typescript
type DecisionGraphType = {
  nodes: DecisionNode[];
  edges: DecisionEdge[];
};
```

### 4.2 DecisionNode

```typescript
type DecisionNode<T = any> = {
  id: string;
  name: string;
  type: string;
  content: T;
  position: { x: number; y: number };
  diff?: DiffMetadata;
};
```

### 4.3 DecisionEdge

```typescript
type DecisionEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  handles?: { source: string; target: string };
  diff?: DiffMetadata;
};
```

### 4.4 DiffStatus

```typescript
type DiffStatus = 'added' | 'removed' | 'modified' | 'unchanged' | 'moved';
```

### 4.5 Simulation

```typescript
type Simulation = {
  result: {
    result: any;
    trace?: any;
    snapshot: DecisionGraphType;
    performance?: string;
  };
  error?: {
    message: string;
    data?: any;
  };
};
```

### 4.6 JdmUiMode

```typescript
type JdmUiMode = 'dev' | 'business';
```

### 4.7 NodeKind（枚举）

```typescript
enum NodeKind {
  Input = 'inputNode',
  Output = 'outputNode',
  DecisionTable = 'decisionTableNode',
  Function = 'functionNode',
  Expression = 'expressionNode',
  CustomFunction = 'customNode',
  Switch = 'switchNode',
}
```
