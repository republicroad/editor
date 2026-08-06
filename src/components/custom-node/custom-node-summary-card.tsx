import {
  type MinimalNodeProps,
  type MinimalNodeSpecification,
  useDecisionGraphActions,
  useDecisionGraphState,
  GraphNode,
} from '@gorules/jdm-editor';
import { Button, Typography, theme } from 'antd';
import React from 'react';

import { parseOperatorArgs } from '../../lib/custom-node-registry';
import type { CustomFunctionTool, CustomNodeConfig } from '../../lib/custom-node-types';
import css from './custom-node.module.css';

type CustomNodeSummaryCardProps = MinimalNodeProps & {
  specification: MinimalNodeSpecification;
  tool: CustomFunctionTool;
};

export const CustomNodeSummaryCard: React.FC<CustomNodeSummaryCardProps> = ({
  id,
  data,
  selected,
  specification,
  tool,
}) => {
  const graphActions = useDecisionGraphActions();
  const { token } = theme.useToken();

  const { config, output } = useDecisionGraphState(({ decisionGraph, simulate }) => ({
    config: (decisionGraph?.nodes ?? []).find((node) => node.id === id)?.content?.config as
      | CustomNodeConfig
      | undefined,
    output: simulate?.result?.trace?.[id]?.output,
  }));

  const expr = config?.expressions?.[0];
  const params = Object.entries(tool.parameters.properties ?? {});
  const args = expr ? parseOperatorArgs(expr.value) : [];

  return (
    <GraphNode
      id={id}
      specification={specification}
      name={data.name}
      isSelected={selected}
      noBodyPadding
      actions={[
        <Button key="edit-expression" type="text" onClick={() => graphActions.openTab(id)}>
          编辑表达式
        </Button>,
      ]}
    >
      <div className={css.summary}>
        <Typography.Text className={css.kind}>{`${tool.namespace}.${tool.name}`}</Typography.Text>
        {params.length > 0 ? (
          <div className={css.rows}>
            {params.map(([key, prop], index) => (
              <div key={key} className={css.row}>
                <span className={css.rowKey}>{prop.title ?? key}</span>
                <span className={css.rowValue}>{args[index + 1] ?? ''}</span>
              </div>
            ))}
          </div>
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            无参数调用
          </Typography.Text>
        )}
        <div className={css.returns}>
          <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            {tool.returns.title ?? tool.returns.type ?? 'Any'}
          </Typography.Text>
          {output !== undefined && (
            <Typography.Text className={css.traceValue} style={{ color: token.colorSuccess }}>
              {JSON.stringify(output)}
            </Typography.Text>
          )}
        </div>
      </div>
    </GraphNode>
  );
};
