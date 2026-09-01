# 13 · 自定义节点开发指南

> 适用分支：zrule。本文沉淀 roster(原 query_list) / http_request / crypto / json_path / template 五个节点落地后的标准管线，新增节点照此流程即可。
>
> 结构约束见 §7：调用平铺不嵌套；节点模型两档——**集合容器节点**（schema 默认）与**专属 UI 节点**（宿主 spec 接管）+ legacy UDF 自由节点（§7.2/§8）。

## 1. 总体架构

```
apps/zen-rule/src/contrib/*.ts (自定义函数实现专属区，扁平；框架在外)
  └─ registerUdf(name, namespace, { parametersSchema, returnsSchema })(func)
       └─ /api/custom-nodes/schema   ← 每请求 udfManager.udfFunctionSchemaNamespaces() 实时聚合(内置 contrib + 未来宿主 contrib 融合)
            └─ 前端 schemaToCustomNodes() 按命名空间生成集合容器节点(kind = 命名空间名)
                 └─ 富编辑器节点：前端手写 createJdmNode spec 覆盖(useCustomNodes.ts overriddenKinds 过滤)
```

- **只加 UDF 不写编辑器**：在 `contrib/` 建域文件注册函数，schema 自动出现，用通用节点即可配置——最小成本路径
- **需要富编辑器**：走本文全流程；`overriddenKinds` 里登记 kind，避免侧边栏重复

## 2. 引擎层(apps/zen-rule)

### 2.1 注册 UDF(contrib/<域>.ts)

```ts
export const myThing = registerUdf('my_thing', 'contrib', {
  description: '一句话说明 + 参数语义 + 失败语义(不抛异常则写明)',
  parametersSchema: {
    properties: {
      input: { type: 'any', title: 'Input', description: '…' }, // any = 直通不转换
      mode: { type: 'string', title: 'Mode', default: 'fast', description: '非法值回退默认' },
      options: { type: 'object', title: 'Options', default: null, description: '…' },
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

| 约定     | 说明                                                                                                                                                              |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 位置绑定 | `funcBindParams` 按 properties **声明顺序**映射位置实参；缺省补 default ?? null                                                                                   |
| 类型转换 | jsonT2pyT：string(null→'') / object(null→{}) / boolean / integer / **any(直通)**；字符串型可空参数的 default 必须显式给 `''`(不能 null，否则变 "null" 的历史 bug) |
| 失败语义 | 参照 http_request「结构化错误对象」或 crypto/json_path「宽容回退」二选一，description 写明                                                                        |
| 归一化   | 枚举类参数在 func 内白名单校验+回退(UI Select 只是约束之一)，参考 normalizeMethod/normalizeAlgorithm                                                              |

### 2.2 测试(\*.test.ts)

```ts
import './contrib/contrib.js'; // 触发注册副作用(必须)
import { udfManager } from './register.js';

const call = async (...args: unknown[]) => {
  const kwargs = udfManager.funcBindParams('my_thing', args); // 引擎路径：位置→kwargs
  return udfManager.call('my_thing', kwargs); // 注意 call 是 async
};
```

必测：① 标准向量 ② 缺省参数回退(funcBindParams 键序断言)③ 非法值回退 ④ 边界(空串/null 槽位)。运行：`bun test apps/zen-rule`。

## 3. 协议库(src/lib/\*-protocol.ts)

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

## 7. 设计决策：调用平铺不嵌套 + 节点模型两档（集合容器 / 专属 UI 节点）

> 沉依据：2026-08-28 zrule 分支评审（第十八批，1 节点 = 1 函数）；**2026-08-31 第十九批修订**——调用模型红线不变，节点粒度改为三档。修订动因：generic schema 节点缺 `renderTab` 落入兜底 `CustomFunctionTable`，其函数下拉列出**全部** schema 函数且可随意改写 `value[0]`，运行时 zen 引擎把 `value[0]` 当 UDF 名调用 → 漂移实例执行错误函数；且真实生产图（撞库攻击防御.json）的 `指标计算` 节点 4 行调用/同函数不同参数复用，证明「集合容器多行」才是真实内聚形态。

### 7.1 红线：调用平铺，永不嵌套

- 调用序列化保持极简数组模型：`config.expressions[i].value = ["fn", "a", "b", "c"]`（或持久化 `;;` 字符串形，读写经 `toOperatorExprArray`），画布 body 渲染 `fn(a, b, c)`。
- **数组不可嵌套是特性**：嵌套/多调用合成单值会破坏原子 trace/diff/类型推断/输出探针。红线适用于所有档位——容器节点也是「多行平铺调用」，不是嵌套。

### 7.2 节点模型两档（2026-09-01 收敛：移除 singleton 档与 generic locked UI）

| 档                             | 画布形态                                           | kind 约定                      | 编辑语义                                                  |
| ------------------------------ | -------------------------------------------------- | ------------------------------ | --------------------------------------------------------- |
| 集合容器（schema 默认）        | 每命名空间一个**集合容器**节点，多行调用           | **= 命名空间名**               | scoped：函数下拉限定本集合；`value[0]` ∉ 集合则重置首函数 |
| 专属 UI 节点（宿主 spec 接管） | 宿主为函数手写 `renderTab`/`renderNode` 的专用节点 | **= 函数名**（裸名，宿主定义） | 宿主自定义 UI 全权负责                                    |
| legacy（不入 schema）          | 主仓固定注册 `kind='UDF'` 自由节点                 | `'UDF'`                        | 自由全函数 + legacy 徽标，不治愈                          |

scope 解析顺序（子模块 `resolveFunctionScope`）：`'UDF'`→legacy → `=== 命名空间名`→scoped → 其余 → free。锁定节点经由「宿主为函数编写专属 spec」获得，generic 表格不再有锁定形态。

**`config.locked: true`（数据侧 UI 标记，2026-09-01）**：有专属页面设计的节点在图 JSON 的 `config` 中显式携带 `locked: true`——generateNode 播种 + Tab persist 保留；UI 组件解析仍按 kind → 宿主 spec；**旧节点缺省该字段 = 通用表格 UI，行为不变、零回填**。
**放 config 而非节点层的理由**：`config` 是 `customHandler` 执行引擎读取节点配置的统一入口——即便本字段只服务于界面持久化，仍放入 `config` 保持配置结构统一（2026-09-01 裁决）。
**导入容错**：未知 kind 的 customNode 画布按「配置不符合规范」警示卡渲染（kind 可见、数据无损往返、可拖动/连线/删除/导出），对齐 n8n/Node-RED 的 unknown-node placeholder 实践。

### 7.3 兼容实证（2026-08-31 全仓扫描；2026-09-01 修正）

- 全部图文件自定义 kind 仅 `UDF`×4（撞库攻击防御.json）+ `sum`×3（custom\*.json 旧测试图）；**`ns.tool` 派生形从未上线**（仅评审讨论过）→ 极简路线：不生成旧 spec、不做 paletteHidden。`contrib.inout1` 为开发期实例、不在持久化图中，按新约定重建。
- **`sum` 假设修正（2026-09-01）**：3 图 kind `sum` 为前约定时代节点标签，表达式**实调 `inout`/`foo`**，与求和函数无关。已将 3 图 kind 迁移为 `debug`（scoped 容器，`inout` ∈ 集合表达式完好；fullnode 的 `foo` 调用打开时会被 scoped 治愈改写为 `inout`，已知接受）。
- 撞库攻击防御.json 验收**降级（2026-09-01）**：其 4 个 UDF 节点依赖的 `custom_list_query`/`ip_location`/`rate_1h`/`group_distinct_1h` 已随平台重设计移除、未来重新实现（§8.3）——当前验收保留**加载/渲染/编辑**（legacy 自由表格完好），**仿真验收暂缓**（节点报 udf not found 属预期）。

### 7.4 主题承载位置（三层）

| 机制                         | 状态    | 说明                                                                    |
| ---------------------------- | ------- | ----------------------------------------------------------------------- |
| 命名空间 / group             | 已有    | 集合容器统一归「自定义函数」组；专用节点各自命名空间分组                |
| 颜色                         | 已有    | `colors` 辅助一目辨类                                                   |
| 图级 SubGraph / 纯视觉组容器 | Backlog | 若需「盒子聚合」，落点是图级容器（装节点+边），**非**扩数组协议支持嵌套 |

### 7.5 Backlog（刻意不进本次）

- 独立节点形态强化：per-tool `ui` 字段（画布 body 预览 `fn(a,b,c)`、专属控件），使单函数文件可拥有定制 renderNode——未来 UI 增强的标准形态。
- 节点组（node group）概念：kind 加命名空间 vs 新增 namespace/目录——**留待未来，不预设**（2026-08-31 结论）。
- 图级 SubGraph / 纯视觉组容器（装节点 + 边），保持 `["fn", ...]` 模型长期极简。

## 8. contrib 扩展层（原 ext，2026-09-01 更名与上游 python zen-rule 对齐）

### 8.1 结构与分工

```
apps/zen-rule/src/
  contrib/              # 自定义函数实现专属区（扁平，一域一文件；文件名即 namespace）
    debug.ts            #   namespace 档集合容器：inout / func_without_args
    debugui.ts          #   单函数文件：current_date（专属 UI 预留）
    crypto.ts           #   单函数文件：crypto（专属 UI 由宿主 spec 接管）
    json_path.ts        #   单函数文件：json_path（专属 UI 由宿主 spec 接管）
    template.ts         #   单函数文件：template（专属 UI 由宿主 spec 接管）
    http.ts             #   namespace 档：http_request（专属 UI 由宿主 spec 接管）
    roster.ts           #   单函数文件：roster（原 query_list，专属 UI 由宿主 spec 接管）
  register.ts / engine.ts / roster.ts / exec-context.ts   # zen-rule 框架，在 contrib 之外
```

> 2026-09-01 平台重新设计：移除 8 个 stub/legacy 域（legacy_http/legacy_roster/aho-corasick/counter/ip/notification/phone/shared_counter）——基础 UI 模式已全覆盖，节点按需添加，历史图整体由迁移工具处理（§8.3）。

- **contrib 命名约定**：**contrib 下文件名即 namespace**，文件内函数缺省注册到该 namespace——`const registerUdf = createExtRegister(import.meta.url); registerUdf(name, schema)(fn)`；需要显式指定 namespace 时用全局 `registerUdf(name, ns, schema)(fn)`（语义化文件名如 `roster_legacy.ts`→ns `name_list`、`aho-corasick.ts`→ns `lexicon` 即显式分支）
- 注册即声明：`registerUdf(name, ns, schema)(fn)`；命名空间由文件名派生（createExtRegister），type 恒为 'namespace' 随 schema 下发
- 判断口径（详见 §7.2 表）：同构家族多函数共用同一入参（counter/notification/name_list）→ namespace；独立动作、未来要专属 UI（inout、sum、ip_location 类）→ 单函数文件

### 8.2 宿主融合（第二层，结构已留缝）

- 宿主 app 未来提供应用层 `contrib/` 目录：`import { udfManager, registerUdf } from 'zen-rule'` 注册客户函数 → **同一注册表自然融合**，schema 端点无需感知两层来源
- `/api/custom-nodes/schema` 为**每请求实时聚合**（非模块加载快照），宿主运行期注册不丢
- 镜像工具：`bun run sync:schema` 导出合并注册表 → `src/assets/custom-node-schema.json`（离线兜底 + LLM 工具调用契约）

### 8.3 Backlog（插件化演进，刻意不进本次）

- **重建移除的函数域（2026-09-01 放弃现存任务，未来按需重新实现）**：
  - `custom_list_query`（roster 存储已有 queryRoster 可直接复用）、`rate_1h`/`group_distinct_1h`（内存窗口计数，生产 Redis 化留宿主层）、`ip_location`（需 geo 数据集）——重建后撞库攻击防御.json 仿真验收恢复
  - `lexicon`（Aho–Corasick 词表匹配，文件名建议 `aho-corasick.ts`）——2026-09-01 裁决未来重新实现
  - `http_call`/`http_call_with_headers` **无需重建**：已被 `http_request`（http 域专属节点）替代

- **per-tool `ui` 字段（独立节点形态强化，待需求拐点启动）**：在 UDF schema 的 tool 定义上增加可选
  `ui` 字段，函数作者在 zen-rule 侧声明画布展示形态（如 `bodyPreview: 'fn(a,b)'`、`icon`、`form: single-line|card`），
  随 schema 下发后前端按声明自动装配轻量专属展示——函数作者零前端代码。
  专属 UI 三层演进：① generic 表格(默认) → ② `ui` 声明装配(本提案) → ③ 宿主专用 spec(复杂交互)。
  启动拐点：无专属 UI 且需要独立画布形态的函数 ≥3~5 个。
  与 `config.locked` 互补：`locked`=「已有专属设计」的事实标记(图数据)，`ui`=「想要什么形态」的意图声明(schema)。
  示例：debugui `current_date` 声明 `form: 'single-line'` 后即可脱离 generic 表格成为独立展示节点。
- `ext/define.ts`：`defineExtNamespace(desc)` 声明式扩展契约（域描述符收拢 type/工具/实现）
- `ext/index.ts`：聚合器（engine 逐文件 import 改为单入口），配合插件发现/加载机制
- 宿主 contrib/ 目录与注册引导约定（apps/editor 侧）
- **旧图 kind 迁移工具**：映射表已验证（`contrib.*`→裸函数名、`roster.roster`/`risk.query_list`→`roster`）；旧 `http`/`legacy_http` 容器节点不迁移——legacy_http 域已由 http_request 专属节点取代，此类节点落入「配置不符合规范」占位卡（数据无损），待 http_call 需求复活时再定处理方式；2026-09-01 平台重设计后迁移工具为历史 stub 域图的唯一恢复路径
