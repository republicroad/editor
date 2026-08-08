import {
  GraphNode,
  createJdmNode,
  jsonSchemaToVariableType,
  type MinimalNodeProps,
  type MinimalNodeSpecification,
  useDecisionGraphActions,
  useDecisionGraphState,
  CodeEditor,
} from '@gorules/jdm-editor';
import { Alert, Button, Input, Typography, theme } from 'antd';
import React, { useEffect, useState } from 'react';

import { Autocomplete as AutocompletePrimitive } from '@base-ui/react/autocomplete';
import { parseOperatorArgs, uid } from '../../lib/custom-node-registry';
import type { CustomNodeConfig, CustomNodeExpression } from '../../lib/custom-node-types';
import PlusCircleIcon from '../../reui/icons/default/outline/plus-circle';
import ShieldSearchIcon from '../../reui/icons/default/outline/shield-search';
import TrashSquareIcon from '../../reui/icons/default/outline/trash-square';
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompleteStatus,
} from '../reui/autocomplete';
import { Badge } from '../reui/badge';
import css from './custom-node.module.css';

interface ListOption {
  name: string;
  size: number;
}

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

const useNodeConfig = (id: string): CustomNodeConfig | undefined =>
  useDecisionGraphState(({ decisionGraph }) => {
    const config = (decisionGraph?.nodes ?? []).find((node) => node.id === id)?.content?.config;
    return config as CustomNodeConfig | undefined;
  });

const useListOptions = (search: string): { options: ListOption[]; loading: boolean } => {
  const [options, setOptions] = useState<ListOption[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/lists?q=${encodeURIComponent(search)}`, { signal: controller.signal })
        .then((response) => response.json())
        .then((data) => {
          if (!cancelled && Array.isArray(data)) {
            setOptions(data as ListOption[]);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setOptions([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, 200);
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [search]);
  return { options, loading };
};

const parseExpr = (expr?: CustomNodeExpression): { listName: string; valueExpr: string } => {
  const args = expr ? parseOperatorArgs(expr.value) : [];
  return {
    listName: args[1] ? unquote(args[1]) : '',
    valueExpr: args[2] ?? '',
  };
};

const toExprValue = (listName: string, valueExpr: string): string[] => ['query_list', quote(listName), valueExpr];

const nextExprKey = (list: CustomNodeExpression[]): string => {
  const used = new Set(list.map((item) => item.key));
  let index = list.length + 1;
  while (used.has(`result${index}`)) {
    index += 1;
  }
  return `result${index}`;
};

interface QueryInstanceEditorProps {
  expr: CustomNodeExpression;
  onChange: (next: CustomNodeExpression) => void;
}

const QueryInstanceEditor: React.FC<QueryInstanceEditorProps> = ({ expr, onChange }) => {
  const { listName, valueExpr } = parseExpr(expr);
  const [query, setQuery] = useState(listName);
  const [prevListName, setPrevListName] = useState(listName);
  if (prevListName !== listName) {
    setPrevListName(listName);
    setQuery(listName);
  }
  const { options, loading } = useListOptions(query);
  const listOption = options.find((option) => option.name === listName);

  const handleListChange = (value: string, eventDetails: AutocompletePrimitive.Root.ChangeEventDetails) => {
    setQuery(value);
    if (value === '' || eventDetails?.reason === 'item-press' || options.some((option) => option.name === value)) {
      onChange({ ...expr, value: toExprValue(value, valueExpr) });
    }
  };

  return (
    <div className={css.form}>
      <Autocomplete
        items={options}
        value={query}
        onValueChange={handleListChange}
        itemToStringValue={(item: unknown) => (item as ListOption).name}
        filter={null}
        openOnInputClick
      >
        <AutocompleteInput
          size="sm"
          placeholder="搜索并选择名单"
          showClear
          showTrigger
          className="[&[data-slot=autocomplete-input]]:border-transparent [&[data-slot=autocomplete-input]]:bg-transparent [&[data-slot=autocomplete-input]]:px-2"
        />
        <AutocompleteContent>
          <AutocompleteStatus>
            {loading ? '搜索中…' : options.length > 0 ? `${options.length} 个名单` : '未找到匹配名单'}
          </AutocompleteStatus>
          <AutocompleteList>
            {(option: ListOption) => (
              <AutocompleteItem key={option.name} value={option} className="rounded-lg">
                <span>{option.name}</span>
                <Badge variant="secondary" size="sm" radius="full">
                  {option.size}
                </Badge>
              </AutocompleteItem>
            )}
          </AutocompleteList>
        </AutocompleteContent>
      </Autocomplete>
      <CodeEditor
        value={valueExpr}
        onChange={(value) => onChange({ ...expr, value: toExprValue(listName, value) })}
        placeholder="Zen 表达式，如 input.phone"
        maxRows={3}
      />
      <Input
        addonBefore="输出键"
        placeholder="result"
        value={expr.key}
        onChange={(event) => onChange({ ...expr, key: event.target.value })}
      />
      {listName && listOption && (
        <Alert
          type="info"
          showIcon
          message={`命中名单 ${listName}（${listOption.size} 条）`}
          description="执行时以服务端名单为准。"
        />
      )}
    </div>
  );
};

interface QueryListRowProps {
  index: number;
  expr: CustomNodeExpression;
  selected: boolean;
  hit?: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

const QueryListRow: React.FC<QueryListRowProps> = ({ index, expr, selected, hit, onSelect, onRemove }) => {
  const { token } = theme.useToken();
  const { listName } = parseExpr(expr);

  return (
    <div
      className={`${css.listRow}${selected ? ` ${css.listRowSelected}` : ''}`}
      style={selected ? { backgroundColor: token.colorPrimaryBg } : undefined}
      onClick={onSelect}
    >
      <div className={css.listRowHeader}>
        <Typography.Text style={{ fontSize: token.fontSizeSM }}>查询 {index + 1}</Typography.Text>
        <div className={css.listRowActions}>
          {hit !== undefined && (
            <Badge variant={hit ? 'success' : 'secondary'} size="xs" radius="full">
              {hit ? '命中' : '未命中'}
            </Badge>
          )}
          <Button
            type="text"
            size="small"
            icon={<TrashSquareIcon className="size-4" />}
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
          />
        </div>
      </div>
      <div className={css.listRowValue}>{listName || '未选择'}</div>
    </div>
  );
};

export const QueryListTab: React.FC<{ id: string }> = ({ id }) => {
  const graphActions = useDecisionGraphActions();
  const config = useNodeConfig(id);
  const output = useDecisionGraphState(({ simulate }) => simulate?.result?.trace?.[id]?.output);
  const expressions = config?.expressions ?? [];
  const outputs = (output ?? {}) as Record<string, { hit?: boolean }>;
  const [selectedIndex, setSelectedIndex] = useState(0);
  if (selectedIndex >= expressions.length) {
    setSelectedIndex(expressions.length > 0 ? expressions.length - 1 : -1);
  }
  const selected = selectedIndex >= 0 ? expressions[selectedIndex] : undefined;

  const persistExpressions = (next: CustomNodeExpression[]) => {
    const nextConfig: CustomNodeConfig = {
      inputField: config?.inputField ?? null,
      outputPath: config?.outputPath ?? null,
      passThrough: config?.passThrough ?? true,
      expressions: next,
    };
    graphActions.updateNode(id, (draft) => {
      draft.content.config = nextConfig;
      return draft;
    });
  };

  const addQuery = () => {
    const next = [...expressions, { id: uid(), key: nextExprKey(expressions), value: toExprValue('', '') }];
    persistExpressions(next);
    setSelectedIndex(next.length - 1);
  };

  const removeQuery = (index: number) => {
    persistExpressions(expressions.filter((_, i) => i !== index));
  };

  return (
    <div className={css.tabSplit}>
      <div className={css.tabList}>
        <div className={css.listRows}>
          {expressions.map((expr, index) => (
            <QueryListRow
              key={expr.id}
              index={index}
              expr={expr}
              selected={index === selectedIndex}
              hit={outputs[expr.key]?.hit}
              onSelect={() => setSelectedIndex(index)}
              onRemove={() => removeQuery(index)}
            />
          ))}
        </div>
        <div className={css.listAdd}>
          <Button type="dashed" block icon={<PlusCircleIcon className="size-4" />} onClick={addQuery}>
            添加查询
          </Button>
        </div>
      </div>
      <div className={css.tabDetail}>
        {selected ? (
          <div className={css.form}>
            <Typography.Text style={{ fontSize: 12 }}>
              查询 {selectedIndex + 1} · 输出键：{selected.key}
            </Typography.Text>
            <QueryInstanceEditor
              key={selected.id}
              expr={selected}
              onChange={(next) => {
                const updated = [...expressions];
                updated[selectedIndex] = next;
                persistExpressions(updated);
              }}
            />
          </div>
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            尚未配置查询，点击左侧「添加查询」。
          </Typography.Text>
        )}
      </div>
    </div>
  );
};

const QueryListNode: React.FC<MinimalNodeProps & { specification: MinimalNodeSpecification }> = ({
  id,
  data,
  selected,
  specification,
}) => {
  const graphActions = useDecisionGraphActions();

  const { config, output } = useDecisionGraphState(({ decisionGraph, simulate }) => ({
    config: (decisionGraph?.nodes ?? []).find((node) => node.id === id)?.content?.config as
      | CustomNodeConfig
      | undefined,
    output: simulate?.result?.trace?.[id]?.output,
  }));

  const expressions = config?.expressions ?? [];
  const outputs = (output ?? {}) as Record<string, { hit?: boolean }>;

  return (
    <GraphNode
      id={id}
      specification={specification}
      name={data.name}
      isSelected={selected}
      noBodyPadding
      actions={[
        <Button key="edit-query-list" type="text" onClick={() => graphActions.openTab(id)}>
          编辑
        </Button>,
      ]}
    >
      <div className={css.summary}>
        <Typography.Text className={css.kind}>risk.query_list</Typography.Text>
        <div className={css.rows}>
          {expressions.length === 0 && (
            <div className={css.row}>
              <span className={css.rowValue}>未配置查询</span>
            </div>
          )}
          {expressions.map((expr, index) => {
            const { listName } = parseExpr(expr);
            const hit = outputs[expr.key]?.hit;
            return (
              <div className={css.row} key={expr.id}>
                <span className={css.rowKey}>查询 {index + 1}</span>
                <span className={css.rowValue}>{listName || '未选择'}</span>
                {hit !== undefined ? (
                  <Badge variant={hit ? 'success' : 'secondary'} size="xs" radius="full">
                    {hit ? '命中' : '未命中'}
                  </Badge>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className={css.returns}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            查询次数
          </Typography.Text>
          <Typography.Text style={{ fontSize: 12 }}>{expressions.length}</Typography.Text>
        </div>
      </div>
    </GraphNode>
  );
};

export const queryListNode = createJdmNode({
  kind: 'risk.query_list',
  displayName: '查询名单',
  group: '风险名单',
  shortDescription: '在服务端名单中查询某个值（支持多个查询实例）',
  icon: <ShieldSearchIcon className="size-4" />,
  generateNode: ({ index }) => ({
    name: `risk.query_list${index}`,
    config: {
      inputField: null,
      outputPath: null,
      passThrough: true,
      expressions: [{ id: uid(), key: 'result', value: toExprValue('', '') }],
    },
  }),
  renderTab: ({ id }) => <QueryListTab id={id} />,
  renderNode: QueryListNode,
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
