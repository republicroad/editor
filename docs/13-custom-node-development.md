# 13 · 自定义节点开发指南

> 适用分支：zrule。本文沉淀 query_list / http_request / crypto / json_path / template 五个节点落地后的标准管线，新增节点照此流程即可。
>
> 结构约束见 §7：**1 节点 = 1 自定义函数，不嵌套**；主题分类由「命名空间/group」承担。

## 1. 总体架构

```
apps/zen-rule (UDF 注册)
  └─ registerUdf(name, namespace, { parametersSchema, returnsSchema })(func)
       └─ /api/custom-nodes/schema   ← udfManager.udfFunctionSchemaNamespaces() 运行时生成
            └─ 前端 schemaToCustomNodes() 生成通用节点(表达式表格编辑)
                 └─ 富编辑器节点：前端手写 createJdmNode spec 覆盖(useCustomNodes.ts overriddenKinds 过滤)
```

- **只加 UDF 不写编辑器**：schema 自动出现，用通用自定义函数表格即可配置——最小成本路径
- **需要富编辑器**：走本文全流程；`overriddenKinds` 里登记 kind，避免侧边栏重复

## 2. 引擎层(apps/zen-rule)

### 2.1 注册 UDF(contrib.ts)

```ts
export const myThing = registerUdf('my_thing', 'contrib', {
  description: '一句话说明 + 参数语义 + 失败语义(不抛异常则写明)',
  parametersSchema: {
    properties: {
      input:    { type: 'any',    title: 'Input', description: '…' },          // any = 直通不转换
      mode:     { type: 'string', title: 'Mode', default: 'fast', description: '非法值回退默认' },
      options:  { type: 'object', title: 'Options', default: null, description: '…' },
    },
    required: ['input'],
    title: 'my_thing',
    type: 'object',
  },
  returnsSchema: { type: 'object', title: 'my_thing 函数返回', properties: {} },
})(function myThingUdf(kwargs: Record<string, unknown>) {
  // kwargs 已按声明顺序做过位置绑定与类型转换，缺省参数=声明 default
});
```

**关键约定**

| 约定 | 说明 |
|---|---|
| 位置绑定 | `funcBindParams` 按 properties **声明顺序**映射位置实参；缺省补 default ?? null |
| 类型转换 | jsonT2pyT：string(null→'') / object(null→{}) / boolean / integer / **any(直通)**；字符串型可空参数的 default 必须显式给 `''`(不能 null，否则变 "null" 的历史 bug) |
| 失败语义 | 参照 http_request「结构化错误对象」或 crypto/json_path「宽容回退」二选一，description 写明 |
| 归一化 | 枚举类参数在 func 内白名单校验+回退(UI Select 只是约束之一)，参考 normalizeMethod/normalizeAlgorithm |

### 2.2 测试(*.test.ts)

```ts
import './contrib.js';                    // 触发注册副作用(必须)
import { udfManager } from './register.js';

const call = async (...args: unknown[]) => {
  const kwargs = udfManager.funcBindParams('my_thing', args);   // 引擎路径：位置→kwargs
  return udfManager.call('my_thing', kwargs);                   // 注意 call 是 async
};
```

必测：① 标准向量 ② 缺省参数回退(funcBindParams 键序断言)③ 非法值回退 ④ 边界(空串/null 槽位)。运行：`bun test apps/zen-rule`。

## 3. 协议库(src/lib/*-protocol.ts)

纯函数层，前后端共享的表达式编解码契约：

- `parseXxx(expr?: CustomNodeExpression): Fields` —— parseOperatorArgs 拆参 → unquote 字面量槽位
- `toXxxValue(fields): string[]` —— `[UDF名, ...位置参数]`；**可选尾参变长序列化：末尾连续空值截断、中段空串占位**
- `normalize*()` 白名单归一(与引擎同规则)

配套 `src/lib/__tests__/*.test.ts`：往返稳定、截断/占位、非法归一、空表达式安全。运行:`bun run test`。

## 4. 编辑器组件(src/components/custom-node/xxx-node.tsx)

骨架照抄任一现有节点(crypto 最完整)：实例行列表(`css.tabSplit/tabList/tabDetail`) + 详情表单。

要点：
- `useNodeConfig` 读 config.expressions;`persistExpressions` 经 graphActions.updateNode 写回
- 多实例：`generateNode({index})` 默认一行表达式;`nextExprKey` 生成 resultN 输出键
- 表单控件：Select(ui/select)、Switch、ToggleGroup(互斥多段)、Cascader(reui,两级树记得 `revealSelected={false}`)、KeyValueEditor(对象字面量变量表,key-value-editor.tsx 共享)
- **显式状态优于推导**：跨「空槽位」的模式/形态选择用 useState 持有(crypto HMAC 教训)，外部非空时单向对齐
- 模拟结果徽章：`simulate.result.trace[id].output[expr.key]`,参考 CryptoRow
- 图标：lucide-react;命名 KIND = '<namespace>.<tool>'

接线三处:`useCustomNodes.ts` import + 两个数组 + `overriddenKinds`;再执行 `bun run sync:schema` 同步离线夹具 `src/assets/custom-node-schema.json`。

## 5. 门禁与提交

```bash
bun run lint && bun run typecheck && bun run typecheck:apps && bun run test && bun test apps/zen-rule && bun run build
```

提交拆分惯例：
1. `feat(zen-rule): add xxx udf with tests`(引擎+依赖)
2. `feat(xxx): custom node with structured editor and protocol lib`(协议库+组件+接线+夹具)
3. `docs:` changelog(docs/03 §7.3 批次条目 + §6.2 勾选)

## 6. 反模式备忘(历史踩坑)

- ❌ 可选 string 参数 default 用 null(绑定层变 "null" 字符串)→ 用 ''
- ❌ 模式由空槽位实时推导(首次选择即回落)→ 显式 state
- ❌ Cascader 受控值 + revealSelected 默认 true(打开直接钻进子级，兄弟分支不可见)→ revealSelected={false}
- ❌ 正则手术改大文件 → 用行拼接/整文件重写
- ❌ 测试里传表达式源码文本当实参 → 传求值后的真实类型值

## 7. 设计决策：1 节点 = 1 自定义函数（不嵌套）

> 沉依据：2026-08-28 zrule 分支评审结论。自定义节点只支持最简单的数组序列化模型，后续 UI 与协议均以此为准。

### 7.1 结论

- 自定义节点调用**不支持嵌套函数调用**，为保持「最容易解析」，序列化保持极简数组模型：
  `config.expressions[0].value = ["inout", "a", "b", "c"]` → 画布 body 渲染 `inout(a, b, c)`。
- **一个节点 = 一个自定义函数（leaf call）**。主题分类**不放进节点内部**，而由「命名空间 / group」层承担（`schemaToCustomNodes` 已用 `group = namespace.title` 分组）。
- 明确**不做**：节点内多函数 / 嵌套调用解析；「一个主题节点包含多个函数」。

### 7.2 理由（原子性）

- 嵌套 / 多函数会破坏**原子性**：无法对单个调用独立 trace / diff / 类型推断，也无法按 `node.id` 给单个调用加输出探针（`CustomNodeSummaryCard` 现即按节点看 trace output，正是「1 节点 = 1 操作」的收益）。
- 与极简数组模型相悖——**数组不可嵌套是特性，是 leaf-call 的标准形，不是缺陷**。
- 业界一致性：n8n / Coze / Dify / LangGraph / AWS Step Functions / Unreal Blueprint 均为「单节点 = 单操作，边做数据流，容器/子图做归类」。

### 7.3 主题承载位置（三层）

| 机制 | 状态 | 说明 |
|---|---|---|
| 命名空间 / group | 已有 | `kind` = 函数，`group` = 主题；侧边栏按命名空间分组 |
| 颜色 | 已有 | `colors` 辅助一目辨类 |
| 图级 SubGraph / 纯视觉组容器 | Backlog | 若需「盒子聚合」，落点是图级容器（装节点+边），**非**扩数组协议支持嵌套 |

### 7.4 Backlog（刻意不进本次）

- 图级 SubGraph / 纯视觉组容器（装节点 + 边），保持 `["fn", ...]` 模型长期极简。
