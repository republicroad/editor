# "运行到此节点" 功能测试指南

## 测试环境

开发服务器已启动: http://localhost:5177/

## 手动测试步骤

### 测试 1: 基本功能测试

1. **打开决策图**
   - 访问 http://localhost:5177/
   - 打开一个包含多个节点的决策图（至少包含：输入节点 → 中间节点 → 输出节点）

2. **测试菜单打开**
   - 点击任意节点的菜单按钮（右上角三个点图标）
   - ✅ 验证：菜单应该正常打开且不会自动关闭
   - ✅ 验证：菜单中应该显示"运行到此节点"选项

3. **测试运行功能**
   - 点击"运行到此节点"
   - ✅ 验证：菜单项文本变为"运行中..."
   - ✅ 验证：菜单项变为禁用状态
   - ✅ 验证：节点显示加载状态
   - ✅ 验证：100ms后菜单自动关闭
   - ✅ 验证：运行完成后显示结果

4. **测试路径过滤**
   - 创建一个分支图：
     ```
     输入节点 → 节点A → 节点B
              → 节点C → 节点D
     ```
   - 点击"节点B"的"运行到此节点"
   - ✅ 验证：只运行 输入节点 → 节点A → 节点B 的路径
   - ✅ 验证：节点C和节点D不应该被执行

### 测试 2: 边界情况测试

1. **无输入节点的图**
   - 创建一个没有输入节点的图
   - 点击任意节点的"运行到此节点"
   - ✅ 验证：应该显示错误提示或运行所有节点（降级行为）

2. **孤立节点**
   - 创建一个无法从输入节点到达的孤立节点
   - 点击该节点的"运行到此节点"
   - ✅ 验证：应该显示错误提示或只运行输入节点

3. **循环图**
   - 创建一个包含循环的图（如果允许）
   - 点击循环中的节点
   - ✅ 验证：BFS算法应该正确处理，不会死循环

4. **快速连续点击**
   - 快速点击多个不同节点的"运行到此节点"
   - ✅ 验证：后一个请求应该覆盖前一个
   - ✅ 验证：只有最后一个节点显示加载状态

### 测试 3: 性能测试

1. **大型图测试**
   - 创建一个包含50+节点的图
   - 点击末端节点的"运行到此节点"
   - ✅ 验证：菜单打开/关闭流畅，无卡顿
   - ✅ 验证：路径计算快速完成（<100ms）
   - ✅ 验证：节点渲染无明显延迟

2. **频繁操作测试**
   - 连续打开/关闭多个节点的菜单
   - ✅ 验证：无内存泄漏
   - ✅ 验证：控制台无错误

### 测试 4: 兼容性测试

1. **其他菜单项**
   - 测试"复制"功能是否正常
   - 测试"删除"功能是否正常
   - ✅ 验证：不影响其他菜单项

2. **完整图运行**
   - 使用原有的"运行"按钮运行整个图
   - ✅ 验证：完整运行功能不受影响

3. **节点编辑**
   - 编辑节点内容
   - 拖动节点位置
   - 连接/断开节点
   - ✅ 验证：所有编辑功能正常

## 控制台检查

打开浏览器开发者工具（F12），查看控制台输出：

### 正常日志（调试用）

```
[Graph] nodesWithRunningId useMemo recalculating, runningNodeId: null
[Graph] defaultNodeTypes useMemo recalculating
[GraphNode xxx] Rendered, menuOpen: false, runLoading: false
[decision-simple] handleRunToNode called, nodeId: xxx
[decision-simple] setRunningNodeId called
[Graph] nodesWithRunningId useMemo recalculating, runningNodeId: xxx
[GraphNode xxx] Rendered, menuOpen: true, runLoading: true
[decision-simple] finally block, setting runningNodeId to null
```

### 异常情况

如果看到以下日志，说明有问题：

```
❌ [Graph] defaultNodeTypes useMemo recalculating (频繁出现)
   → 说明函数引用不稳定，需要检查 useCallback 依赖

❌ [GraphNode xxx] Node should re-render (频繁出现)
   → 说明节点频繁重新渲染，影响性能

❌ Error: ... (任何错误)
   → 需要修复
```

## 网络请求检查

在开发者工具的 Network 标签中：

1. 点击"运行到此节点"
2. 查找 `run_debug` 或类似的 API 请求
3. ✅ 验证：请求体中的 `nodes` 和 `edges` 只包含路径上的节点
4. ✅ 验证：请求成功返回（状态码 200）

## 预期结果示例

假设有以下图结构：

```
输入节点 (id: input-1)
  ↓
节点A (id: node-a)
  ↓
节点B (id: node-b)
  ↓
节点C (id: node-c)
  ↓
输出节点 (id: output-1)
```

点击"节点B"的"运行到此节点"，发送的请求应该包含：

```json
{
  "context": { /* 输入数据 */ },
  "content": {
    "nodes": [
      { "id": "input-1", /* ... */ },
      { "id": "node-a", /* ... */ },
      { "id": "node-b", /* ... */ }
    ],
    "edges": [
      { "sourceId": "input-1", "targetId": "node-a", /* ... */ },
      { "sourceId": "node-a", "targetId": "node-b", /* ... */ }
    ]
  },
  "user_id": "..."
}
```

注意：节点C和输出节点不应该包含在请求中。

## 已知问题和限制

1. **调试日志**：当前代码包含大量 `console.log`，测试完成后应该移除
2. **菜单关闭延迟**：使用了100ms延迟，可能在某些情况下不够优雅
3. **错误处理**：部分边界情况的错误提示可能需要优化

## 测试完成后

如果所有测试通过，可以：

1. 移除调试日志（见下一节）
2. 提交代码
3. 部署到测试环境

## 移除调试日志

测试完成后，需要移除以下文件中的 `console.log`：

1. `graph.tsx` (第113, 168, 195-203行)
2. `graph-node.tsx` (第57, 147行)
3. `decision-simple.tsx` (handleRunToNode 函数中的所有 console.log)

可以使用以下命令查找所有调试日志：

```bash
grep -rn "console.log.*Graph\|console.log.*GraphNode\|console.log.*decision-simple.*handleRunToNode" jdm-editor/packages/jdm-editor/src/
```
