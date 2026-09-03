import {
  GraphNode,
  type MinimalNodeProps,
  type MinimalNodeSpecification,
  useDecisionGraphState,
} from '@republicroad/jdm-editor';
import React from 'react';

import { LockedCornerBadge } from '@republicroad/jdm-appshell';

type OceanNodeProps = MinimalNodeProps & { specification: MinimalNodeSpecification };

/**
 * ocean 皮肤对 current_date 画布卡的「UI 劫持」示范：
 * 宿主经 SkinDefinition.nodeOverrides 注入，完全接管节点外观（含仿真值回显）。
 */
export const OceanCurrentDateNode: React.FC<OceanNodeProps> = ({ id, data, selected, specification }) => {
  const config = useDecisionGraphState(
    ({ decisionGraph }) => (decisionGraph?.nodes ?? []).find((node) => node.id === id)?.content?.config,
  ) as { expressions?: { key?: string }[] } | undefined;
  const output = useDecisionGraphState(({ simulate }) => simulate?.result?.trace?.[id]?.output) as
    | Record<string, unknown>
    | undefined;

  const key = config?.expressions?.[0]?.key ?? 'result';
  const value = output?.[key];

  return (
    <GraphNode
      id={id}
      className="relative border-sky-300 bg-sky-50 dark:border-sky-700 dark:bg-sky-950"
      specification={specification}
      name={data.name}
      isSelected={selected}
      noBodyPadding
    >
      <LockedCornerBadge />
      <div className="flex flex-col gap-1.5 p-3">
        <span className="rounded bg-sky-600 px-1.5 py-0.5 text-center text-[10px] font-medium text-white">
          ocean 皮肤接管
        </span>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-mono text-sky-800 dark:text-sky-200">{key}</span>
          <span className="font-mono font-semibold text-sky-900 dark:text-sky-100">
            {value !== undefined && value !== null ? String(value) : '—'}
          </span>
        </div>
      </div>
    </GraphNode>
  );
};
