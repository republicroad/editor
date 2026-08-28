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
const { CustomNodeSummaryCard } = await import('../../../src/components/custom-node/custom-node-summary-card');

const NODE_ID = 'sum-node';

const specProps = (tool: {
  namespace: string;
  name: string;
  parameters: { properties: Record<string, { title?: string }> };
  returns: { title?: string; type?: string };
}) => ({
  id: NODE_ID,
  data: { name: '摘要节点' },
  selected: false,
  specification: {},
  tool,
});

const seedExpr = (value: string[]) => {
  seedGraph(
    mockCustomNode(NODE_ID, {
      inputField: null,
      outputPath: null,
      passThrough: true,
      expressions: [{ id: 'e1', key: 'result', value }],
    }),
  );
};

afterEach(() => {
  cleanup();
  resetJdmMock();
});

describe('CustomNodeSummaryCard', () => {
  test('renders tool kind and aligns parameter titles with expression args', () => {
    seedExpr(['crypto.hash', '"md5"', 'input.password', 'true']);
    render(
      <CustomNodeSummaryCard
        {...specProps({
          namespace: 'contrib',
          name: 'hash',
          parameters: {
            properties: {
              algorithm: { title: '算法' },
              value: { title: '内容' },
              upper: { title: '大写' },
            },
          },
          returns: { title: 'String' },
        })}
      />,
    );

    expect(screen.getByText('contrib.hash')).toBeDefined();
    expect(screen.getByText('算法')).toBeDefined();
    expect(screen.getByText('"md5"')).toBeDefined();
    expect(screen.getByText('内容')).toBeDefined();
    expect(screen.getByText('input.password')).toBeDefined();
    expect(screen.getByText('true')).toBeDefined();
  });

  test('falls back to parameter key and return type when titles are missing', () => {
    seedExpr(['crypto.hash', '"sha256"']);
    render(
      <CustomNodeSummaryCard
        {...specProps({
          namespace: 'contrib',
          name: 'hash',
          parameters: { properties: { algorithm: {} } },
          returns: { type: 'string' },
        })}
      />,
    );

    expect(screen.getByText('algorithm')).toBeDefined();
    expect(screen.getByText('"sha256"')).toBeDefined();
    expect(screen.getByText('string')).toBeDefined();
  });

  test('renders Any return and missing arg cells', () => {
    seedExpr(['crypto.hash']);
    render(
      <CustomNodeSummaryCard
        {...specProps({
          namespace: 'contrib',
          name: 'hash',
          parameters: { properties: { algorithm: { title: '算法' } } },
          returns: {},
        })}
      />,
    );

    expect(screen.getByText('Any')).toBeDefined();
    expect(screen.getByText('算法')).toBeDefined();
  });

  test('renders no-args hint when the tool takes no parameters', () => {
    seedExpr(['crypto.hash']);
    render(
      <CustomNodeSummaryCard
        {...specProps({
          namespace: 'contrib',
          name: 'hash',
          parameters: { properties: {} },
          returns: { title: 'String' },
        })}
      />,
    );

    expect(screen.getByText('无参数调用')).toBeDefined();
  });

  test('renders simulation output and opens the tab from the edit action', () => {
    seedExpr(['crypto.hash', '"md5"', 'input.password']);
    mockGraphStore.simulate = {
      result: { trace: { [NODE_ID]: { output: { result: 'abc123' } } } },
    };
    render(
      <CustomNodeSummaryCard
        {...specProps({
          namespace: 'contrib',
          name: 'hash',
          parameters: { properties: { algorithm: { title: '算法' } } },
          returns: { title: 'String' },
        })}
      />,
    );

    expect(screen.getByText('{"result":"abc123"}')).toBeDefined();

    fireEvent.click(screen.getByText('编辑表达式'));
    expect(openTabCalls).toEqual([NODE_ID]);
  });
});
