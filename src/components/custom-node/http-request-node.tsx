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
import { CodeIcon, GlobeIcon, Rows3Icon } from 'lucide-react';
import React, { useState } from 'react';

import { parseOperatorArgs, uid } from '../../lib/custom-node-registry';
import type { CustomNodeConfig, CustomNodeExpression } from '../../lib/custom-node-types';
import PlusCircleIcon from '../../reui/icons/default/outline/plus-circle';
import TrashSquareIcon from '../../reui/icons/default/outline/trash-square';
import { Alert, AlertDescription } from '../reui/alert';
import { Badge } from '../reui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import css from './custom-node.module.css';

const KIND = 'contrib.http_request';

const UDF_FUNC = 'http_request';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

type MethodBadgeVariant = 'info-light' | 'primary-light' | 'warning-light' | 'destructive-light' | 'secondary';

const METHOD_BADGES: Record<HttpMethod, MethodBadgeVariant> = {
  GET: 'info-light',
  POST: 'primary-light',
  PUT: 'warning-light',
  PATCH: 'warning-light',
  DELETE: 'destructive-light',
  HEAD: 'secondary',
  OPTIONS: 'secondary',
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

const nextExprKey = (list: CustomNodeExpression[]): string => {
  const used = new Set(list.map((item) => item.key));
  let index = list.length + 1;
  while (used.has(`result${index}`)) {
    index += 1;
  }
  return `result${index}`;
};

interface RequestResult {
  status?: unknown;
  error?: unknown;
  headers?: unknown;
  body?: unknown;
}

const useNodeConfig = (id: string): CustomNodeConfig | undefined =>
  useDecisionGraphState(({ decisionGraph }) => {
    const config = (decisionGraph?.nodes ?? []).find((node) => node.id === id)?.content?.config;
    return config as CustomNodeConfig | undefined;
  });

const useSimulateOutput = (id: string): Record<string, unknown> | undefined =>
  useDecisionGraphState(({ simulate }) => simulate?.result?.trace?.[id]?.output as Record<string, unknown>);

const Hint: React.FC<{ label: string; children: React.ReactElement }> = ({ label, children }) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="max-w-72 break-all text-xs">{label}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

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
      <Hint label={error}>
        <span tabIndex={0}>
          <Badge variant="destructive" size="xs" radius="full">
            ERR
          </Badge>
        </span>
      </Hint>
    );
  }
  const variant = status >= 500 ? 'destructive' : status >= 400 ? 'warning' : status >= 300 ? 'info' : 'success';
  return (
    <Badge variant={variant} size="xs" radius="full">
      {status}
    </Badge>
  );
};

interface HeaderRow {
  key: string;
  valueExpr: string;
}

const isIdentKey = (key: string): boolean => /^[A-Za-z_$][\w$]*$/.test(key);

const serializeHeaderKey = (key: string): string => (isIdentKey(key) ? key : JSON.stringify(key));

const splitTopLevel = (text: string, separator: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let quoteChar: string | null = null;
  let escaped = false;
  let current = '';
  for (const ch of text) {
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }
    if (quoteChar) {
      current += ch;
      if (ch === '\\') {
        escaped = true;
      } else if (ch === quoteChar) {
        quoteChar = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quoteChar = ch;
      current += ch;
      continue;
    }
    if ('{[('.includes(ch)) {
      depth += 1;
      current += ch;
      continue;
    }
    if ('}])'.includes(ch)) {
      depth -= 1;
      current += ch;
      continue;
    }
    if (ch === separator && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  parts.push(current);
  return parts;
};

const findTopLevelColon = (text: string): number => {
  let depth = 0;
  let quoteChar: string | null = null;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const ch = text[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quoteChar) {
      if (ch === '\\') {
        escaped = true;
      } else if (ch === quoteChar) {
        quoteChar = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quoteChar = ch;
      continue;
    }
    if ('{[('.includes(ch)) {
      depth += 1;
    } else if ('}])'.includes(ch)) {
      depth -= 1;
    } else if (ch === ':' && depth === 0) {
      return index;
    }
  }
  return -1;
};

const unquoteHeaderKey = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    try {
      return JSON.parse(trimmed) as string;
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  if (isIdentKey(trimmed)) {
    return trimmed;
  }
  return null;
};

export const parseHeaderRows = (expr: string): HeaderRow[] | null => {
  const trimmed = expr.trim();
  if (!trimmed) {
    return [];
  }
  if (!(trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    return null;
  }
  const inner = trimmed.slice(1, -1).trim();
  if (!inner) {
    return [];
  }
  const rows: HeaderRow[] = [];
  for (const part of splitTopLevel(inner, ',')) {
    const piece = part.trim();
    if (!piece) {
      continue;
    }
    const colonIndex = findTopLevelColon(piece);
    if (colonIndex < 0) {
      return null;
    }
    const key = unquoteHeaderKey(piece.slice(0, colonIndex));
    const valueExpr = piece.slice(colonIndex + 1).trim();
    if (key === null) {
      return null;
    }
    rows.push({ key, valueExpr });
  }
  return rows;
};

const serializeHeaderRows = (rows: HeaderRow[]): string => {
  const kept = rows.filter((row) => row.key.trim() !== '' || row.valueExpr.trim() !== '');
  if (kept.length === 0) {
    return '';
  }
  const body = kept.map((row) => `${serializeHeaderKey(row.key)}: ${row.valueExpr}`).join(', ');
  return `{ ${body} }`;
};

const HeadersEditor: React.FC<{ value: string; onChange: (next: string) => void }> = ({ value, onChange }) => {
  const [mode, setMode] = useState<'structured' | 'raw'>(() =>
    parseHeaderRows(value) !== null ? 'structured' : 'raw',
  );
  const [hint, setHint] = useState('');
  const [rows, setRows] = useState<HeaderRow[]>(() => parseHeaderRows(value) ?? []);
  const [syncedValue, setSyncedValue] = useState(value);
  const [lastEmitted, setLastEmitted] = useState<string | null>(null);

  if (syncedValue !== value && mode === 'structured') {
    const isOwnEcho = lastEmitted !== null && lastEmitted === value.trim();
    if (!isOwnEcho) {
      setSyncedValue(value);
      const parsed = parseHeaderRows(value);
      if (parsed === null) {
        setHint('');
        setMode('raw');
      } else {
        setRows(parsed);
      }
    }
  }

  const writeRows = (next: HeaderRow[]) => {
    setRows(next);
    const serialized = serializeHeaderRows(next);
    setLastEmitted(serialized.trim());
    onChange(serialized);
  };

  const toggleMode = () => {
    if (mode === 'structured') {
      setHint('');
      setMode('raw');
      return;
    }
    const parsed = parseHeaderRows(value);
    if (parsed !== null) {
      setHint('');
      setLastEmitted(null);
      setRows(parsed);
      setMode('structured');
    } else {
      setHint('当前内容无法解析为键值对，请检查对象字面量语法');
    }
  };

  return (
    <div className={css.form}>
      <div className={css.httpHeaderLine}>
        <span className="text-xs text-muted-foreground">Headers(键值对)</span>
        <Hint label={mode === 'structured' ? '原始表达式模式' : '结构化模式'}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            aria-label={mode === 'structured' ? '原始表达式模式' : '结构化模式'}
            onClick={toggleMode}
          >
            {mode === 'structured' ? <CodeIcon /> : <Rows3Icon />}
          </Button>
        </Hint>
      </div>
      {mode === 'structured' ? (
        <>
          <div className={css.form}>
            {rows.map((row, index) => (
              <div className={css.httpKeyValueRow} key={index}>
                <Input
                  className="h-7 px-2 text-xs"
                  placeholder="名称"
                  value={row.key}
                  onChange={(event) => {
                    const next = [...rows];
                    next[index] = { ...row, key: event.target.value };
                    writeRows(next);
                  }}
                />
                <CodeEditor
                  value={row.valueExpr}
                  onChange={(nextValue) => {
                    const next = [...rows];
                    next[index] = { ...row, valueExpr: nextValue };
                    writeRows(next);
                  }}
                  placeholder="值(Zen 表达式)"
                  maxRows={1}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  aria-label="删除 Header"
                  onClick={() => writeRows(rows.filter((_, rowIndex) => rowIndex !== index))}
                >
                  <TrashSquareIcon />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 border-dashed text-xs"
            onClick={() => writeRows([...rows, { key: '', valueExpr: '' }])}
          >
            <PlusCircleIcon />
            添加 Header
          </Button>
        </>
      ) : (
        <CodeEditor
          value={value}
          onChange={(nextValue) => {
            setHint('');
            onChange(nextValue);
          }}
          placeholder={'{"Authorization": "Bearer " + input.token} 或 input.headers'}
          maxRows={3}
        />
      )}
      {hint && <p className="text-xs text-destructive">{hint}</p>}
    </div>
  );
};

interface HttpInstanceRowProps {
  index: number;
  expr: CustomNodeExpression;
  selected: boolean;
  result?: RequestResult;
  onSelect: () => void;
  onRemove: () => void;
}

const HttpInstanceRow: React.FC<HttpInstanceRowProps> = ({ index, expr, selected, result, onSelect, onRemove }) => {
  const fields = parseHttpRequest(expr);
  const trimmedUrl = fields.urlExpr.trim();
  const displayUrl = unquote(trimmedUrl) || trimmedUrl || '未配置 URL';

  return (
    <div className={`${css.listRow}${selected ? ` ${css.listRowSelected} bg-primary/10` : ''}`} onClick={onSelect}>
      <div className={css.listRowHeader}>
        <span className="text-xs font-medium">请求 {index + 1}</span>
        <div className={css.listRowActions}>
          <StatusBadge result={result} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            aria-label={`删除请求 ${index + 1}`}
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
          >
            <TrashSquareIcon />
          </Button>
        </div>
      </div>
      <div className={css.listRowValue}>{`${fields.method} · ${displayUrl}`}</div>
    </div>
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

  const expressions: CustomNodeExpression[] = config?.expressions ?? [];

  return (
    <GraphNode
      id={id}
      specification={specification}
      name={data.name}
      isSelected={selected}
      noBodyPadding
      actions={[
        <Button
          key="edit-http-request"
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={() => graphActions.openTab(id)}
        >
          编辑
        </Button>,
      ]}
    >
      <div className={css.summary}>
        <span className={css.kind}>{KIND}</span>
        <div className={css.rows}>
          {expressions.length === 0 && (
            <div className={css.row}>
              <span className={css.rowValue}>未配置请求</span>
            </div>
          )}
          {expressions.map((item) => {
            const itemFields = parseHttpRequest(item);
            const itemUrl = itemFields.urlExpr.trim();
            const displayUrl = unquote(itemUrl) || itemUrl || '未配置 URL';
            const itemResult = output?.[item.key] as RequestResult | undefined;
            return (
              <div className={css.row} key={item.id}>
                <Badge variant={METHOD_BADGES[itemFields.method]} size="sm">
                  {itemFields.method}
                </Badge>
                <span className={css.rowValue} title={displayUrl}>
                  {displayUrl}
                </span>
                <StatusBadge result={itemResult} />
              </div>
            );
          })}
        </div>
        <div className={css.returns}>
          <span className="text-xs text-muted-foreground">请求次数</span>
          <span className="text-xs">{expressions.length}</span>
        </div>
      </div>
    </GraphNode>
  );
};

export const HttpRequestTab: React.FC<{ id: string }> = ({ id }) => {
  const graphActions = useDecisionGraphActions();
  const config = useNodeConfig(id);
  const output = useSimulateOutput(id);

  const expressions: CustomNodeExpression[] = config?.expressions ?? [];
  const [selectedIndex, setSelectedIndex] = useState(0);
  if (selectedIndex >= expressions.length) {
    setSelectedIndex(expressions.length > 0 ? expressions.length - 1 : -1);
  }
  const selected = selectedIndex >= 0 ? expressions[selectedIndex] : undefined;
  const fields = parseHttpRequest(selected);
  const result = selected ? (output?.[selected.key] as RequestResult | undefined) : undefined;
  const bodyIgnored = fields.method === 'GET' || fields.method === 'HEAD';

  const persistConfig = (next: CustomNodeExpression[]) => {
    graphActions.updateNode(id, (draft) => {
      draft.content.config = {
        inputField: config?.inputField ?? null,
        outputPath: config?.outputPath ?? null,
        passThrough: config?.passThrough ?? true,
        expressions: next,
      };
      return draft;
    });
  };

  const updateSelected = (nextExpr: CustomNodeExpression) => {
    if (!selected) {
      return;
    }
    const updated = [...expressions];
    updated[selectedIndex] = nextExpr;
    persistConfig(updated);
  };

  const addRequest = () => {
    const next = [
      ...expressions,
      {
        id: uid(),
        key: nextExprKey(expressions),
        value: toHttpRequestValue({ urlExpr: '', method: 'GET', headersExpr: '', bodyExpr: '' }),
      },
    ];
    persistConfig(next);
    setSelectedIndex(next.length - 1);
  };

  const removeRequest = (index: number) => {
    persistConfig(expressions.filter((_, i) => i !== index));
  };

  const persistFields = (patch: Partial<HttpRequestFields>) => {
    if (!selected) {
      return;
    }
    updateSelected({ ...selected, value: toHttpRequestValue({ ...fields, ...patch }) });
  };

  const persistKey = (key: string) => {
    if (!selected) {
      return;
    }
    updateSelected({ ...selected, key });
  };

  return (
    <div className={css.tabSplit}>
      <div className={css.tabList}>
        <div className={css.listRows}>
          {expressions.map((item, index) => (
            <HttpInstanceRow
              key={item.id}
              index={index}
              expr={item}
              selected={index === selectedIndex}
              result={output?.[item.key] as RequestResult | undefined}
              onSelect={() => setSelectedIndex(index)}
              onRemove={() => removeRequest(index)}
            />
          ))}
        </div>
        <div className={css.listAdd}>
          <Button type="button" variant="outline" className="h-8 w-full border-dashed text-xs" onClick={addRequest}>
            <PlusCircleIcon />
            添加请求
          </Button>
        </div>
      </div>
      <div className={css.tabDetail}>
        {selected ? (
          <div className={css.httpSplit}>
            <div className={css.httpRequestPane}>
              <div className={`${css.form} max-w-[720px]`}>
                <span className="text-xs font-semibold">HTTP 请求 {selectedIndex + 1}</span>
                <div className="flex items-center gap-2">
                  <span className="flex-none text-xs text-muted-foreground">输出键</span>
                  <Input
                    className="h-8 text-xs"
                    placeholder="result"
                    value={selected.key}
                    onChange={(event) => persistKey(event.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={fields.method}
                    onValueChange={(value) => persistFields({ method: value as HttpMethod })}
                  >
                    <SelectTrigger aria-label="HTTP 方法" className="h-8 w-[110px] flex-none text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(HTTP_METHODS as readonly string[]).map((method) => (
                        <SelectItem key={method} value={method} className="text-xs">
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <CodeEditor
                    value={fields.urlExpr}
                    onChange={(value) => persistFields({ urlExpr: value })}
                    placeholder={'"https://api.example.com/users" 或 input.apiUrl'}
                    maxRows={1}
                  />
                </div>

                <HeadersEditor
                  key={selected.id}
                  value={fields.headersExpr}
                  onChange={(value) => persistFields({ headersExpr: value })}
                />

                <span className="text-xs text-muted-foreground">
                  Body{bodyIgnored ? `(${fields.method} 请求忽略)` : ''}
                </span>
                <CodeEditor
                  value={bodyIgnored ? '' : fields.bodyExpr}
                  onChange={(value) => persistFields({ bodyExpr: value })}
                  placeholder={'{"name": input.name} 或 input.payload'}
                  maxRows={6}
                  disabled={bodyIgnored}
                />
                {bodyIgnored && (
                  <Alert variant="info">
                    <GlobeIcon />
                    <AlertDescription>{`${fields.method} 请求不发送请求体`}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <div className={css.httpResponsePane}>
              <div className={css.httpHeaderLine}>
                <span className="text-xs font-semibold">模拟响应</span>
                <StatusBadge result={result} />
              </div>
              {!result ? (
                <p className="text-xs text-muted-foreground">运行模拟后在此显示响应</p>
              ) : typeof result.error === 'string' ? (
                <Alert variant="destructive">
                  <AlertDescription>{result.error}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <details>
                    <summary className="cursor-pointer text-xs">响应头</summary>
                    <pre className={css.httpMono}>{JSON.stringify(result.headers ?? {}, null, 2)}</pre>
                  </details>
                  <span className="text-xs text-muted-foreground">Body</span>
                  <pre className={css.httpMono}>{JSON.stringify(result.body ?? null, null, 2)}</pre>
                </>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">尚未配置请求，点击左侧「添加请求」。</p>
        )}
      </div>
    </div>
  );
};

export const httpRequestNode = createJdmNode({
  kind: KIND,
  displayName: 'HTTP 请求',
  group: 'contrib',
  shortDescription: '发起 HTTP 请求并返回响应(status / headers / body)，支持多个并行请求实例',
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
