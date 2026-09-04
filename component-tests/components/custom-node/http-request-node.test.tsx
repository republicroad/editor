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

const { cleanup, fireEvent, render, screen, within } = await import('@testing-library/react');
const { HttpRequestTab, httpRequestNode } =
  await import('../../../jdm-editor/packages/appshell/src/components/custom-node/http-request-node');
const { serializeAuthExpr, toHttpRequestValue } =
  await import('../../../jdm-editor/packages/appshell/src/lib/http-request-protocol');

import type { HttpRequestFields } from '../../../jdm-editor/packages/appshell/src/lib/http-request-protocol';

const NODE_ID = 'node-1';

const makeExpr = (id: string, key: string, fields: Partial<HttpRequestFields> = {}) => ({
  id,
  key,
  value: toHttpRequestValue({
    urlExpr: '',
    method: 'GET',
    headersExpr: '',
    bodyExpr: '',
    paramsExpr: '',
    timeoutExpr: '',
    retryExpr: '',
    authExpr: '',
    ...fields,
  }),
});

const seedRequests = (expressions: ReturnType<typeof makeExpr>[], passThrough = true) => {
  seedGraph(
    mockCustomNode(NODE_ID, {
      inputField: null,
      outputPath: null,
      passThrough,
      expressions,
    }),
  );
};

const renderTab = () => render(<HttpRequestTab id={NODE_ID} />);

const configExpressions = () => {
  const node = mockGraphStore.decisionGraph?.nodes.find((item) => item.id === NODE_ID);
  return (node?.content as { config?: { expressions?: unknown[] } } | undefined)?.config?.expressions ?? [];
};

const clickTab = (name: string) => {
  const tab = screen.getByRole('tab', { name });
  fireEvent.mouseDown(tab);
  fireEvent.click(tab);
};
afterEach(() => {
  cleanup();
  resetJdmMock();
});

describe('HttpRequestTab', () => {
  test('renders request list rows and detail pane for the selected request', () => {
    seedRequests([
      makeExpr('e1', 'result', { urlExpr: '"https://api.example.com/a"', method: 'POST' }),
      makeExpr('e2', 'result2', { urlExpr: '"https://api.example.com/b"', method: 'GET' }),
    ]);
    renderTab();

    expect(screen.getByText('POST · https://api.example.com/a')).toBeDefined();
    expect(screen.getByText('GET · https://api.example.com/b')).toBeDefined();
    expect(screen.getByText('HTTP 请求 1')).toBeDefined();
    const keyInput = screen.getByPlaceholderText('result') as HTMLInputElement;
    expect(keyInput.value).toBe('result');
  });

  test('selecting another request row switches the detail pane', () => {
    seedRequests([
      makeExpr('e1', 'result', { urlExpr: '"https://api.example.com/a"' }),
      makeExpr('e2', 'result2', { urlExpr: '"https://api.example.com/b"' }),
    ]);
    renderTab();

    fireEvent.click(screen.getByText('GET · https://api.example.com/b'));

    expect(screen.getByText('HTTP 请求 2')).toBeDefined();
    expect((screen.getByPlaceholderText('result') as HTMLInputElement).value).toBe('result2');
  });

  test('add request appends a default GET expression and selects it', () => {
    seedRequests([makeExpr('e1', 'result', { urlExpr: '"https://api.example.com/a"' })]);
    renderTab();

    fireEvent.click(screen.getByText('添加请求'));

    const expressions = configExpressions();
    expect(expressions).toHaveLength(2);
    expect(screen.getByText('HTTP 请求 2')).toBeDefined();
  });

  test('remove request deletes the expression from config', () => {
    seedRequests([
      makeExpr('e1', 'result', { urlExpr: '"https://api.example.com/a"' }),
      makeExpr('e2', 'result2', { urlExpr: '"https://api.example.com/b"' }),
    ]);
    renderTab();

    fireEvent.click(screen.getByLabelText('删除请求 2'));

    expect(configExpressions()).toHaveLength(1);
    expect(screen.getByText('HTTP 请求 1')).toBeDefined();
  });

  test('editing url persists into node config', () => {
    seedRequests([makeExpr('e1', 'result')]);
    renderTab();

    fireEvent.change(screen.getByLabelText('code-editor'), { target: { value: '"https://x.dev"' } });

    const first = configExpressions()[0] as { value: string[] };
    expect(first.value[1]).toBe('"https://x.dev"');
  });

  test('editing output key persists into node config', () => {
    seedRequests([makeExpr('e1', 'result')]);
    renderTab();

    fireEvent.change(screen.getByPlaceholderText('result'), { target: { value: 'results' } });

    const first = configExpressions()[0] as { key: string };
    expect(first.key).toBe('results');
  });

  test('method select trigger shows the configured method', () => {
    seedRequests([makeExpr('e1', 'result', { method: 'POST' })]);
    renderTab();

    const trigger = screen.getByRole('combobox', { name: 'HTTP 方法' });
    expect(within(trigger).getByText('POST')).toBeDefined();
  });

  test('advanced tab exposes timeout and retry inputs with persisted values', () => {
    seedRequests([makeExpr('e1', 'result', { timeoutExpr: '5000', retryExpr: '2' })]);
    renderTab();

    clickTab('高级');

    expect((screen.getByPlaceholderText('10000') as HTMLInputElement).value).toBe('5000');
    expect((screen.getByPlaceholderText('0') as HTMLInputElement).value).toBe('2');
  });

  test('params tab renders key value editor for query parameters', () => {
    seedRequests([makeExpr('e1', 'result', { paramsExpr: '{ page: input.page }' })]);
    renderTab();

    clickTab('Params');

    expect(screen.getByText('Params(查询参数)')).toBeDefined();
    expect((screen.getAllByPlaceholderText('名称')[0] as HTMLInputElement).value).toBe('page');
  });

  test('GET requests mark body tab as ignored with an info alert', () => {
    seedRequests([makeExpr('e1', 'result', { method: 'GET' })]);
    renderTab();

    expect(screen.getByRole('tab', { name: 'Body(忽略)' })).toBeDefined();
    clickTab('Body(忽略)');

    expect(screen.getByText('GET 请求不发送请求体')).toBeDefined();
  });

  test('basic auth renders structured username and password editors', () => {
    seedRequests([
      makeExpr('e1', 'result', {
        authExpr: serializeAuthExpr({ mode: 'basic', username: 'u1', passwordExpr: '"pw"', tokenExpr: '' }),
      }),
    ]);
    renderTab();

    clickTab('高级');

    expect(screen.getByText('用户名')).toBeDefined();
    expect((screen.getByPlaceholderText('username') as HTMLInputElement).value).toBe('u1');
    expect((screen.getByPlaceholderText('"pw" 或 input.password') as HTMLTextAreaElement).value).toBe('"pw"');
  });

  test('custom auth expression keeps structured editing disabled', () => {
    seedRequests([makeExpr('e1', 'result', { authExpr: 'input.auth' })]);
    renderTab();

    clickTab('高级');

    expect(screen.getByText('认证配置为自定义表达式，已按原样保留，结构化编辑不可用')).toBeDefined();
  });

  test('simulate response pane shows placeholder, error, and body states', () => {
    seedRequests([makeExpr('e1', 'result', { urlExpr: '"https://api.example.com/a"' })]);
    renderTab();

    expect(screen.getByText('运行模拟后在此显示响应')).toBeDefined();
    cleanup();

    mockGraphStore.simulate = {
      result: { trace: { [NODE_ID]: { output: { result: { error: 'boom' } } } } },
    };
    renderTab();
    expect(screen.getByText('boom')).toBeDefined();
    cleanup();

    mockGraphStore.simulate = {
      result: {
        trace: {
          [NODE_ID]: { output: { result: { status: 200, headers: { 'x-a': '1' }, body: { ok: true } } } },
        },
      },
    };
    renderTab();
    expect(screen.getAllByText('200').length).toBeGreaterThan(0);
    expect(screen.getByText(/"ok": true/)).toBeDefined();
  });

  test('empty config shows placeholder and add request creates the first entry', () => {
    seedRequests([]);
    renderTab();

    expect(screen.getByText('尚未配置请求，点击左侧「添加请求」。')).toBeDefined();

    fireEvent.click(screen.getByText('添加请求'));

    expect(configExpressions()).toHaveLength(1);
    expect(screen.getByText('HTTP 请求 1')).toBeDefined();
  });
});

describe('HttpRequestNode canvas card', () => {
  const NodeView = (
    httpRequestNode as unknown as {
      renderNode: React.FC<{
        id: string;
        data: { name: string };
        selected: boolean;
        specification: unknown;
      }>;
    }
  ).renderNode;

  const renderNodeCard = () =>
    render(<NodeView id={NODE_ID} data={{ name: 'HTTP 请求1' }} selected={false} specification={{}} />);

  test('renders method badges, urls, count, and opens the tab from the edit action', () => {
    seedRequests([
      makeExpr('e1', 'result', { urlExpr: '"https://api.example.com/a"', method: 'POST' }),
      makeExpr('e2', 'result2', { urlExpr: '"https://api.example.com/b"', method: 'GET' }),
    ]);
    renderNodeCard();

    expect(screen.getByTestId('graph-node-name').textContent).toContain('HTTP 请求1');
    expect(screen.getByText('http_request')).toBeDefined();
    expect(screen.getByText('POST')).toBeDefined();
    expect(screen.getByText('GET')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();

    fireEvent.click(screen.getByText('编辑'));
    expect(openTabCalls).toEqual([NODE_ID]);
  });

  test('renders empty state and simulation status badge', () => {
    seedRequests([]);
    renderNodeCard();

    expect(screen.getByText('未配置请求')).toBeDefined();

    cleanup();
    mockGraphStore.simulate = {
      result: { trace: { [NODE_ID]: { output: { result: { status: 200 } } } } },
    };
    seedRequests([makeExpr('e1', 'result', { urlExpr: '"https://api.example.com/a"' })]);
    renderNodeCard();

    expect(screen.getByText('200')).toBeDefined();
  });
});
