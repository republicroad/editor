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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
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
  paramsExpr: string;
  timeoutExpr: string;
  retryExpr: string;
  authExpr: string;
}

const parseHttpRequest = (expr?: CustomNodeExpression): HttpRequestFields => {
  const args = expr ? parseOperatorArgs(expr.value) : [];
  return {
    urlExpr: args[1] ?? '',
    method: normalizeMethod(unquote(args[2] ?? '')),
    headersExpr: args[3] ?? '',
    bodyExpr: args[4] ?? '',
    paramsExpr: args[5] ?? '',
    timeoutExpr: args[6] ?? '',
    retryExpr: args[7] ?? '',
    authExpr: args[8] ?? '',
  };
};

/**
 * 变长序列化：可选尾部参数(params/timeout/retry/auth)按位置占位，末尾连续空值截断省略；
 * 中段空值保留空串占位以保证后续参数位置正确，后端对空串回退默认值。
 */
const toHttpRequestValue = (fields: HttpRequestFields): string[] => {
  const tail = [fields.paramsExpr, fields.timeoutExpr, fields.retryExpr, fields.authExpr];
  let end = tail.length;
  while (end > 0 && tail[end - 1].trim() === '') {
    end -= 1;
  }
  return [UDF_FUNC, fields.urlExpr, quote(fields.method), fields.headersExpr, fields.bodyExpr, ...tail.slice(0, end)];
};

type AuthMode = 'none' | 'basic' | 'bearer';

interface AuthState {
  mode: AuthMode;
  username: string;
  passwordExpr: string;
  tokenExpr: string;
}

const EMPTY_AUTH: AuthState = { mode: 'none', username: '', passwordExpr: '', tokenExpr: '' };

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

interface KeyValueRow {
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

export const parseObjectLiteralRows = (expr: string): KeyValueRow[] | null => {
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
  const rows: KeyValueRow[] = [];
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

const serializeObjectLiteralRows = (rows: KeyValueRow[]): string => {
  const kept = rows.filter((row) => row.key.trim() !== '' || row.valueExpr.trim() !== '');
  if (kept.length === 0) {
    return '';
  }
  const body = kept.map((row) => `${serializeHeaderKey(row.key)}: ${row.valueExpr}`).join(', ');
  return `{ ${body} }`;
};

/** 解析 auth 表达式为结构化状态；非对象字面量或无法识别的 type 返回 null(交由界面提示保留原文) */
const parseAuthState = (expr: string): AuthState | null => {
  const trimmed = expr.trim();
  if (!trimmed) {
    return EMPTY_AUTH;
  }
  const rows = parseObjectLiteralRows(trimmed);
  if (!rows) {
    return null;
  }
  const findRow = (key: string): string => rows.find((row) => row.key === key)?.valueExpr.trim() ?? '';
  const mode = unquote(findRow('type')) as AuthMode;
  if (mode !== 'basic' && mode !== 'bearer') {
    return null;
  }
  return {
    mode,
    username: unquote(findRow('username')),
    passwordExpr: findRow('password'),
    tokenExpr: findRow('token'),
  };
};

const serializeAuthExpr = (state: AuthState): string => {
  if (state.mode === 'none') {
    return '';
  }
  if (state.mode === 'basic') {
    const parts = ['type: "basic"'];
    if (state.username || state.passwordExpr) {
      parts.push(`username: ${quote(state.username)}`);
    }
    if (state.passwordExpr) {
      parts.push(`password: ${state.passwordExpr}`);
    }
    return `{ ${parts.join(', ')} }`;
  }
  const parts = ['type: "bearer"'];
  if (state.tokenExpr) {
    parts.push(`token: ${state.tokenExpr}`);
  }
  return `{ ${parts.join(', ')} }`;
};

interface KeyValueEditorProps {
  label: string;
  addLabel: string;
  deleteLabel: string;
  valuePlaceholder: string;
  rawPlaceholder: string;
  value: string;
  onChange: (next: string) => void;
}

const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  label,
  addLabel,
  deleteLabel,
  valuePlaceholder,
  rawPlaceholder,
  value,
  onChange,
}) => {
  const [mode, setMode] = useState<'structured' | 'raw'>(() =>
    parseObjectLiteralRows(value) !== null ? 'structured' : 'raw',
  );
  const [hint, setHint] = useState('');
  const [rows, setRows] = useState<KeyValueRow[]>(() => parseObjectLiteralRows(value) ?? []);
  const [syncedValue, setSyncedValue] = useState(value);
  const [lastEmitted, setLastEmitted] = useState<string | null>(null);

  if (syncedValue !== value && mode === 'structured') {
    const isOwnEcho = lastEmitted !== null && lastEmitted === value.trim();
    if (!isOwnEcho) {
      setSyncedValue(value);
      const parsed = parseObjectLiteralRows(value);
      if (parsed === null) {
        setHint('');
        setMode('raw');
      } else {
        setRows(parsed);
      }
    }
  }

  const writeRows = (next: KeyValueRow[]) => {
    setRows(next);
    const serialized = serializeObjectLiteralRows(next);
    setLastEmitted(serialized.trim());
    onChange(serialized);
  };

  const toggleMode = () => {
    if (mode === 'structured') {
      setHint('');
      setMode('raw');
      return;
    }
    const parsed = parseObjectLiteralRows(value);
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
        <span className="text-xs text-muted-foreground">{label}</span>
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
                  placeholder={valuePlaceholder}
                  maxRows={1}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  aria-label={deleteLabel}
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
            {addLabel}
          </Button>
        </>
      ) : (
        <CodeEditor
          value={value}
          onChange={(nextValue) => {
            setHint('');
            onChange(nextValue);
          }}
          placeholder={rawPlaceholder}
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
        value: toHttpRequestValue({
          urlExpr: '',
          method: 'GET',
          headersExpr: '',
          bodyExpr: '',
          paramsExpr: '',
          timeoutExpr: '',
          retryExpr: '',
          authExpr: '',
        }),
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

  const authState = selected ? parseAuthState(fields.authExpr) : null;

  const persistAuth = (patch: Partial<AuthState>) => {
    if (!authState) {
      return;
    }
    persistFields({ authExpr: serializeAuthExpr({ ...authState, ...patch }) });
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

                <Tabs defaultValue="headers" className="gap-2">
                  <TabsList className="h-7 w-fit bg-muted/50 p-0.5">
                    <TabsTrigger value="headers" className="h-6 px-2.5 text-xs">
                      Headers
                    </TabsTrigger>
                    <TabsTrigger value="body" className="h-6 px-2.5 text-xs">
                      {`Body${bodyIgnored ? '(忽略)' : ''}`}
                    </TabsTrigger>
                    <TabsTrigger value="params" className="h-6 px-2.5 text-xs">
                      Params
                    </TabsTrigger>
                    <TabsTrigger value="advanced" className="h-6 px-2.5 text-xs">
                      高级
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="headers">
                    <KeyValueEditor
                      key={`headers-${selected.id}`}
                      label="Headers(键值对)"
                      addLabel="添加 Header"
                      deleteLabel="删除 Header"
                      valuePlaceholder="值(Zen 表达式)"
                      rawPlaceholder={'{"Authorization": "Bearer " + input.token} 或 input.headers'}
                      value={fields.headersExpr}
                      onChange={(value) => persistFields({ headersExpr: value })}
                    />
                  </TabsContent>

                  <TabsContent value="body" className="flex flex-col gap-2">
                    {bodyIgnored ? (
                      <Alert variant="info">
                        <GlobeIcon />
                        <AlertDescription>{`${fields.method} 请求不发送请求体`}</AlertDescription>
                      </Alert>
                    ) : (
                      <CodeEditor
                        value={fields.bodyExpr}
                        onChange={(value) => persistFields({ bodyExpr: value })}
                        placeholder={'{"name": input.name} 或 input.payload'}
                        maxRows={8}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="params">
                    <KeyValueEditor
                      key={`params-${selected.id}`}
                      label="Params(查询参数)"
                      addLabel="添加参数"
                      deleteLabel="删除参数"
                      valuePlaceholder="值(Zen 表达式)"
                      rawPlaceholder={'{ page: input.page, size: 20 }'}
                      value={fields.paramsExpr}
                      onChange={(value) => persistFields({ paramsExpr: value })}
                    />
                  </TabsContent>

                  <TabsContent value="advanced" className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex-none text-xs text-muted-foreground">超时(ms)</span>
                      <Input
                        className="h-8 w-28 text-xs"
                        inputMode="numeric"
                        placeholder="10000"
                        value={fields.timeoutExpr}
                        onChange={(event) => persistFields({ timeoutExpr: event.target.value.replace(/[^\d]/g, '') })}
                      />
                      <span className="flex-none text-xs text-muted-foreground">重试(次)</span>
                      <Input
                        className="h-8 w-20 text-xs"
                        inputMode="numeric"
                        placeholder="0"
                        value={fields.retryExpr}
                        onChange={(event) => persistFields({ retryExpr: event.target.value.replace(/[^\d]/g, '') })}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      超时范围 100–60000ms，默认 10000；重试上限 5 次，仅网络异常/超时/5xx/429 触发并指数退避。
                    </p>
                    {authState ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex-none text-xs text-muted-foreground">认证</span>
                          <Select
                            value={authState.mode}
                            onValueChange={(value) =>
                              persistFields({ authExpr: serializeAuthExpr({ ...authState, mode: value as AuthMode }) })
                            }
                          >
                            <SelectTrigger aria-label="认证类型" className="h-8 w-28 flex-none text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" className="text-xs">
                                无认证
                              </SelectItem>
                              <SelectItem value="basic" className="text-xs">
                                Basic
                              </SelectItem>
                              <SelectItem value="bearer" className="text-xs">
                                Bearer
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-xs text-muted-foreground">headers 显式 Authorization 时优先生效</span>
                        </div>
                        {authState.mode === 'basic' && (
                          <div className="flex items-center gap-2">
                            <span className="flex-none w-10 text-xs text-muted-foreground">用户名</span>
                            <Input
                              className="h-8 min-w-0 flex-1 text-xs"
                              placeholder="username"
                              value={authState.username}
                              onChange={(event) => persistAuth({ username: event.target.value })}
                            />
                            <span className="flex-none text-xs text-muted-foreground">密码</span>
                            <div className="min-w-0 flex-1">
                              <CodeEditor
                                value={authState.passwordExpr}
                                onChange={(value) => persistAuth({ passwordExpr: value })}
                                placeholder={'"pw" 或 input.password'}
                                maxRows={1}
                              />
                            </div>
                          </div>
                        )}
                        {authState.mode === 'bearer' && (
                          <div className="flex items-center gap-2">
                            <span className="flex-none text-xs text-muted-foreground">Token</span>
                            <div className="min-w-0 flex-1">
                              <CodeEditor
                                value={authState.tokenExpr}
                                onChange={(value) => persistAuth({ tokenExpr: value })}
                                placeholder={'"tk" 或 input.apiToken'}
                                maxRows={1}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Alert variant="info">
                        <GlobeIcon />
                        <AlertDescription>认证配置为自定义表达式，已按原样保留，结构化编辑不可用</AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                </Tabs>
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
          value: toHttpRequestValue({
            urlExpr: '',
            method: 'GET',
            headersExpr: '',
            bodyExpr: '',
            paramsExpr: '',
            timeoutExpr: '',
            retryExpr: '',
            authExpr: '',
          }),
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
