import { mock } from 'bun:test';
import React from 'react';

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
 * 用桩替换 @gorules/jdm-editor 全量桶(monaco 在 bun 下不可求值)。
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

  mock.module('@gorules/jdm-editor', () => ({
    CodeEditor,
    GraphNode,
    createJdmNode: (specification: unknown) => specification,
    jsonSchemaToVariableType: (schema?: { type?: string }) => ({ type: schema?.type ?? 'any' }),
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
