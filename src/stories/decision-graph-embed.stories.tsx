import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

import { DecisionGraph, type DecisionGraphType } from '@gorules/jdm-editor';

import { httpRequestNode } from '../components/custom-node/http-request-node';
import { queryListNode } from '../components/custom-node/query-list-node';
import { toHttpRequestValue } from '../lib/http-request-protocol';

const meta: Meta<typeof DecisionGraph> = {
  title: 'Editor Shell/DecisionGraph 嵌入示范',
  component: DecisionGraph,
};

export default meta;

type Story = StoryObj<typeof DecisionGraph>;

const customNodes = [httpRequestNode, queryListNode];

const initialGraph: DecisionGraphType = {
  nodes: [
    { id: 'input', type: 'inputNode', position: { x: 40, y: 220 }, name: 'Request' },
    { id: 'output', type: 'outputNode', position: { x: 900, y: 220 }, name: 'Response' },
    {
      id: 'http-1',
      type: 'customNode',
      position: { x: 360, y: 100 },
      name: 'HTTP 请求',
      content: {
        name: 'contrib.http_request0',
        config: {
          inputField: null,
          outputPath: null,
          passThrough: true,
          expressions: [
            {
              id: 'expr-http-1',
              key: 'result',
              value: toHttpRequestValue({
                urlExpr: '"https://api.example.com/users"',
                method: 'POST',
                headersExpr: '{ Token: input.token }',
                bodyExpr: '{ name: input.name }',
                paramsExpr: '',
                timeoutExpr: '',
                retryExpr: '',
                authExpr: '',
              }),
            },
          ],
        },
      },
    },
    {
      id: 'query-1',
      type: 'customNode',
      position: { x: 360, y: 360 },
      name: '查询名单',
      content: {
        name: 'risk.query_list0',
        config: {
          inputField: null,
          outputPath: null,
          passThrough: true,
          expressions: [{ id: 'expr-query-1', key: 'result', value: ['query_list', JSON.stringify('ipv4_deny'), 'input.ip'] }],
        },
      },
    },
  ],
  edges: [
    { id: 'e1', sourceId: 'input', targetId: 'http-1', type: 'edge' },
    { id: 'e2', sourceId: 'input', targetId: 'query-1', type: 'edge' },
    { id: 'e3', sourceId: 'http-1', targetId: 'output', type: 'edge' },
    { id: 'e4', sourceId: 'query-1', targetId: 'output', type: 'edge' },
  ],
};

export const CustomNodesEmbedded: Story = {
  render: () => {
    const [value, setValue] = useState<DecisionGraphType>(initialGraph);

    return (
      <div style={{ height: '100vh' }}>
        <DecisionGraph
          customNodes={customNodes}
          value={value}
          onChange={(next) => setValue(next as DecisionGraphType)}
        />
      </div>
    );
  },
};
