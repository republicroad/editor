import type { CustomNodeSpecification } from '@gorules/jdm-editor';
import { useEffect, useMemo, useState } from 'react';

import { cryptoNode } from '../components/custom-node/crypto-node';
import { httpRequestNode } from '../components/custom-node/http-request-node';
import { jsonPathNode } from '../components/custom-node/json-path-node';
import { queryListNode } from '../components/custom-node/query-list-node';
import { templateNode } from '../components/custom-node/template-node';
import { customNodes as demoNodes } from '../context/customnode.tsx';
import { fetchCustomNodeSchema, schemaToCustomNodes, type CustomNodeSchemaSource } from '../lib/custom-node-registry';
import type { CustomNodeNamespace } from '../lib/custom-node-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 与 jdm-editor 内部 customNodes 类型约定一致
type CustomNodeSpec = CustomNodeSpecification<object, any>;

// 消费方自定义实现的节点 kind：从 schema 驱动结果中排除，避免侧边栏重复
const overriddenKinds = new Set([
  'risk.query_list',
  'contrib.http_request',
  'contrib.crypto',
  'contrib.json_path',
  'contrib.template',
]);

const filterOverridden = (schema: CustomNodeNamespace[]): CustomNodeNamespace[] =>
  schema
    .map((namespace) => ({
      ...namespace,
      tools: (namespace.tools ?? []).filter((tool) => !overriddenKinds.has(`${namespace.name}.${tool.name}`)),
    }))
    .filter((namespace) => namespace.tools.length > 0);

export type UseCustomNodesOptions = {
  /** 自定义节点 schema 来源：默认同源 /api/custom-nodes/schema；可传自定义 URL 或加载函数(库复用) */
  schemaSource?: CustomNodeSchemaSource;
  /** 追加宿主自定义节点(置于内置业务节点之前、schema 驱动节点之前) */
  extraNodes?: CustomNodeSpec[];
  /** 排除内置 demo 展示节点(纯库复用场景) */
  excludeDemoNodes?: boolean;
};

const composeBaseNodes = (extraNodes?: CustomNodeSpec[], excludeDemoNodes?: boolean): CustomNodeSpec[] => [
  ...(excludeDemoNodes ? [] : demoNodes),
  ...(extraNodes ?? []),
  queryListNode,
  httpRequestNode,
  cryptoNode,
  jsonPathNode,
  templateNode,
];

export function useCustomNodes(options?: UseCustomNodesOptions): {
  customNodes: CustomNodeSpec[];
  summaryCustomNodes: CustomNodeSpec[];
  schema: CustomNodeNamespace[] | null;
  ready: boolean;
} {
  const { schemaSource, extraNodes, excludeDemoNodes } = options ?? {};
  const [schema, setSchema] = useState<CustomNodeNamespace[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchCustomNodeSchema(schemaSource).then((value) => {
      if (!cancelled) {
        setSchema(value);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [schemaSource]);

  const baseNodes = useMemo(() => composeBaseNodes(extraNodes, excludeDemoNodes), [extraNodes, excludeDemoNodes]);

  const customNodes = useMemo<CustomNodeSpec[]>(
    () => (schema ? [...baseNodes, ...schemaToCustomNodes(filterOverridden(schema))] : baseNodes),
    [baseNodes, schema],
  );

  const summaryCustomNodes = useMemo<CustomNodeSpec[]>(
    () =>
      schema ? [...baseNodes, ...schemaToCustomNodes(filterOverridden(schema), { summaryCard: true })] : baseNodes,
    [baseNodes, schema],
  );

  return { customNodes, summaryCustomNodes, schema, ready: schema !== null };
}
