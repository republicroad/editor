export interface JsonSchemaProperty {
  type?: string;
  title?: string;
  description?: string;
  default?: unknown;
  anyOf?: JsonSchemaProperty[];
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean | JsonSchemaProperty;
  $ref?: string;
  $defs?: Record<string, JsonSchemaProperty>;
  enum?: unknown[];
  format?: string;
  [key: string]: unknown;
}

export interface JsonSchema {
  type?: string;
  title?: string;
  description?: string;
  default?: unknown;
  anyOf?: JsonSchema[];
  items?: JsonSchema;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean | JsonSchemaProperty;
  $ref?: string;
  $defs?: Record<string, JsonSchemaProperty>;
  [key: string]: unknown;
}

export interface CustomFunctionTool {
  name: string;
  title: string;
  type: 'function';
  description?: string;
  parameters: {
    properties: Record<string, JsonSchemaProperty>;
    required?: string[];
    title?: string;
    type?: 'object';
  };
  returns: JsonSchema;
  namespace: string;
  kind: string;
}

export interface CustomNodeNamespace {
  type: 'namespace';
  title: string;
  name: string;
  description?: string;
  tools: CustomFunctionTool[];
}

export type CustomNodeExpression = {
  id: string;
  key: string;
  value: string | string[];
};

export type CustomNodeConfig = {
  inputField?: string | null;
  outputPath?: string | null;
  passThrough?: boolean;
  expressions: CustomNodeExpression[];
  __meta__?: Record<string, unknown>;
};
