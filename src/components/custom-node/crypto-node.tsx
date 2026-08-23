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
import { FingerprintIcon } from 'lucide-react';
import React, { useState } from 'react';

import { uid } from '../../lib/custom-node-registry';
import {
  CRYPTO_ALGORITHMS,
  CRYPTO_ENCODINGS,
  parseCrypto,
  toCryptoValue,
  type CryptoAlgorithm,
  type CryptoEncoding,
} from '../../lib/crypto-protocol';
import type { CustomNodeConfig, CustomNodeExpression } from '../../lib/custom-node-types';
import PlusCircleIcon from '../../reui/icons/default/outline/plus-circle';
import TrashSquareIcon from '../../reui/icons/default/outline/trash-square';
import { Badge } from '../reui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import css from './custom-node.module.css';

const KIND = 'contrib.crypto';

const ALGORITHM_LABELS: Record<CryptoAlgorithm, string> = {
  md5: 'MD5',
  sha1: 'SHA1',
  sha256: 'SHA256',
  sha512: 'SHA512',
};

const ENCODING_LABELS: Record<CryptoEncoding, string> = {
  hex: 'HEX',
  base64: 'Base64',
  base64url: 'Base64URL',
};

const useNodeConfig = (id: string): CustomNodeConfig | undefined =>
  useDecisionGraphState(({ decisionGraph }) => {
    const config = (decisionGraph?.nodes ?? []).find((node) => node.id === id)?.content?.config;
    return config as CustomNodeConfig | undefined;
  });

const nextExprKey = (list: CustomNodeExpression[]): string => {
  const used = new Set(list.map((item) => item.key));
  let index = list.length + 1;
  while (used.has(`result${index}`)) {
    index += 1;
  }
  return `result${index}`;
};

interface CryptoInstanceEditorProps {
  expr: CustomNodeExpression;
  onChange: (next: CustomNodeExpression) => void;
}

const CryptoInstanceEditor: React.FC<CryptoInstanceEditorProps> = ({ expr, onChange }) => {
  const fields = parseCrypto(expr);

  const persistFields = (patch: Partial<ReturnType<typeof parseCrypto>>) => {
    onChange({ ...expr, value: toCryptoValue({ ...fields, ...patch }) });
  };

  return (
    <div className={css.form}>
      <div className="flex h-8 items-center overflow-hidden rounded-md border border-input bg-transparent dark:bg-input/30">
        <span className="h-full shrink-0 border-r border-input bg-muted/50 px-2 leading-8 text-xs text-muted-foreground">
          输出键
        </span>
        <Input
          className="h-8 rounded-none border-0 bg-transparent text-xs shadow-none focus-visible:border-0 focus-visible:ring-0"
          placeholder="result"
          value={expr.key}
          onChange={(event) => onChange({ ...expr, key: event.target.value })}
        />
      </div>
      <div className="flex gap-2">
        <Select
          value={fields.algorithm}
          onValueChange={(value) => persistFields({ algorithm: value as CryptoAlgorithm })}
        >
          <SelectTrigger aria-label="摘要算法" className="h-8 w-[100px] flex-none text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(CRYPTO_ALGORITHMS as readonly string[]).map((algorithm) => (
              <SelectItem key={algorithm} value={algorithm} className="text-xs">
                {ALGORITHM_LABELS[algorithm as CryptoAlgorithm]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <CodeEditor
          value={fields.inputExpr}
          onChange={(value) => persistFields({ inputExpr: value })}
          placeholder={'待摘要内容，如 input.phone 或 "文本"'}
          maxRows={3}
        />
      </div>
      <div className={css.form}>
        <span className="text-xs text-muted-foreground">HMAC 密钥(留空则为普通摘要)</span>
        <CodeEditor
          value={fields.secretExpr}
          onChange={(value) => persistFields({ secretExpr: value })}
          placeholder={'如 env.SECRET_KEY 或 "my-key"'}
          maxRows={1}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Select value={fields.encoding} onValueChange={(value) => persistFields({ encoding: value as CryptoEncoding })}>
          <SelectTrigger aria-label="输出编码" className="h-8 w-[110px] flex-none text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(CRYPTO_ENCODINGS as readonly string[]).map((encoding) => (
              <SelectItem key={encoding} value={encoding} className="text-xs">
                {ENCODING_LABELS[encoding as CryptoEncoding]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex flex-1 items-center justify-end gap-2 text-xs text-muted-foreground">
          HEX 大写
          <Switch
            checked={fields.upperExpr.trim() === 'true'}
            onCheckedChange={(checked) => persistFields({ upperExpr: checked ? 'true' : '' })}
            aria-label="HEX 大写输出"
          />
        </label>
      </div>
    </div>
  );
};

interface CryptoRowProps {
  index: number;
  expr: CustomNodeExpression;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

const CryptoRow: React.FC<CryptoRowProps> = ({ index, expr, selected, onSelect, onRemove }) => {
  const { algorithm, secretExpr } = parseCrypto(expr);

  return (
    <div
      className={`${css.listRow}${selected ? ` ${css.listRowSelected}` : ''}${selected ? ' bg-primary/10' : ''}`}
      onClick={onSelect}
    >
      <div className={css.listRowHeader}>
        <span className="text-xs font-medium">摘要 {index + 1}</span>
        <div className={css.listRowActions}>
          {secretExpr.trim() !== '' && (
            <Badge variant="info" size="xs" radius="full">
              HMAC
            </Badge>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            aria-label="删除摘要"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
          >
            <TrashSquareIcon />
          </Button>
        </div>
      </div>
      <div className={css.listRowValue}>{ALGORITHM_LABELS[algorithm]}</div>
    </div>
  );
};

export const CryptoTab: React.FC<{ id: string }> = ({ id }) => {
  const graphActions = useDecisionGraphActions();
  const config = useNodeConfig(id);
  const expressions = config?.expressions ?? [];
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

  const addDigest = () => {
    const next = [
      ...expressions,
      {
        id: uid(),
        key: nextExprKey(expressions),
        value: toCryptoValue({
          inputExpr: '',
          algorithm: 'sha256',
          secretExpr: '',
          encoding: 'hex',
          upperExpr: '',
        }),
      },
    ];
    persistExpressions(next);
    setSelectedIndex(next.length - 1);
  };

  const removeDigest = (index: number) => {
    persistExpressions(expressions.filter((_, i) => i !== index));
  };

  return (
    <div className={css.tabSplit}>
      <div className={css.tabList}>
        <div className={css.listRows}>
          {expressions.map((expr, index) => (
            <CryptoRow
              key={expr.id}
              index={index}
              expr={expr}
              selected={index === selectedIndex}
              onSelect={() => setSelectedIndex(index)}
              onRemove={() => removeDigest(index)}
            />
          ))}
        </div>
        <div className={css.listAdd}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-full border-dashed text-xs"
            onClick={addDigest}
          >
            <PlusCircleIcon />
            添加摘要
          </Button>
        </div>
      </div>
      <div className={css.tabDetail}>
        {selected ? (
          <div className={css.form}>
            <span className="text-xs text-muted-foreground">
              摘要 {selectedIndex + 1} · 输出键：{selected.key}
            </span>
            <CryptoInstanceEditor
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
          <span className="text-xs text-muted-foreground">尚未配置摘要，点击左侧「添加摘要」。</span>
        )}
      </div>
    </div>
  );
};

const CryptoNode: React.FC<MinimalNodeProps & { specification: MinimalNodeSpecification }> = ({
  id,
  data,
  selected,
  specification,
}) => {
  const graphActions = useDecisionGraphActions();

  const config = useDecisionGraphState(({ decisionGraph }) => {
    return (decisionGraph?.nodes ?? []).find((node) => node.id === id)?.content?.config as CustomNodeConfig | undefined;
  });

  const expressions = config?.expressions ?? [];

  return (
    <GraphNode
      id={id}
      specification={specification}
      name={data.name}
      isSelected={selected}
      noBodyPadding
      actions={[
        <Button
          key="edit-crypto"
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
              <span className={css.rowValue}>未配置摘要</span>
            </div>
          )}
          {expressions.map((expr, index) => {
            const { algorithm, secretExpr } = parseCrypto(expr);
            return (
              <div className={css.row} key={expr.id}>
                <span className={css.rowKey}>摘要 {index + 1}</span>
                <span className={css.rowValue}>{ALGORITHM_LABELS[algorithm]}</span>
                {secretExpr.trim() !== '' ? (
                  <Badge variant="info" size="xs" radius="full">
                    HMAC
                  </Badge>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className={css.returns}>
          <span className="text-xs text-muted-foreground">摘要数量</span>
          <span className="text-xs">{expressions.length}</span>
        </div>
      </div>
    </GraphNode>
  );
};

export const cryptoNode = createJdmNode({
  kind: KIND,
  displayName: '摘要签名',
  group: 'contrib',
  shortDescription: '计算字符串 MD5/SHA 摘要或 HMAC 签名，支持多个并行摘要实例',
  icon: <FingerprintIcon className="size-4" />,
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
          value: toCryptoValue({
            inputExpr: '',
            algorithm: 'sha256',
            secretExpr: '',
            encoding: 'hex',
            upperExpr: '',
          }),
        },
      ],
    },
  }),
  renderTab: ({ id }) => <CryptoTab id={id} />,
  renderNode: CryptoNode,
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
