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
const { CurrentDateTab, currentDateNode } =
  await import('../../../packages/appshell/src/components/custom-node/current-date-node');

const NODE_ID = 'cd-node';

const seedNode = (config?: Record<string, unknown>) => {
  seedGraph(
    mockCustomNode(NODE_ID, {
      locked: true,
      inputField: null,
      outputPath: null,
      passThrough: true,
      expressions: [{ id: 'e1', key: 'result', value: ['current_date'] }],
      ...config,
    }),
  );
};

afterEach(() => {
  cleanup();
  resetJdmMock();
});

describe('CurrentDateTab', () => {
  test('shows function description, output key input and empty state without simulation', () => {
    seedNode();
    render(<CurrentDateTab id={NODE_ID} />);

    expect(screen.getByText(/返回服务器当前日期/)).toBeDefined();
    expect(screen.getByText('输出 key')).toBeDefined();
    expect(screen.getByDisplayValue('result')).toBeDefined();
    expect(screen.getByText('运行仿真查看结果')).toBeDefined();
  });

  test('renders simulated output value by key', () => {
    seedNode();
    mockGraphStore.simulate = {
      result: { trace: { [NODE_ID]: { output: { result: '2026-09-01' } } } },
    } as never;
    render(<CurrentDateTab id={NODE_ID} />);

    expect(screen.getByText('仿真输出')).toBeDefined();
    expect(screen.getByText('2026-09-01')).toBeDefined();
  });

  test('commits edited output key into node config (locked preserved)', () => {
    seedNode();
    render(<CurrentDateTab id={NODE_ID} />);

    const input = screen.getByDisplayValue('result');
    fireEvent.change(input, { target: { value: 'my_date' } });
    fireEvent.blur(input);

    const node = mockGraphStore.decisionGraph?.nodes.find((item) => item.id === NODE_ID);
    const cfg = node?.content as { config?: { locked?: boolean; expressions?: { key: string }[] } };
    expect(cfg.config?.expressions?.[0]?.key).toBe('my_date');
    expect(cfg.config?.locked).toBe(true);
  });
});

describe('CurrentDateNode canvas card', () => {
  const NodeView = (
    currentDateNode as unknown as {
      renderNode: React.FC<{
        id: string;
        data: { name: string };
        selected: boolean;
        specification: unknown;
      }>;
    }
  ).renderNode;

  const renderNodeCard = (configOverrides?: (cfg: Record<string, unknown>) => void) => {
    seedNode();
    if (configOverrides) {
      const node = mockGraphStore.decisionGraph?.nodes.find((item) => item.id === NODE_ID);
      const cfg = (node?.content as { config?: Record<string, unknown> }).config;
      configOverrides(cfg ?? {});
    }
    render(<NodeView id={NODE_ID} data={{ name: '当前日期1' }} selected={false} specification={{}} />);
  };

  test('renders kind badge, key label, simulated value and opens the tab from the edit action', () => {
    mockGraphStore.simulate = {
      result: { trace: { [NODE_ID]: { output: { result: '2026-09-01' } } } },
    } as never;
    renderNodeCard();

    expect(screen.getByText('current_date')).toBeDefined();
    expect(screen.getByText('result')).toBeDefined();
    expect(screen.getByText('2026-09-01')).toBeDefined();

    fireEvent.click(screen.getByText('编辑'));
    expect(openTabCalls).toEqual([NODE_ID]);
  });

  test('renders the locked corner badge when config.locked is set', () => {
    renderNodeCard();

    expect(screen.getByTitle('专属 UI 节点')).toBeDefined();
  });

  test('hides the corner badge without config.locked', () => {
    renderNodeCard((cfg) => {
      delete cfg.locked;
    });

    expect(screen.queryByTitle('专属 UI 节点')).toBeNull();
  });

  test('shows placeholder when not simulated', () => {
    renderNodeCard();

    expect(screen.getByText('运行仿真查看')).toBeDefined();
  });
});
