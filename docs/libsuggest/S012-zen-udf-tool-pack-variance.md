# S012 zen-udf：tool()/pack() 参数类型的 ctx 变型缺陷（宿主 strict tsconfig 必报）

- 状态: proposed
- 目标库: `@republicroad/zen-udf`（`src/tool.ts` + `src/reference.ts`/registry 参数类型）
- 提出方: editor 会话（2026-09-17，宿主消费 0.11.1 首爆；HEAD 复测仍在）
- 优先级: 高（TS 源发布模式下，任意 strict 宿主的 typecheck 必红）

## 问题

zen-udf 以 TS 源发布（ADR: ESM source publish）——消费者的 tsc 程序会进入包源码并按
**消费者严格度**检查。宿主 strict（strictFunctionTypes 开）下 0.11.1 与 HEAD 均报 2 处：

```
contrib/ab-bucket.ts(55,28): TS2345: UdfPackDef 不可赋值 —— tools[].run 的
  ctx: ToolContext（必选）vs 注册参数的 ctx?: ToolCallContext | undefined（可选）
reference.ts(58,42): TS2322: UdfTool<any, any>[] 同类
```

根因：`UdfTool.run` 的 ctx 为**必选** `ToolContext`，而 `pack()`/`register()`/
`registerTools()` 参数类型手写的内联 run 为 **`ctx?` 可选**——属性形态 + strictFunctionTypes
下，逆变检查「目标参数（可选联合）→ 源参数（必选）」失败。两处手写内联类型与 UdfTool
本体已漂移。

## 建议改动（二选一，内核定）

1. **参数类型直接复用 UdfTool/`UdfTool[]`**（消除手写内联漂移，推荐）；或
2. 内联 run 的 ctx 改必选 `ToolContext`（与 UdfTool 对齐）；或
3. UdfTool/PackDef 的 run 改**方法语法**（TS 双变，属变型 hack，不推荐但最小）。

## 宿主侧现状

- apps/editor tsconfig 暂设 `strictFunctionTypes: false` 作用域豁免（S012 交付后移除
  恢复全严格）；运行时无影响（纯类型层，54/54 测试与 dev 实测全绿）。
- 关联: S011（同属 TS 源发布模式对宿主消费面提出的要求）；ADR-011 理想态迁移。
