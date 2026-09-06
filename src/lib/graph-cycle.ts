// 图环检测纯逻辑（自 decision-simple 页面 checkCyclic 抽出）——保存/下载/上传前的环路校验。
import { DirectedGraph } from 'graphology';
import { hasCycle } from 'graphology-dag';

export const CYCLE_ERROR_MESSAGE = 'Circular dependencies detected';

/** 边集合存在环时抛错（文案对齐页面既有提示），无环静默通过 */
export const assertAcyclic = (edges: ReadonlyArray<{ sourceId: string; targetId: string }>): void => {
  const diGraph = new DirectedGraph();
  edges.forEach((edge) => {
    diGraph.mergeEdge(edge.sourceId, edge.targetId);
  });
  if (hasCycle(diGraph)) {
    throw new Error(CYCLE_ERROR_MESSAGE);
  }
};
