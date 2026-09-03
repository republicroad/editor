import { afterEach, describe, expect, test } from 'bun:test';
import React from 'react';

import { setupJsDom } from '../../../src/test-utils/setup-jsdom';

setupJsDom();

import {
  installJdmEditorMock,
  mockCustomNode,
  mockGraphStore,
  openTabCalls,
  resetJdmMock,
  seedGraph,
} from '../../../src/test-utils/mock-jdm-editor';

installJdmEditorMock();

const { cleanup, fireEvent, render, screen } = await import('@testing-library/react');
const { QueryListTab, queryListNode } =
  await import('../../../packages/appshell/src/components/custom-node/query-list-node');

const NODE_ID = 'ql-node';

const makeExpr = (id: string, key: string, roster = '', valueExpr = '') => ({
  id,
  key,
  value: ['roster', JSON.stringify(roster), valueExpr],
});

const seedQueries = (expressions: ReturnType<typeof makeExpr>[]) => {
  seedGraph(
    mockCustomNode(NODE_ID, {
      inputField: null,
      outputPath: null,
      passThrough: true,
      expressions,
    }),
  );
};

const configExpressions = () => {
  const node = mockGraphStore.decisionGraph?.nodes.find((item) => item.id === NODE_ID);
  return (node?.content as { config?: { expressions?: unknown[] } } | undefined)?.config?.expressions ?? [];
};

afterEach(() => {
  cleanup();
  resetJdmMock();
});

describe('QueryListTab', () => {
  test('renders query rows with configured list names', () => {
    seedQueries([makeExpr('e1', 'result', 'ipv4_deny'), makeExpr('e2', 'result2')]);
    render(<QueryListTab id={NODE_ID} />);

    expect(screen.getByText('ipv4_deny')).toBeDefined();
    expect(screen.getByText('未选择')).toBeDefined();
    expect(screen.getByText('查询 1 · 输出键：result')).toBeDefined();
  });

  test('add query appends an empty expression and selects it', () => {
    seedQueries([makeExpr('e1', 'result', 'ipv4_deny')]);
    render(<QueryListTab id={NODE_ID} />);

    fireEvent.click(screen.getByText('添加查询'));

    expect(configExpressions()).toHaveLength(2);
    expect(screen.getByText('查询 2 · 输出键：result2')).toBeDefined();
  });

  test('remove query deletes the expression', () => {
    seedQueries([makeExpr('e1', 'result', 'ipv4_deny'), makeExpr('e2', 'result2', 'whitelist')]);
    render(<QueryListTab id={NODE_ID} />);

    fireEvent.click(screen.getAllByLabelText('删除查询')[1]);

    expect(configExpressions()).toHaveLength(1);
    expect(document.body.textContent).toContain('查询 1 · 输出键：result');
  });

  test('editing value expression and output key persists into config', () => {
    seedQueries([makeExpr('e1', 'result', 'ipv4_deny')]);
    render(<QueryListTab id={NODE_ID} />);

    fireEvent.change(screen.getByLabelText('code-editor'), { target: { value: 'input.phone' } });
    const first = configExpressions()[0] as { value: string[] };
    expect(first.value[2]).toBe('input.phone');

    fireEvent.change(screen.getByPlaceholderText('result'), { target: { value: 'hit' } });
    const updated = configExpressions()[0] as { key: string };
    expect(updated.key).toBe('hit');
  });

  test('renders hit badges from simulation trace', () => {
    seedQueries([makeExpr('e1', 'result', 'ipv4_deny'), makeExpr('e2', 'result2', 'whitelist')]);
    mockGraphStore.simulate = {
      result: { trace: { [NODE_ID]: { output: { result: { hit: true }, result2: { hit: false } } } } },
    };
    render(<QueryListTab id={NODE_ID} />);

    expect(screen.getByText('命中')).toBeDefined();
    expect(screen.getByText('未命中')).toBeDefined();
  });

  test('empty config shows placeholder and add creates the first entry', () => {
    seedQueries([]);
    render(<QueryListTab id={NODE_ID} />);

    expect(screen.getByText('尚未配置查询，点击左侧「添加查询」。')).toBeDefined();

    fireEvent.click(screen.getByText('添加查询'));

    expect(configExpressions()).toHaveLength(1);
    expect(document.body.textContent).toContain('查询 1 · 输出键：result');
  });

  test('autocomplete input renders for list search', () => {
    seedQueries([makeExpr('e1', 'result', 'ipv4_deny')]);
    render(<QueryListTab id={NODE_ID} />);

    expect(screen.getByPlaceholderText('搜索并选择名单')).toBeDefined();
  });
});

describe('QueryListNode canvas card', () => {
  const NodeView = (
    queryListNode as unknown as {
      renderNode: React.FC<{
        id: string;
        data: { name: string };
        selected: boolean;
        specification: unknown;
      }>;
    }
  ).renderNode;

  test('renders list names, hit badges, count, and opens the tab from the edit action', () => {
    seedQueries([makeExpr('e1', 'result', 'ipv4_deny'), makeExpr('e2', 'result2')]);
    mockGraphStore.simulate = {
      result: { trace: { [NODE_ID]: { output: { result: { hit: true } } } } },
    };
    render(<NodeView id={NODE_ID} data={{ name: '查询名单1' }} selected={false} specification={{}} />);

    expect(screen.getByText('roster')).toBeDefined();
    expect(screen.getByText('ipv4_deny')).toBeDefined();
    expect(screen.getByText('未选择')).toBeDefined();
    expect(screen.getByText('命中')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();

    fireEvent.click(screen.getByText('编辑'));
    expect(openTabCalls).toEqual([NODE_ID]);
  });

  test('renders empty state without simulation', () => {
    seedQueries([]);
    render(<NodeView id={NODE_ID} data={{ name: '查询名单1' }} selected={false} specification={{}} />);

    expect(screen.getByText('未配置查询')).toBeDefined();
    expect(screen.queryByText('命中')).toBeNull();
  });
});
