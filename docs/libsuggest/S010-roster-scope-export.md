# S010 zen-udf：`RosterScope` 类型从包索引导出

- 状态: done（内核 2026-09-16 交付：`@republicroad/zen-udf@0.4.1`，提交 525e45ba / release 540b08b5；npm smoke + 发布物 src/index.ts 导出行已验证）
- 目标库: `@republicroad/zen-udf`（`src/index.ts` 导出面；类型本体已在 `src/roster.ts`）
- 提出方: editor 会话（2026-09-14，第八十三批消费 0.4.0 时确认仍缺失）
- 优先级: 低成本高正确性（一行 type 导出，零运行时影响）

## 背景

U5 租户化（`20f529e` 之后的 roster 契约重构）把全部名单访问器的第二参数改为**必填**的
作用域对象，类型定义于 `packages/zen-udf/src/roster.ts:11`：

```ts
export interface RosterScope {
  tenantId: string;   // 必填；跨租户永不可见
  actor?: string;     // 缺省 = 租户共享 / 管理员语义
}
```

五个公开函数（`registerRoster` / `getRoster` / `listRosters` / `deleteRoster` / `queryRoster`）
的签名都以 `RosterScope` 为参数类型，但 `src/index.ts` 的 roster 导出行**漏导出该类型**：

```ts
export { registerRoster, listRosters, getRoster, deleteRoster, queryRoster, type Roster } from './roster.ts';
```

结果是：**参数类型是公开 API 面的一部分，类型本身却不在公开类型面上**——外部消费方
无法 `import type { RosterScope } from '@republicroad/zen-udf'`，只能二选一：

1. 深路径导入（`@republicroad/zen-udf` 未定义 subpath exports，实际只能相对路径——发布包
   消费方完全不可行）；
2. 结构化字面量匹配（当前宿主做法）——能编译，但类型契约靠约定维持：内核后续给
   `RosterScope` 加字段（如标签域、审计域）时，结构化匹配**不会产生任何编译期提示**，
   消费方静默落后于契约演进。

宿主当前绕行点（`apps/editor/src/index.ts:90-94`，第八十批 U5 适配）：

```ts
// 结构化匹配 RosterScope（内核暂未从包索引导出该类型——libsuggest 候选）。
const rosterScopeOf = (execCtx: ExecContext) => ({ tenantId: TENANT_ID, actor: execCtx.userId });
```

## 为什么现在提

1. **V1 出口审计的原则落空**：V 系列「exports 审计：未公开但应公开的类型补齐」补齐了
   审计/影子类型（0.4.0 index 新增 `DecisionAuditEvent`/`ShadowEvaluation` 等），但
   `RosterScope` 属 U5 时代的欠账，历次审计未覆盖——本提案即该原则的收尾。
2. **0.4.0 已发布 npm 公开仓**（D2 裁决）：verdict U10 接入（业务包 + model-execute）是
   名单域的现实消费方，租户作用域正是其多租户数据面的核心类型；等 verdict 撞上再补，
   会出现「已发布的公开包缺公开类型」的修补版本。
3. **成本近零**：纯 `type` 再导出，无运行时代码、无破坏性（加导出恒为非破坏）、不触碰
   「刻意不改」清单（naming.md 的函数级注册 API 与方法名均不受影响）。

## 建议改动

`packages/zen-udf/src/index.ts` roster 导出行补一个类型：

```diff
-export { registerRoster, listRosters, getRoster, deleteRoster, queryRoster, type Roster } from './roster.ts';
+export {
+  registerRoster,
+  listRosters,
+  getRoster,
+  deleteRoster,
+  queryRoster,
+  type Roster,
+  type RosterScope,
+} from './roster.ts';
```

## 验收口径

1. `import type { RosterScope } from '@republicroad/zen-udf'` 可编译（宿主侧验证）；
2. npm 包 `files` 白名单天然含 `src`（0.4.0 起），无需额外处理；distTS 场景 `.d.ts` 含该导出；
3. 内核测试零改动（类型导出不影响运行时套件）。

## 宿主侧消费（内核交付后随批执行）

`apps/editor/src/index.ts` 的 `rosterScopeOf` 补显式返回类型标注，删除「结构化匹配」绕行注释：
`const rosterScopeOf = (execCtx: ExecContext): RosterScope => ({ ... })`——此后内核对
`RosterScope` 的任何契约演进都会在宿主 typecheck 处即时暴露。

## 关联

- 依赖: 无
- 被: verdict U10 接入指南（verdict-zen-udf-integration.md）可引用该类型作为名单域入口
