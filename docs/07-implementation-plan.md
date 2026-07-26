# 实施计划：Input/Custom 节点外部化 + better-auth 用户信息集成

> 基于 master 分支，将 Input 节点和 Custom 节点的自定义逻辑从 jdm-editor 内部外部化到消费方，同时集成 better-auth 用户身份信息，使 jdm-editor 更易于嵌入不同项目。

---

## 目录

- [一、总体架构](#一总体架构)
- [二、集成点对比分析](#二集成点对比分析)
- [三、详细实施步骤](#三详细实施步骤)
  - [步骤 1：定义 UserResolver 类型](#步骤-1定义-userresolver-类型)
  - [步骤 2：ResolveUserEffect 实现](#步骤-2resolveusereffect-实现)
  - [步骤 3：替换 prop drilling 为 store 读取](#步骤-3替换-prop-drilling-为-store-读取)
  - [步骤 4：dg-wrapper.tsx 启用 components override 机制](#步骤-4dg-wrappertsx-启用-components-override-机制)
  - [步骤 5：graph.tsx 启用 customNodeRenderer](#步骤-5graphtsx-启用-customnoderenderer)
  - [步骤 6：导出 specification](#步骤-6导出-specification)
  - [步骤 7：编辑器项目 — 安装 better-auth 并配置](#步骤-7编辑器项目--安装-better-auth-并配置)
  - [步骤 8：Node 元数据标记增强](#步骤-8node-元数据标记增强)
- [四、文件变更清单](#四文件变更清单)
- [五、向后兼容策略](#五向后兼容策略)
- [六、实施顺序](#六实施顺序)
- [七、数据迁移](#七数据迁移)

---

## 一、总体架构

```
┌──────────────────────────────────────────────────────────────────┐
│                     消费方（GoRules Editor）                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Auth: better-auth → authClient.useSession()               │  │
│  │  UserResolver: createBetterAuthResolver()                  │  │
│  └────────────┬───────────────────────────────────────────────┘  │
│               │ userResolver prop                                │
│  ┌────────────▼───────────────────────────────────────────────┐  │
│  │                  jdm-editor 库                              │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │  1. ResolveUserEffect (挂载时获取一次)                 │   │  │
│  │  │     → userResolver() → { user }                     │   │  │
│  │  │     → 写入 dg-store                                  │   │  │
│  │  └─────────────────────────────────────────────────────┘   │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │  2. Graph / SideToolbar / Tab 从 store 读取           │   │  │
│  │  │     → 替换所有 prop drilling                          │   │  │
│  │  └─────────────────────────────────────────────────────┘   │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │  3. dg-wrapper.tsx: components override 机制          │   │  │
│  │  │     → Input Tab 覆盖                                 │   │  │
│  │  │     → CustomFunction Tab 覆盖                        │   │  │
│  │  └─────────────────────────────────────────────────────┘   │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │  4. graph.tsx: customNodeRenderer 启用               │   │  │
│  │  │     → customNodes prop 的 renderNode 被调用          │   │  │
│  │  └─────────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 二、集成点对比分析

### 2.1 ReactFlow 节点渲染

| 位置 | Input 节点 | Custom 节点 |
|------|-----------|-------------|
| 文件 | `graph.tsx` L262-282 | `graph.tsx` L262-282 |
| 机制 | `defaultNodeTypes[NodeKind.Input]` → `inputSpecification.renderNode` | `defaultNodeTypes['customNode']` → `customFunctionSpecification.renderNode` |
| 问题 | 无法覆盖 | `customNodeRenderer` 已实现但被注释掉，未注册到 `nodeTypes` |

### 2.2 Tab 内容渲染

| 位置 | Input 节点 | Custom 节点 |
|------|-----------|-------------|
| 文件 | `dg-wrapper.tsx` L123 | `dg-wrapper.tsx` L124 |
| 机制 | `.with(NodeKind.Input, () => inputSpecification?.renderTab?.())` | `.with(NodeKind.CustomFunction, () => customFunctionSpecification?.renderTab?.())` |
| 问题 | 硬编码，`components` 的 `.otherwise()` 分支永远不执行 | 硬编码，同上 |

### 2.3 侧边栏分组

| 位置 | Input 节点 | Custom 节点 |
|------|-----------|-------------|
| 文件 | `graph-components.tsx` L50-76 | `graph-components.tsx` L50-76 |
| 机制 | 归入 `core` 组 | 归入自定义 `group` 或默认 `custom` 组 |
| 现状 | ✅ 正确 | ✅ 正确 |

### 2.4 节点创建

| 位置 | Input 节点 | Custom 节点 |
|------|-----------|-------------|
| 文件 | `graph.tsx` L304-306 | `graph.tsx` L309-315 |
| 现状 | ⚠️ 内容结构过于简单（仅 `{name: ''}`） | ✅ 正确 |

### 2.5 数据 Schema

| 位置 | Input 节点 | Custom 节点 |
|------|-----------|-------------|
| 文件 | `helpers/schema.ts` L67-69 | `helpers/schema.ts` L107-109 |
| 定义 | `inputNodeSchema = z.object({ schema: z.string() })` | `customNodeSchema = z.object({ config: z.any() })` |
| 现状 | ⚠️ 过于简单 | ✅ 已足够灵活 |

### 2.6 后端执行

| 位置 | Input 节点 | Custom 节点 |
|------|-----------|-------------|
| 机制 | zen-engine 以 `inputNode` 类型处理 | zen-engine 以 `customNode` 类型处理 |
| 现状 | ✅ 无需改动 | ✅ 无需改动 |

### 2.7 扩展路径对比

| 维度 | `customNodes` prop | `components` prop |
|------|-------------------|-------------------|
| 目标类型 | 仅 `customNode` | **任意类型**（含内置） |
| `renderNode` | ✅ 支持 | ✅ 支持 |
| `renderTab` | ❌ 不支持（Custom 节点也无法覆盖） | ✅ 支持 |
| `generateNode` | ✅ 支持 | ✅ 支持 |
| 侧边栏分组 | ✅ 支持 | ⚠️ 归入 `extended` 组 |

**结论**：两种路径各有优劣。最佳方案是同时修复两条路径：
- `customNodes`：补全 `renderTab` 路由
- `components`：统一 override 机制（与 Input 节点共用同一套代码）

---

## 三、详细实施步骤

### 步骤 1：定义 UserResolver 类型

**文件**: `jdm-editor/packages/jdm-editor/src/components/decision-graph/dg-types.ts`

```typescript
export type UserResolver = () => Promise<{
  user?: string;
}> | null;
```

**文件**: `jdm-editor/packages/jdm-editor/src/components/decision-graph/dg-wrapper.tsx`

修改 `DecisionGraphWrapperProps`：

```typescript
// 删除
user?: string;

// 新增
userResolver?: UserResolver;
```

**文件**: `jdm-editor/packages/jdm-editor/src/components/decision-graph/index.ts`

导出新类型：

```typescript
export type { UserResolver } from './dg-types';
```

---

### 步骤 2：ResolveUserEffect 实现

**文件**: `jdm-editor/packages/jdm-editor/src/components/decision-graph/context/dg-store.context.tsx`

在 store state 中新增字段：

```typescript
export type DecisionGraphStoreType = {
  state: {
    // ... 现有字段
    user: string;           // 新增，默认 ''
  };
  // ...
};
```

初始化值：

```typescript
() => ({
  // ... 现有初始化
  user: '',
})
```

**文件**: `jdm-editor/packages/jdm-editor/src/components/decision-graph/dg-wrapper.tsx`

新增 `ResolveUserEffect` 组件：

```typescript
const ResolveUserEffect: React.FC<{ userResolver?: UserResolver }> = ({ userResolver }) => {
  const stateStore = useDecisionGraphContext().stateStore;

  useEffect(() => {
    if (!userResolver) return;

    let cancelled = false;
    (async () => {
      try {
        const result = await userResolver();
        if (!cancelled && result) {
          stateStore.setState({
            user: result.user ?? '',
          });
        }
      } catch (err) {
        console.warn('[jdm-editor] userResolver failed:', err);
        if (!cancelled) {
          stateStore.setState({ user: '' });
        }
      }
    })();

    return () => { cancelled = true; };
  }, [userResolver]);

  return null;
};
```

在 `DecisionGraphWrapper` 中渲染：

```typescript
const DecisionGraphWrapper = forwardRef<...>(
  ({ userResolver, ...props }, ref) => {
    // ...
    return (
      <>
        <ResolveUserEffect userResolver={userResolver} />
        {/* 现有内容 */}
      </>
    );
  }
);
```

---

### 步骤 3：替换 prop drilling 为 store 读取

#### 3a. Graph 组件

**文件**: `jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/graph.tsx`

```typescript
// 删除 props 中的 user
export type GraphProps = {
  className?: string;
  onDisableTabs?: (val: boolean) => void;
  reactFlowProOptions?: ProOptions;
  menuList?: any;
  customFunctions?: any;
  // 删除 user
};

// 在组件内部从 store 读取
const Graph = forwardRef<GraphProps, ...>((props, ref) => {
  const user = useDecisionGraphState(({ user }) => user);
  // ... 使用 store 中的值
});
```

#### 3b. GraphSideToolbar

**文件**: `jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/graph-side-toolbar.tsx`

```typescript
// 删除 props 中的 user
export type GraphSideToolbarProps = {
  ruleMetadata?: GraphRuleMetadata;
  // 删除 user
};

// 内部从 store 读取
const GraphSideToolbar = React.memo<GraphSideToolbarProps>(({ ruleMetadata }) => {
  const user = useDecisionGraphState(({ user }) => user);
  // ...
});
```

#### 3c. TabContents → customFunctionSpecification.renderTab

**文件**: `jdm-editor/packages/jdm-editor/src/components/decision-graph/dg-wrapper.tsx`

```typescript
// TabContents 从 store 读取
const TabContents = React.FC<{
  menuList?: any;
  customFunctions?: any;
  getTabData?: (tabId: string) => { menuList?: any[]; customFunctions?: any[] };
}> = (...) => {
  const user = useDecisionGraphState(({ user }) => user);

  // renderTab 调用处
  .with(NodeKind.CustomFunction, () => {
    return customFunctionSpecification?.renderTab?.({
      id: node?.id,
      manager: dndManager,
      user,     // 从 store 读取
      menuList: ...,
      customFunctions: ...,
    });
  })
};
```

#### 3d. renderTab 签名保持不变

**文件**: `jdm-editor/packages/jdm-editor/src/components/decision-graph/nodes/specifications/specification-types.ts`

`renderTab` 的参数类型保持不变（仍包含 `user`），因为这是 `NodeSpecification` 的公共 API，消费方的自定义 Tab 可能需要这些值。

---

### 步骤 4：dg-wrapper.tsx 启用 components override 机制

**文件**: `jdm-editor/packages/jdm-editor/src/components/decision-graph/dg-wrapper.tsx`

在 `TabContents` 中添加 `specOverrides`，并修改 `match()` 分支：

```typescript
const TabContents = React.FC<...> = (...) => {
  const user = useDecisionGraphState(({ user }) => user);
  const components = useDecisionGraphState(({ components }) => components);
  const customNodes = useDecisionGraphState(({ customNodes }) => customNodes);

  const specOverrides = useMemo(() => {
    return components?.reduce(
      (acc, c) => ({ ...acc, [c.type]: c }),
      {} as Record<string, NodeSpecification>
    ) ?? {};
  }, [components]);

  return (
    <div className="grl-dg__tab-contents">
      <Tabs activeKey={...} onChange={...} items={...}>
        {match(node?.type)
          .with(NodeKind.Input, () =>
            specOverrides[NodeKind.Input]?.renderTab?.({
              id: node?.id, manager: dndManager, user,
            })
            ?? inputSpecification?.renderTab?.({
              id: node?.id, manager: dndManager, user,
            }),
          )
          .with(NodeKind.DecisionTable, () =>
            specOverrides[NodeKind.DecisionTable]?.renderTab?.({
              id: node?.id, manager: dndManager, user,
            })
            ?? decisionTableSpecification?.renderTab?.({
              id: node?.id, manager: dndManager, user,
            }),
          )
          .with(NodeKind.CustomFunction, () => {
            const kind = (node as any)?.content?.kind;
            const customSpec = customNodes?.find((n) => n.kind === kind);
            return specOverrides[NodeKind.CustomFunction]?.renderTab?.({
              id: node?.id, manager: dndManager, user,
            })
            ?? customSpec?.renderTab?.({
              id: node?.id, manager: dndManager, user,
            })
            ?? customFunctionSpecification?.renderTab?.({
              id: node?.id, manager: dndManager, user,
            });
          })
          .otherwise(() => {
            const component = components?.find((c) => c.type === node?.type);
            return component?.renderTab?.({
              id: node?.id, manager: dndManager, user,
            });
          })}
      </Tabs>
    </div>
  );
};
```

---

### 步骤 5：graph.tsx 启用 customNodeRenderer

**文件**: `jdm-editor/packages/jdm-editor/src/components/decision-graph/graph/graph.tsx`

```typescript
// 取消注释 customNodeRenderer 注册
const nodeTypes = useMemo<Record<string, React.FC<any>>>(() => {
  return components.reduce(
    (acc, component) => ({
      ...acc,
      [component.type]: React.memo(
        (props: MinimalNodeProps) => component.renderNode({ specification: component, ...props }),
        (prevProps, nextProps) => (
          prevProps.id === nextProps.id &&
          prevProps.selected === nextProps.selected &&
          equal(prevProps.data, nextProps.data)
        ),
      ),
    }),
    { ...defaultNodeTypes, customNode: customNodeRenderer },  // 启用
  );
}, [components, customNodeRenderer]);  // 加回依赖
```

---

### 步骤 6：导出 specification

**文件**: `jdm-editor/packages/jdm-editor/src/components/decision-graph/index.ts`

```typescript
// 新增导出
export { inputSpecification } from './nodes/specifications/input.specification';
export { outputSpecification } from './nodes/specifications/output.specification';
export { decisionTableSpecification } from './nodes/specifications/decision-table.specification';
export { expressionSpecification } from './nodes/specifications/expression.specification';
export { functionSpecification } from './nodes/specifications/function.specification';
```

---

### 步骤 7：编辑器项目 — 安装 better-auth 并配置

#### 7a. 安装依赖

```bash
cd editor
npm install better-auth
```

#### 7b. 创建 better-auth client

**新文件**: `editor/src/lib/auth-client.ts`

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_BASE_URL || "",
});
```

#### 7c. 创建 UserResolver 工厂

**新文件**: `editor/src/lib/user-resolver.ts`

```typescript
import { authClient } from "./auth-client";
import type { UserResolver } from "@gorules/jdm-editor";

export const createBetterAuthResolver = (): UserResolver => {
  return async () => {
    try {
      const { data: session } = await authClient.getSession();
      if (!session?.user) {
        return { user: '' };
      }
      return {
        user: session.user.id,
      };
    } catch {
      return { user: '' };
    }
  };
};
```

#### 7d. 集成到 DecisionGraph

**文件**: `editor/src/pages/decision-simple.tsx`

```typescript
import { createBetterAuthResolver } from "../lib/user-resolver";

const userResolver = createBetterAuthResolver();

// 在 JSX 中
<DecisionGraph
  ref={ref}
  userResolver={userResolver}
  decisionGraph={graph}
  onChange={setGraph}
  // ... 其他 props
/>
```

---

### 步骤 8：Node 元数据标记增强

由于 `user` 现在从 store 获取，节点创建和编辑时的 metadata 标记逻辑**无需改动**（步骤 3 中 graph.tsx 的 `addNodeInner` 已改为从 store 读取）。

---

## 四、文件变更清单

### jdm-editor 库（7 个文件）

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `dg-types.ts` | 新增 | `UserResolver` 类型定义 |
| `dg-wrapper.tsx` | 修改 | 删除 `user` props，新增 `userResolver` prop，新增 `ResolveUserEffect`，TabContents 改为从 store 读取，新增 `specOverrides` |
| `dg.tsx` | 修改 | 删除 `user` props 透传 |
| `dg-store.context.tsx` | 修改 | state 新增 `user` 字段，初始化 |
| `graph.tsx` | 修改 | 从 store 读取 `user`，启用 `customNodeRenderer` |
| `graph-side-toolbar.tsx` | 修改 | 从 store 读取 `user` |
| `index.ts` | 修改 | 导出 `UserResolver` 类型，导出各 specification |

### 编辑器项目（3 个新文件 + 1 个修改）

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/lib/auth-client.ts` | 新增 | better-auth client 配置 |
| `src/lib/user-resolver.ts` | 新增 | `createBetterAuthResolver` 工厂函数 |
| `src/pages/decision-simple.tsx` | 修改 | 传入 `userResolver` prop |
| `package.json` | 修改 | 新增 `better-auth` 依赖 |

---

## 五、向后兼容策略

| 维度 | 策略 |
|------|------|
| **user props** | 删除，替换为 `userResolver`。**破坏性变更**，需在 CHANGELOG 中标注 |
| **renderTab 签名** | 保留 `user` 参数（从 store 读取后传入），消费方自定义 Tab 无需改动 |
| **config.meta 写入** | 逻辑不变，只是数据来源从 prop 变为 store |
| **没有 userResolver 的消费方** | `user` 默认 `''`，行为与之前一致 |

---

## 六、实施顺序

```
阶段 1: jdm-editor 核心改动
  ├── 步骤 1: UserResolver 类型定义
  ├── 步骤 2: ResolveUserEffect + store 扩展
  ├── 步骤 3: 替换 prop drilling
  └── 步骤 4: components override 机制

阶段 2: jdm-editor 功能补全
  ├── 步骤 5: customNodeRenderer 启用
  └── 步骤 6: specification 导出

阶段 3: 编辑器项目集成
  ├── 步骤 7: better-auth + userResolver
  └── 步骤 8: 验证端到端流程
```

---

## 七、数据迁移

现有 `customFunctionNode` 数据需要转换为 `customNode` 格式（如果在阶段二中启用了 `customNodeRenderer`）：

```typescript
// 旧格式
{ type: 'customFunctionNode', content: { name: 'xxx', expressions: [...] } }

// 新格式
{ type: 'customNode', content: { kind: 'custom-function', name: 'xxx', expressions: [...] } }
```

迁移脚本：

```typescript
function migrateCustomFunctionNode(node: any) {
  if (node.type === 'customFunctionNode') {
    return {
      ...node,
      type: 'customNode',
      content: { ...node.content, kind: 'custom-function' },
    };
  }
  return node;
}
```

> 注意：zen-engine 后端仅接受 `type: 'customNode'`，不接受 `type: 'customFunctionNode'`。迁移是必要的。
