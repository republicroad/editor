import type { CustomNodeSpecification } from '@gorules/jdm-editor';
import { useEffect, useMemo, useState } from 'react';

import { queryListNode } from '../components/custom-node/query-list-node';
import { customNodes as demoNodes } from '../context/customnode.tsx';
import { fetchCustomNodeSchema, schemaToCustomNodes } from '../lib/custom-node-registry';
import type { CustomNodeNamespace } from '../lib/custom-node-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 与 jdm-editor 内部 customNodes 类型约定一致
type CustomNodeSpec = CustomNodeSpecification<object, any>;

// 消费方自定义实现的节点 kind：从 schema 驱动结果中排除，避免侧边栏重复
const overriddenKinds = new Set(['risk.query_list']);

const filterOverridden = (schema: CustomNodeNamespace[]): CustomNodeNamespace[] =>
  schema
    .map((namespace) => ({
      ...namespace,
      tools: (namespace.tools ?? []).filter((tool) => !overriddenKinds.has(`${namespace.name}.${tool.name}`)),
    }))
    .filter((namespace) => namespace.tools.length > 0);

export function useCustomNodes(): {
  customNodes: CustomNodeSpec[];
  summaryCustomNodes: CustomNodeSpec[];
  schema: CustomNodeNamespace[] | null;
  ready: boolean;
} {
  const [schema, setSchema] = useState<CustomNodeNamespace[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchCustomNodeSchema().then((value) => {
      if (!cancelled) {
        setSchema(value);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const customNodes = useMemo<CustomNodeSpec[]>(
    () => (schema ? [...demoNodes, queryListNode, ...schemaToCustomNodes(filterOverridden(schema))] : demoNodes),
    [schema],
  );

  const summaryCustomNodes = useMemo<CustomNodeSpec[]>(
    () =>
      schema
        ? [...demoNodes, queryListNode, ...schemaToCustomNodes(filterOverridden(schema), { summaryCard: true })]
        : demoNodes,
    [schema],
  );

  return { customNodes, summaryCustomNodes, schema, ready: schema !== null };
}
