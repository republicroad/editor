import type { CustomNodeSpecification } from '@gorules/jdm-editor';
import { useEffect, useMemo, useState } from 'react';

import { customNodes as demoNodes } from '../context/customnode.tsx';
import { fetchCustomNodeSchema, schemaToCustomNodes } from '../lib/custom-node-registry';
import type { CustomNodeNamespace } from '../lib/custom-node-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 与 jdm-editor 内部 customNodes 类型约定一致
type CustomNodeSpec = CustomNodeSpecification<object, any>;

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
    () => (schema ? [...demoNodes, ...schemaToCustomNodes(schema)] : demoNodes),
    [schema],
  );

  const summaryCustomNodes = useMemo<CustomNodeSpec[]>(
    () => (schema ? [...demoNodes, ...schemaToCustomNodes(schema, { summaryCard: true })] : demoNodes),
    [schema],
  );

  return { customNodes, summaryCustomNodes, schema, ready: schema !== null };
}
