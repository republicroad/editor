// 第八十二批补充（方案一）：undo 删节点语义闭环——ref 级集成测试。
// jsdom 驱动真实内核 dg-store（路径直通导入，不经 barrel mock）：
// addNodes → removeNodes（Delete 键的 store 入口）→ undo 恢复 → redo 重删，
// 并断言 onChange 全程触发（宿主 autosave markDirty / diffBaseline 清除依赖此链）。
// 说明：GraphRef = store actions & { stateStore, ... }——useDecisionGraphRaw() 捕获的
// context 与宿主页面持有的 graphRef 是同一作用面，等价于「点击 undo 按钮」的下游语义。
import { afterEach, describe, expect, mock, test } from 'bun:test';
import React from 'react';

import { setupJsDom } from '../../../src/test-utils/setup-jsdom';

setupJsDom();

const { act, cleanup, render } = await import('@testing-library/react');
const { DecisionGraphProvider, useDecisionGraphRaw } = await import(
  '../../../jdm-editor/packages/jdm-editor/src/components/decision-graph/context/dg-store.context'
);

interface StoreSlice {
  getState: () => Record<string, unknown>;
  setState: (partial: Record<string, unknown>) => void;
}

let context: {
  stateStore: StoreSlice;
  listenerStore: StoreSlice;
  referenceStore: StoreSlice;
  actions: {
    setDecisionGraph: (graph: unknown, opts?: { skipOnChangeEvent?: boolean }) => void;
    addNodes: (nodes: unknown[]) => void;
    removeNodes: (ids: string[]) => void;
    undo: () => void;
    redo: () => void;
  };
};

const TestConsumer = () => {
  const raw = useDecisionGraphRaw() as never;
  // 渲染期不写外部变量（react-hooks 规则）——effect 内捕获，RTL render 同步 flush effects
  React.useEffect(() => {
    context = raw;
  });
  return null;
};

/** 真实画布才回填 nodesState/edgesState 引用——jsdom 下手动接线（addNodes/removeNodes 依赖） */
const wireReferences = (): void => {
  const noop = () => {};
  act(() => {
    context.referenceStore.setState({
      nodesState: { current: [[], noop] },
      edgesState: { current: [[], noop] },
    });
  });
};

const nodeNames = (): unknown[] =>
  ((context.stateStore.getState().decisionGraph as { nodes?: Array<{ name?: string }> })?.nodes ?? []).map(
    (node) => node.name,
  );

const renderProvider = (): void => {
  render(
    <DecisionGraphProvider>
      <TestConsumer />
    </DecisionGraphProvider>,
  );
};

afterEach(() => cleanup());

describe('undo 删节点语义闭环（第八十二批方案一）', () => {
  test('addNodes → removeNodes → undo 恢复 → redo 重删；onChange 全程触发', () => {
    renderProvider();
    wireReferences();

    const onChange = mock(() => {});
    act(() => context.listenerStore.setState({ onChange }));

    act(() =>
      context.actions.setDecisionGraph(
        { nodes: [{ id: 'a', type: 'inputNode', name: 'seed', position: { x: 0, y: 0 } }], edges: [] },
        { skipOnChangeEvent: true },
      ),
    );

    // 结构变更（addNodes）自动入栈
    act(() =>
      context.actions.addNodes([{ id: 'extra', type: 'inputNode', name: 'extra', position: { x: 10, y: 10 } }]),
    );
    expect(nodeNames()).toEqual(['seed', 'extra']);

    // 删除 extra（removeNodes 内部 pushUndo 捕获删除前状态）
    act(() => context.actions.removeNodes(['extra']));
    expect(nodeNames()).toEqual(['seed']);
    expect(context.stateStore.getState().canUndo).toBe(true);

    // undo：extra 恢复
    act(() => context.actions.undo());
    expect(nodeNames()).toEqual(['seed', 'extra']);
    expect(context.stateStore.getState().canRedo).toBe(true);

    // redo：extra 再次删除
    act(() => context.actions.redo());
    expect(nodeNames()).toEqual(['seed']);

    // onChange 在 addNodes/removeNodes/undo/redo 每步触发（skipOnChangeEvent 的种子步除外）
    expect(onChange.mock.calls.length).toBeGreaterThanOrEqual(4);
  });

  test('连删两节点 → undo 两次逐级恢复（栈序语义）', () => {
    renderProvider();
    wireReferences();

    act(() =>
      context.actions.setDecisionGraph(
        {
          nodes: [
            { id: 'a', type: 'inputNode', name: 'a', position: { x: 0, y: 0 } },
            { id: 'b', type: 'inputNode', name: 'b', position: { x: 10, y: 0 } },
          ],
          edges: [],
        },
        { skipOnChangeEvent: true },
      ),
    );

    act(() => context.actions.removeNodes(['a']));
    act(() => context.actions.removeNodes(['b']));
    expect(nodeNames()).toEqual([]);

    act(() => context.actions.undo());
    expect(nodeNames()).toEqual(['b']);
    act(() => context.actions.undo());
    expect(nodeNames()).toEqual(['a', 'b']);
  });

  test('undo 后新编辑清空 redo 栈（分支语义）', () => {
    renderProvider();
    wireReferences();

    act(() =>
      context.actions.setDecisionGraph(
        { nodes: [{ id: 'a', type: 'inputNode', name: 'a', position: { x: 0, y: 0 } }], edges: [] },
        { skipOnChangeEvent: true },
      ),
    );
    act(() => context.actions.removeNodes(['a']));
    act(() => context.actions.undo());
    expect(context.stateStore.getState().canRedo).toBe(true);

    // undo 后产生新编辑 → redo 不可达
    act(() => context.actions.addNodes([{ id: 'c', type: 'inputNode', name: 'c', position: { x: 20, y: 0 } }]));
    expect(context.stateStore.getState().canRedo).toBe(false);
    act(() => context.actions.redo());
    expect(nodeNames()).toEqual(['a', 'c']); // redo 无效，保持现状
  });
});
