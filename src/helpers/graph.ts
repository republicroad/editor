export type Position = {
  x: number;
  y: number;
};

export type DecisionNode = {
  id: string;

  name: string;
  description?: string;
  type?: string;
  content?: unknown;
  position: Position;
};

export type DecisionEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  type?: string;
  sourceHandle?: string;
};

export type DecisionContent = {
  nodes: DecisionNode[];
  edges: DecisionEdge[];
};

const LEGACY_OPERATOR_SEPARATOR = /;;(?=(?:[^"'`]*["'`][^"'`]*["'`])*[^"'`]*$)/;

const normalizeExpressionValue = (value: unknown): unknown => {
  if (typeof value === 'string' && value.includes(';;')) {
    return value.split(LEGACY_OPERATOR_SEPARATOR);
  }

  return value;
};

export const normalizeGraphNodes = (nodes: DecisionNode[]): DecisionNode[] =>
  nodes.map((node) => {
    if (node.type !== 'customNode') {
      return node;
    }

    const content = node.content as { config?: any } | undefined;
    const config = content?.config;
    if (!config || !Array.isArray(config.expressions)) {
      return node;
    }

    return {
      ...node,
      content: {
        ...content,
        config: {
          ...config,
          expressions: config.expressions.map((expr: any) => ({
            ...expr,
            value: normalizeExpressionValue(expr?.value),
          })),
          expr_asts: Array.isArray(config.expr_asts)
            ? config.expr_asts.map((ast: any) => ({ ...ast, value: normalizeExpressionValue(ast?.value) }))
            : config.expr_asts,
        },
      },
    };
  });
