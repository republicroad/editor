import { createJdmNode, jsonSchemaToVariableType } from '@gorules/jdm-editor';
import React from 'react';

import fallbackSchema from '../assets/custom-node-schema.json';

import { CustomNodeSummaryCard } from '../components/custom-node/custom-node-summary-card';
import css from '../components/custom-node/custom-node.module.css';
import CodeIcon from '../components/icons/code';
import FlashCircleIcon from '../components/icons/flash-circle';
import type { CustomFunctionTool, CustomNodeConfig, CustomNodeNamespace } from './custom-node-types';

const nodeIcon = (icon: React.ReactNode) => (
  <span className={css.nodeIcon} aria-hidden="true">
    {icon}
  </span>
);

const kindIcons: Record<string, React.ReactNode> = {
  'contrib.inout': nodeIcon(<FlashCircleIcon />),
};

const defaultIcon = nodeIcon(<CodeIcon />);

export const uid = (): string =>
  typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `expr-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const parseOperatorArgs = (expr: string | string[]): string[] => {
  if (Array.isArray(expr)) {
    return expr.map((s) => s.trim());
  }
  const pattern = /;;(?=(?:[^"'`]*["'`][^"'`]*["'`])*[^"'`]*$)/;
  return expr.split(pattern).map((s) => s.trim());
};

export const toFunctionCallValue = (toolName: string, args: string[]): string[] => [toolName, ...args];

export function defaultCustomNodeConfig(tool: CustomFunctionTool): CustomNodeConfig {
  const params = Object.entries(tool.parameters.properties ?? {});
  const expressions =
    params.length > 0
      ? [
          {
            id: uid(),
            key: tool.name,
            value: toFunctionCallValue(
              tool.name,
              params.map(([, prop]) => (prop.default == null ? '' : String(prop.default))),
            ),
          },
        ]
      : [{ id: uid(), key: tool.name, value: [tool.name] }];

  return {
    inputField: null,
    outputPath: null,
    passThrough: true,
    expressions,
  };
}

const firstLine = (text?: string): string | undefined => {
  const clean = text?.split('\n')[0]?.trim();
  return clean || undefined;
};

type SchemaToCustomNodesOptions = {
  summaryCard?: boolean;
};

export function schemaToCustomNodes(
  schema: CustomNodeNamespace[],
  options: SchemaToCustomNodesOptions = {},
): ReturnType<typeof createJdmNode>[] {
  return schema.flatMap((namespace) =>
    (namespace.tools ?? []).map((tool) => {
      const kind = `${namespace.name}.${tool.name}`;
      return createJdmNode({
        kind,
        displayName: tool.title || tool.name,
        group: namespace.title || namespace.name,
        shortDescription: firstLine(tool.description),
        icon: kindIcons[kind] ?? defaultIcon,
        generateNode: ({ index }) => ({
          name: `${kind}${index}`,
          config: defaultCustomNodeConfig(tool),
        }),
        renderNode: options.summaryCard
          ? ({ id, data, selected, specification }) => (
              <CustomNodeSummaryCard
                id={id}
                data={data}
                selected={selected}
                specification={specification}
                tool={tool}
              />
            )
          : undefined,
        inferTypes: {
          needsUpdate: (content, prevContent) => JSON.stringify(content) !== JSON.stringify(prevContent),
          determineOutputType: ({ input, content }) => {
            let determined = jsonSchemaToVariableType(tool.returns);
            const config = (content as { config?: { passThrough?: boolean } } | undefined)?.config;
            if (config?.passThrough) {
              determined = input.merge(determined);
            }
            return determined;
          },
        },
      });
    }),
  );
}

export async function fetchCustomNodeSchema(): Promise<CustomNodeNamespace[]> {
  try {
    const response = await fetch('/api/custom-nodes/schema', { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`schema request failed: ${response.status}`);
    }
    const json: unknown = await response.json();
    if (!Array.isArray(json)) {
      throw new Error('schema response is not an array');
    }
    return json as CustomNodeNamespace[];
  } catch (error) {
    console.warn('[custom-node] fetch schema failed, using bundled fallback', error);
    return fallbackSchema as CustomNodeNamespace[];
  }
}
