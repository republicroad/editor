import {
  CodeEditor,
  GraphNode,
  createJdmNode,
  jsonSchemaToVariableType,
  type MinimalNodeProps,
  type MinimalNodeSpecification,
  useDecisionGraphActions,
  useDecisionGraphState,
} from '@gorules/jdm-editor';
import { Alert, Button, Select, Tag, Tooltip, Typography } from 'antd';
import { GlobeIcon } from 'lucide-react';
import React from 'react';

import { parseOperatorArgs, uid } from '../../lib/custom-node-registry';
import type { CustomNodeConfig, CustomNodeExpression } from '../../lib/custom-node-types';
import { Badge } from '../reui/badge';
import css from './custom-node.module.css';

const KIND = 'contrib.http_request';

const UDF_FUNC = 'http_request';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'blue',
  POST: 'geekblue',
  PUT: 'gold',
  PATCH: 'orange',
  DELETE: 'red',
  HEAD: 'default',
  OPTIONS: 'purple',
};

const unquote = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed) as string;
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
};

const quote = (value: string): string => JSON.stringify(value);

const normalizeMethod = (value: string): HttpMethod => {
  const upper = value.trim().toUpperCase();
  return (HTTP_METHODS as readonly string[]).includes(upper) ? (upper as HttpMethod) : 'GET';
};

interface HttpRequestFields {
  urlExpr: string;
  method: HttpMethod;
  headersExpr: string;
  bodyExpr: string;
}

const parseHttpRequest = (expr?: CustomNodeExpression): HttpRequestFields => {
  const args = expr ? parseOperatorArgs(expr.value) : [];
  return {
    urlExpr: args[1] ?? '',
    method: normalizeMethod(unquote(args[2] ?? '')),
    headersExpr: args[3] ?? '',
    bodyExpr: args[4] ?? '',
  };
};

const toHttpRequestValue = (fields: HttpRequestFields): string[] => [
  UDF_FUNC,
  fields.urlExpr,
  quote(fields.method),
  fields.headersExpr,
  fields.bodyExpr,
];

interface RequestResult {
  status?: unknown;
  error?: unknown;
  body?: unknown;
}

const useNodeConfig = (id: string): CustomNodeConfig | undefined =>
  useDecisionGraphState(({ decisionGraph }) => {
    const config = (decisionGraph?.nodes ?? []).find((node) => node.id === id)?.content?.config;
    return config as CustomNodeConfig | undefined;
  });

const useSimulateOutput = (id: string): Record<string, unknown> | undefined =>
  useDecisionGraphState(({ simulate }) => simulate?.result?.trace?.[id]?.output as Record<string, unknown>);

const StatusBadge: React.FC<{ result?: RequestResult }> = ({ result }) => {
  if (!result || typeof result !== 'object') {
    return null;
  }
  const status = Number(result.status);
  const error = typeof result.error === 'string' ? result.error : undefined;
  if (!status) {
    if (!error) {
      return null;
    }
    return (
      <Tooltip title={error}>
        <Badge variant="destructive" size="xs" radius="full">
          ERR
        </Badge>
      </Tooltip>
    );
  }
  const variant = status >= 500 ? 'destructive' : status >= 400 ? 'warning' : status >= 300 ? 'info' : 'success';
  return (
    <Badge variant={variant} size="xs" radius="full">
      {status}
    </Badge>
  );
};

const HttpRequestNode: React.FC<MinimalNodeProps & { specification: MinimalNodeSpecification }> = ({
  id,
  data,
  selected,
  specification,
}) => {
  const graphActions = useDecisionGraphActions();
  const config = useNodeConfig(id);
  const output = useSimulateOutput(id);

  const expr = config?.expressions?.[0];
  const fields = parseHttpRequest(expr);
  const result = (expr ? output?.[expr.key] : undefined) as RequestResult | undefined;
  const trimmedUrl = fields.urlExpr.trim();
  const displayUrl = unquote(trimmedUrl) || trimmedUrl || '未配置 URL';

  return (
    <GraphNode
      id={id}
      specification={specification}
      name={data.name}
      isSelected={selected}
      noBodyPadding
      actions={[
        <Button key="edit-http-request" type="text" onClick={() => graphActions.openTab(id)}>
          编辑
        </Button>,
      ]}
    >
      <div className={css.summary}>
        <Typography.Text className={css.kind}>{KIND}</Typography.Text>
        <div className={css.row}>
          <Tag color={METHOD_COLORS[fields.method]} style={{ marginInlineEnd: 0 }}>
            {fields.method}
          </Tag>
          <span className={css.rowValue} title={displayUrl}>
            {displayUrl}
          </span>
          <StatusBadge result={result} />
        </div>
        {typeof result?.error === 'string' && (
          <Typography.Text type="danger" style={{ fontSize: 12 }}>
            {result.error}
          </Typography.Text>
        )}
        <div className={css.returns}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            响应结构
          </Typography.Text>
          <Typography.Text style={{ fontSize: 12 }}>{'{ status, headers, body }'}</Typography.Text>
        </div>
      </div>
    </GraphNode>
  );
};

export const HttpRequestTab: React.FC<{ id: string }> = ({ id }) => {
  const graphActions = useDecisionGraphActions();
  const config = useNodeConfig(id);
  const output = useSimulateOutput(id);

  const expr: CustomNodeExpression | undefined = config?.expressions?.[0];
  const fields = parseHttpRequest(expr);
  const result = expr ? (output?.[expr.key] as RequestResult | undefined) : undefined;
  const bodyIgnored = fields.method === 'GET' || fields.method === 'HEAD';

  const persistFields = (patch: Partial<HttpRequestFields>) => {
    const nextValue = toHttpRequestValue({ ...fields, ...patch });
    const nextExpressions: CustomNodeExpression[] = [
      { id: expr?.id ?? uid(), key: expr?.key ?? 'result', value: nextValue },
    ];
    graphActions.updateNode(id, (draft) => {
      draft.content.config = {
        inputField: config?.inputField ?? null,
        outputPath: config?.outputPath ?? null,
        passThrough: config?.passThrough ?? true,
        expressions: nextExpressions,
      };
      return draft;
    });
  };

  return (
    <div className={css.tabDetail}>
      <div className={css.form} style={{ maxWidth: 720 }}>
        <Typography.Text strong style={{ fontSize: 12 }}>
          HTTP 请求 · 输出键：{expr?.key ?? 'result'}
        </Typography.Text>
        <div style={{ display: 'flex', gap: 8 }}>
          <Select
            value={fields.method}
            onChange={(value) => persistFields({ method: value })}
            options={(HTTP_METHODS as readonly string[]).map((method) => ({ value: method, label: method }))}
            style={{ width: 110, flex: 'none' }}
          />
          <CodeEditor
            value={fields.urlExpr}
            onChange={(value) => persistFields({ urlExpr: value })}
            placeholder={'"https://api.example.com/users" 或 input.apiUrl'}
            maxRows={1}
          />
        </div>

        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Headers（对象字面量或表达式）
        </Typography.Text>
        <CodeEditor
          value={fields.headersExpr}
          onChange={(value) => persistFields({ headersExpr: value })}
          placeholder={'{"Authorization": "Bearer " + input.token} 或 input.headers'}
          maxRows={3}
        />

        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Body{bodyIgnored ? `（${fields.method} 请求忽略）` : ''}
        </Typography.Text>
        <CodeEditor
          value={bodyIgnored ? '' : fields.bodyExpr}
          onChange={(value) => persistFields({ bodyExpr: value })}
          placeholder={'{"name": input.name} 或 input.payload'}
          maxRows={6}
          disabled={bodyIgnored}
        />
        {bodyIgnored && <Alert type="info" showIcon message={`${fields.method} 请求不发送请求体`} />}

        {result !== undefined && (
          <>
            <Typography.Text strong style={{ fontSize: 12 }}>
              模拟响应
            </Typography.Text>
            {typeof result.error === 'string' ? (
              <Alert type="error" showIcon message={result.error} />
            ) : (
              <>
                <div className={css.row}>
                  <span className={css.rowKey}>状态码</span>
                  <StatusBadge result={result} />
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: 8,
                    maxHeight: 240,
                    overflow: 'auto',
                    borderRadius: 6,
                    fontSize: 12,
                    fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
                  }}
                >
                  {JSON.stringify(result.body ?? null, null, 2)}
                </pre>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const httpRequestNode = createJdmNode({
  kind: KIND,
  displayName: 'HTTP 请求',
  group: 'contrib',
  shortDescription: '发起 HTTP 请求并返回响应（status / headers / body）',
  icon: <GlobeIcon className="size-4" />,
  generateNode: ({ index }) => ({
    name: `${KIND}${index}`,
    config: {
      inputField: null,
      outputPath: null,
      passThrough: true,
      expressions: [
        {
          id: uid(),
          key: 'result',
          value: toHttpRequestValue({ urlExpr: '', method: 'GET', headersExpr: '', bodyExpr: '' }),
        },
      ],
    },
  }),
  renderTab: ({ id }) => <HttpRequestTab id={id} />,
  renderNode: HttpRequestNode,
  inferTypes: {
    needsUpdate: (content, prevContent) => JSON.stringify(content) !== JSON.stringify(prevContent),
    determineOutputType: ({ input, content }) => {
      let determined = jsonSchemaToVariableType({ type: 'object' });
      const config = (content as { config?: { passThrough?: boolean } } | undefined)?.config;
      if (config?.passThrough) {
        determined = input.merge(determined);
      }
      return determined;
    },
  },
});
