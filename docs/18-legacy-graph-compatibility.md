# 历史规则图兼容：机制地图与本仓实现

> 2026-09-09 沉淀（第六十七批 D1 落地后）。回答两个问题：旧版平台的规则图
> （`;;` 表达式、namespaced kind、已移除函数域的 UDF 节点）进入当前系统时
> **在哪被兼容**、**以什么机制生效**。设计原则：入口收敛 + 幂等改写 + 降级兜底，
> 不做全量数据迁移、不破坏历史版本。

---

## 1. 兼容对象口径（哪些"历史形态"存在）

| 历史形态 | 来源 | 现状 | 兼容方式 |
| --- | --- | --- | --- |
| `;;` 分隔的表达式单字符串 | 第七批前：`CustomNodeExpression.value` 为 `string` | 现行为 `string \| string[]` | 入口处自动拆分为数组 |
| namespaced 节点 kind（`contrib.<fn>`、`roster.roster`、`risk.query_list`） | 2026-09-01 平台重设计前的图 | kind 体系已废弃，函数收归裸名/schema | 入口处按已验证映射表改写 |
| 已移除函数域的 UDF 节点（`custom_list_query`/`ip_location`/`rate_1h`/`group_distinct_1h`） | 函数随重设计移除（撞库攻击防御.json 等） | 函数本体待重建（docs/13 §8.3 D2） | 节点为现行 generic customNode 模型，**无需迁移**；渲染兜底 + 仿真待 D2 |
| 旧 `http`/`legacy_http` 容器节点、`contrib.http_request` | legacy_http 域已被 `http_request` 专属节点取代 | customNode 壳无法转型专属节点 | **不迁移**——保持原 kind 落占位卡（数据无损），待 http_call 需求复活再定 |

---

## 2. 四层机制总览（按数据流）

| 层 | 位置 | 机制 | 何时作用 |
| --- | --- | --- | --- |
| **① normalize（入口改写）** | 宿主 `src/helpers/graph.ts#normalizeGraphNodes`；内核 `packages/jdm-editor/src/helpers/utility.ts#normalizeCustomNodeExpressions` | 纯函数、幂等；`;;` 拆分 + kind 映射 | 图进入画布的**每个入口**（见 §3 调用点） |
| **② 渲染兜底（降级展示）** | 内核 customNode 渲染链：未知 kind 落「配置不符合规范」占位卡；generic customNode 缺 `renderTab` 落兜底 `CustomFunctionTable`（提交 `f47af5c` 修复 fallback 链） | 不改数据、降级展示 | 迁移不了的节点 / 函数未注册的节点 |
| **③ 运行时执行兼容** | `apps/zen-rule/src/engine.ts#parseOperatorExpr`（数组原样返回）+ `custom_double_semicolon.json` 夹具 | 双形态表达式等价执行 | 仿真/决策执行 |
| **④ 存储治理（历史不可破坏）** | 版本面板（宿主 `use-remote-graph` + 内核 `restoreVersion`）；`apps/editor/src/auto-version-retention.ts` | 恢复即前进；保留策略契约（manual 永久 / auto 滚动+按日检查点 / 命名版本豁免） | 版本恢复与清理 |

---

## 3. ① normalize 层详解（唯一主动改数据的层）

### 3.1 入口收敛（调用点全集）

| 调用点 | 路径 |
| --- | --- |
| 打开远程宿主图 | `src/pages/decision-simple/use-remote-graph.ts`（openRemoteGraph） |
| 本地文件导入/打开 | `src/pages/decision-simple/use-local-file.ts` |
| 内核图 store 装载 | `dg-store.context.tsx:520`（内核侧 `normalizeCustomNodeExpressions`） |

**新增兼容规则只需**：往 normalize 层加一条纯函数规则 + 单测——入口与幂等性自动继承，
不需要改任何调用方。

### 3.2 宿主侧规则集（`src/helpers/graph.ts` + `src/lib/graph-kind-migration.ts`）

1. **`;;` 拆分**（第七批）：`normalizeExpressionValue` 以 `LEGACY_OPERATOR_SEPARATOR`
   （引号感知正则，防字符串内容误切）把含 `;;` 的字符串值拆为 `string[]`；
2. **kind 映射**（第六十七批）：改写落点为 `node.content.kind`（实测定锚，非 node.kind）——
   `contrib.<fn>` → `<fn>`（例外 `contrib.http_request` 保留走占位卡）、
   `roster.roster` / `risk.query_list` → `roster`。幂等：迁移后再跑零变化，零改写路径
   返回原节点引用。
3. **例外保留原则**：customNode 壳无法转型的节点（http 专属节点替代类）不迁移——
   改了也进不了专属节点渲染链，保持原 kind 走占位卡才是数据无损。

### 3.3 内核侧对应（`helpers/utility.ts`）

`normalizeCustomNodeExpressions` 在内核图 store 装载路径做同款 `;;` 拆分（`smartSplit`
实现）。宿主与内核各自管好自己的入口，**规则语义保持一致**（第七批 `760897e` + 内核
`89dcc30` 成对落地）。

### 3.4 配套批量工具

`bun scripts/migrate-legacy-graphs.ts [路径...] [--dry-run]`——对存量图文件批量执行同一
映射（缺省扫 `apps/editor/graphs`，有变化才写盘）。在线入口已覆盖绝大多数场景，脚本
供存量盘点与脚本化升级使用。

---

## 4. ② 渲染兜底与 ③ 运行时兼容

- **渲染兜底**：迁移不了的节点按「数据无损」降级——未知 kind 落占位卡，generic
  customNode 的页签走兜底 `CustomFunctionTable`。撞库攻击防御.json 中函数已移除的
  4 个 UDF 节点即以此形态保持加载/渲染/编辑可用（仿真报 `udf not found` 属预期，
  待 D2 函数域重建后恢复）。
- **运行时**：`parseOperatorExpr` 对旧字符串与新数组双形态等价执行，`;;` 夹具锁语义——
  迁移前后同一张图执行结果一致。

## 5. ④ 存储治理层（历史不可破坏）

- **恢复即前进**（restore-is-forward）：恢复旧版本 = 追加新 head，绝不覆盖其后版本
  （第六十八批起宿主 `onRestore` 走内核标准入口 `restoreVersion`，消除双实现分叉）；
- **保留策略契约**（第六十一/六十六批）：manual 永久；auto 滚动 `AUTO_VERSIONS_KEEP`=20
  条 ∪ 按 UTC 日检查点（`AUTO_VERSIONS_DAILY_KEEP` 默认 30）；**命名版本豁免**折叠
  （存量 root 卷属主迁移见 `bun run smoke:deploy` 自愈逻辑）。

---

## 6. 新增一条兼容规则的操作流程

1. 在 `src/lib/graph-kind-migration.ts`（或 normalize 层对应模块）加一条**纯函数规则**
   （映射表条目 / 前缀规则 / 例外集合）；
2. 在 `src/lib/__tests__/graph-kind-migration.test.ts` 补用例：迁移断言 + **幂等断言** +
   例外保留断言；有真实样本文件则加真实回归（参考 mock-user-1 v9 用例写法）；
3. 入口（normalize 调用点）自动继承，无需改动；涉及存量批量处理时同步
   `scripts/migrate-legacy-graphs.ts`（共用同一纯函数，自动继承）；
4. 若规则涉及**内核侧对应改动**（如 `smartSplit` 语义），按 libsuggest 流程提案，
   不直接改子模块。

---

## 7. 验收基准与已知口径

- **撞库攻击防御.json**（`apps/zen-rule/graph/`）：加载/渲染/编辑通过（第十九批起持续），
  节点为现行 generic customNode 模型、**无 namespaced kind 可迁**；仿真恢复靠 D2；
- **mock-user-1 存量图**（`apps/editor/graphs/users/mock-user-1/`）：真实旧 kind 样本
  （`contrib.http_request`，例外保留类），单测做真实文件回归；
- **multi2.json 等现行图**：无旧 kind，迁移为零变化（幂等回归目标）；
- 单测位置：`src/lib/__tests__/graph-kind-migration.test.ts`（6 例）。

**相关**：[docs/13 §7.3/§8.3](./13-custom-node-development.md)（函数域与迁移表源记录）、
[docs/17](./17-development-plan.md)（批次排期）、libsuggest S008（monaco 映射，另一类
「历史形态兼容」——类型 shim，已由内核消费）。
