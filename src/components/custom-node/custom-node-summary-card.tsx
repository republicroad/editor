import {
  type MinimalNodeProps,
  type MinimalNodeSpecification,
  useDecisionGraphActions,
  useDecisionGraphState,
  GraphNode,
} from '@gorules/jdm-editor';
import React from 'react';

import { parseOperatorArgs } from '../../lib/custom-node-registry';
import type { CustomFunctionTool, CustomNodeConfig } from '../../lib/custom-node-types';
import { Button } from '../ui/button';
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
        <Button
          key="edit-expression"
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={() => graphActions.openTab(id)}
        >
          编辑表达式
        </Button>,
      ]}
    >
      <div className={css.summary}>
        <span className={css.kind}>{`${tool.namespace}.${tool.name}`}</span>
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
          <span className="text-xs text-muted-foreground">无参数调用</span>
        )}
        <div className={css.returns}>
          <span className="text-xs text-muted-foreground">{tool.returns.title ?? tool.returns.type ?? 'Any'}</span>
          {output !== undefined && <span className={`${css.traceValue} text-success`}>{JSON.stringify(output)}</span>}
        </div>
      </div>
    </GraphNode>
  );
};
