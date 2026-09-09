# libsuggest — jdm-\* 库改动建议

宿主仓库（editor）单方面维护的**内核库改动建议**目录。宿主会话在日常开发中发现的
内核侧问题/优化点在此立项成文；**内核会话周期性读取**，自行评估、执行或驳回。

## 与现有协作机制的分工

| 机制                              | 用途                                                                   |
| --------------------------------- | ---------------------------------------------------------------------- |
| `jdm-editor/docs/archive/hostapp/*.md`（原 docs/hostapp 已归档，2026-09-09 宣告计划项全部落地）    | 内核仓**自有**的宿主集成文档（由内核会话维护，或经批准由宿主会话写入） |
| **`editor/docs/libsuggest/*.md`** | 宿主仓**单向输出**的建议队列（本目录——宿主只写不改内核，内核会话消费） |
| 即时对话交接                      | 紧急/双边协商事项，不适用文档排队                                      |

## 建议文档格式（每条一个文件）

文件名：`S<序号>-<英文短名>.md`（序号三位递增，不复用）。

```markdown
# S00X <标题>

- 状态: proposed | accepted | done | rejected | obsolete
- 目标库: @republicroad/jdm-editor | @republicroad/jdm-appshell | 内核仓根/CI
- 提出方: editor 会话（<批次>）
- 优先级: 高 | 中 | 低

## 问题

<现象与证据——错误信息、测试数据、复现路径>

## 建议改动

<具体到文件/行/配置项；给出可直接执行的 diff 级描述>

## 影响面与风险

<哪些消费方受影响；已验证的证据（测试/typecheck 结果）>

## 宿主侧现状

<宿主是否已用配置手段规避（overrides/paths/守卫）；规避的代价与解除条件>
```

## 状态生命周期

```
proposed（宿主写入）
  → accepted（内核会话认领，回填备注）
  → done（内核改完推送；宿主在 docs/03 批次记录中验证归档）
  → rejected / obsolete（写明理由，文件保留作决策档案）
```

状态变更**只由内核会话操作**；宿主会话只新增文件、不改已有文件状态
（发现情况变化时追加 `## 追记` 段）。

## 当前队列

| 编号 | 标题                                                                                    | 优先级 | 状态     |
| ---- | --------------------------------------------------------------------------------------- | ------ | -------- |
| S001 | 跨 react 主版本消费的类型合规（JSX.Element 一处 + dist 消费守卫立项）                   | 中     | proposed |
| S002 | zod 3 → 4.3.6 对齐（宿主树已完成迁移验证，362/362 绿）                                  | 中     | proposed |
| S003 | appshell stories 在内核 pnpm 树下 typecheck 断链（Meta/StoryObj 缺失）                  | 低     | proposed |
| S004 | 版本历史 diff 视图组件（P1 面板版：computeGraphDiff + 面板对比）                        | 中     | proposed |
| S005 | 换肤布局槽位（SkinDefinition 布局扩展需求：工具栏/面板/头部注入）                       | 中     | proposed |
| S006 | 版本钉住 auto→manual（面板 Pin 按钮 + adapter.updateVersionMeta；服务端端点宿主已上线） | 中     | proposed |
| S007 | 版本钉住 Pin（S006 剩余半边：pinned meta + 面板 Pin 按钮 + updateVersionMeta）          | 中     | proposed |
| S008 | monaco-editor 的 tsconfig paths 映射冗余且毒化 oxc 系打包器运行时解析（建议删除该映射） | 低     | proposed |
