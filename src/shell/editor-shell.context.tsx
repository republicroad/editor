import React, { createContext, useContext, useMemo } from 'react';
import type { CustomNodeSpecification, UserResolver } from '@gorules/jdm-editor';

import { useCustomNodes } from '../hooks/useCustomNodes';
import { createAnonymousAdapter } from '../lib/auth/adapter';
import { createUserResolver } from '../lib/user-resolver';
import type { CustomNodeNamespace } from '../lib/custom-node-types';

import { createDefaultSimulate } from './default-simulate';
import type { EditorShellOptions, SimulateHandler } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 与 jdm-editor 内部 customNodes 类型约定一致
type CustomNodeSpec = CustomNodeSpecification<object, any>;

export interface EditorShellContextValue {
  customNodes: CustomNodeSpec[];
  summaryCustomNodes: CustomNodeSpec[];
  schema: CustomNodeNamespace[] | null;
  ready: boolean;
  userResolver: UserResolver;
  runSimulate: SimulateHandler;
}

const EditorShellContext = createContext<EditorShellContextValue | null>(null);

export const EditorShellProvider: React.FC<{ options?: EditorShellOptions; children: React.ReactNode }> = ({
  options,
  children,
}) => {
  const { schemaSource, authAdapter, simulate } = options ?? {};
  const { customNodes, summaryCustomNodes, schema, ready } = useCustomNodes({ schemaSource });

  const userResolver = useMemo(() => createUserResolver(authAdapter ?? createAnonymousAdapter()), [authAdapter]);
  const runSimulate = useMemo(() => simulate ?? createDefaultSimulate(), [simulate]);

  const value = useMemo<EditorShellContextValue>(
    () => ({ customNodes, summaryCustomNodes, schema, ready, userResolver, runSimulate }),
    [customNodes, summaryCustomNodes, schema, ready, userResolver, runSimulate],
  );

  return <EditorShellContext.Provider value={value}>{children}</EditorShellContext.Provider>;
};

export const useEditorShell = (): EditorShellContextValue => {
  const value = useContext(EditorShellContext);
  if (!value) {
    throw new Error('useEditorShell must be used within EditorShellProvider');
  }
  return value;
};
