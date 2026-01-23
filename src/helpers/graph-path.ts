import { DecisionGraphType } from '@gorules/jdm-editor';

/**
 * 计算从输入节点到目标节点的路径
 * 返回路径上的所有节点ID和边
 */
export const getPathToNode = (
  graph: DecisionGraphType,
  targetNodeId: string
): { nodes: string[]; edges: typeof graph.edges } => {
  const { nodes, edges } = graph;

  // 找到输入节点
  const inputNode = nodes.find(n => n.type === 'inputNode');
  if (!inputNode) {
    // 如果没有输入节点，返回所有节点和边
    return {
      nodes: nodes.map(n => n.id),
      edges: edges,
    };
  }

  // 构建邻接表
  const adjacencyList = new Map<string, string[]>();
  const edgeMap = new Map<string, typeof edges[0]>();

  edges.forEach(edge => {
    if (!adjacencyList.has(edge.sourceId)) {
      adjacencyList.set(edge.sourceId, []);
    }
    adjacencyList.get(edge.sourceId)!.push(edge.targetId);
    edgeMap.set(`${edge.sourceId}-${edge.targetId}`, edge);
  });

  // 使用 BFS 找到从输入节点到目标节点的所有路径
  const pathNodes = new Set<string>();
  const pathEdges: typeof edges = [];
  const visited = new Set<string>();
  const queue: string[] = [inputNode.id];

  // 记录每个节点的前驱节点
  const predecessors = new Map<string, string[]>();

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    if (visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);

    const neighbors = adjacencyList.get(currentId) || [];

    for (const neighborId of neighbors) {
      if (!predecessors.has(neighborId)) {
        predecessors.set(neighborId, []);
      }
      predecessors.get(neighborId)!.push(currentId);

      if (!visited.has(neighborId)) {
        queue.push(neighborId);
      }

      // 如果到达目标节点，停止搜索
      if (neighborId === targetNodeId) {
        break;
      }
    }
  }

  // 从目标节点回溯到输入节点，收集路径
  const collectPath = (nodeId: string) => {
    if (pathNodes.has(nodeId)) {
      return;
    }

    pathNodes.add(nodeId);

    const preds = predecessors.get(nodeId) || [];
    for (const predId of preds) {
      // 添加边
      const edge = edgeMap.get(`${predId}-${nodeId}`);
      if (edge && !pathEdges.find(e => e.id === edge.id)) {
        pathEdges.push(edge);
      }

      // 递归收集前驱节点
      collectPath(predId);
    }
  };

  // 从目标节点开始回溯
  collectPath(targetNodeId);

  return {
    nodes: Array.from(pathNodes),
    edges: pathEdges,
  };
};

/**
 * 过滤图，只保留到目标节点的路径
 */
export const filterGraphToNode = (
  graph: DecisionGraphType,
  targetNodeId: string
): DecisionGraphType => {
  const { nodes: pathNodeIds, edges: pathEdges } = getPathToNode(graph, targetNodeId);

  return {
    nodes: graph.nodes.filter(n => pathNodeIds.includes(n.id)),
    edges: pathEdges,
  };
};
