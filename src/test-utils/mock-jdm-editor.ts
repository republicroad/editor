import { mock } from 'bun:test';
import React from 'react';
// 内核 i18n 子模块（无 monaco 依赖，bun 可求值）——为桩提供行为等价的 useT。
// mock.module 为进程级粘性：全量跑时后续测试文件（如 version-history-panel，
// 其文案已改走内核 vh.* catalog）会拿到本桩，故 useT 必须返回真实 catalog 文案。
import { createT } from '../../../jdm-editor/packages/jdm-editor/src/theming/i18n';

export interface MockGraphNode {
  id: string;
  type?: string;
  content?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface MockGraphStore {
  decisionGraph?: { nodes: MockGraphNode[]; edges?: unknown[] };
  simulate?: { result?: { trace?: Record<string, { output?: unknown }> } };
}

type GraphListener = () => void;

const listeners = new Set<GraphListener>();

export const mockGraphStore: MockGraphStore = {};

export const updateNodeCalls: string[] = [];
export const openTabCalls: string[] = [];

export const resetJdmMock = (): void => {
  delete mockGraphStore.decisionGraph;
  delete mockGraphStore.simulate;
  updateNodeCalls.length = 0;
  openTabCalls.length = 0;
  listeners.clear();
};

export const notifyGraphListeners = (): void => {
  for (const notify of listeners) {
    notify();
  }
};

const useGraphState = (selector: (store: MockGraphStore) => unknown): unknown => {
  const [, force] = React.useReducer((count: number) => count + 1, 0);
  React.useEffect(() => {
    listeners.add(force);
    return () => {
      listeners.delete(force);
    };
  }, []);
  return selector(mockGraphStore);
};

let installed = false;

/**
 * 用桩替换 @republicroad/jdm-editor 全量桶(monaco 在 bun 下不可求值)。
 * 必须在被测组件 import 之前调用；组件测试经 mockGraphStore 播种图状态，
 * updateNode 直接落到 store 并触发订阅组件重渲染。
 */
export const installJdmEditorMock = (): void => {
  if (installed) {
    return;
  }
  installed = true;

  const CodeEditor = (props: {
    value?: string;
    onChange?: (next: string) => void;
    placeholder?: string;
    maxRows?: number;
    readOnly?: boolean;
  }) =>
    React.createElement('textarea', {
      'aria-label': 'code-editor',
      'data-testid': 'code-editor',
      value: props.value ?? '',
      placeholder: props.placeholder,
      onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => props.onChange?.(event.target.value),
    });

  const GraphNode = ({
    name,
    actions,
    children,
  }: {
    id?: string;
    name?: string;
    isSelected?: boolean;
    noBodyPadding?: boolean;
    specification?: unknown;
    actions?: React.ReactNode;
    children?: React.ReactNode;
  }) =>
    React.createElement(
      'div',
      { 'data-testid': 'graph-node' },
      React.createElement('div', { 'data-testid': 'graph-node-name' }, name),
      actions,
      children,
    );

  mock.module('@republicroad/jdm-editor', () => ({
    CodeEditor,
    GraphNode,
    createJdmNode: (specification: unknown) => specification,
    jsonSchemaToVariableType: (schema?: { type?: string }) => ({ type: schema?.type ?? 'any' }),
    // 行为等价的英文翻译（内核 useT 无 Provider 时同为 en 回退）
    useT: () => createT('en'),
    useDecisionGraphState: useGraphState,
    useDecisionGraphActions: () => ({
      updateNode: (id: string, updater: (draft: MockGraphNode) => MockGraphNode | void) => {
        updateNodeCalls.push(id);
        const node = mockGraphStore.decisionGraph?.nodes.find((item) => item.id === id);
        if (!node) {
          return;
        }
        const clone = structuredClone(node) as MockGraphNode;
        const returned = updater(clone);
        const next = (returned ?? clone) as MockGraphNode;
        Object.keys(node).forEach((key) => delete node[key]);
        Object.assign(node, next);
        notifyGraphListeners();
      },
      openTab: (id: string) => {
        openTabCalls.push(id);
      },
    }),
  }));
};

export const mockCustomNode = (id: string, config: unknown): MockGraphNode => ({
  id,
  type: 'customNode',
  content: { config },
});

export const seedGraph = (...nodes: MockGraphNode[]): void => {
  mockGraphStore.decisionGraph = { nodes, edges: [] };
};
