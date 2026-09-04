# Graph Persistence 接口设计提案

> 状态：契约已定型(第十二批)；页面已接线(第十三批)；版本历史面板已实施(第十四批)。
> 相关类型：`src/shell/persistence.ts` · 参考实现 `apps/editor/src/graphs-store.ts` + 路由 `apps/editor/src/index.ts` · HTTP 适配器 `src/shell/graphs-http-adapter.ts` · 页面接线 `src/lib/graph-persistence.ts` + `src/pages/decision-simple.tsx`

## 1. 背景与目标

编辑器定位为**通用无状态库**：图的存储、版本、权限完全由宿主负责，编辑器只消费宿主注入的适配器。本提案定义编辑器需要的最小持久化契约，使宿主可以：

- 用任意后端（文件系统/SQLite/S3/远程 API）实现图的 CRUD 与版本管理；
- 在 `EditorShellOptions.persistence` 注入适配器后，shell 自动将"打开/另存为/版本历史"面板路由到宿主存储；
- 不注入时，shell 回退到浏览器本地文件（现有行为不变）。

## 2. 设计原则

| 原则       | 说明                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------- |
| 宿主管存储 | 编辑器只定义接口契约，不选择或绑定存储后端                                               |
| 宿主管身份 | `owner` 由服务端从会话/网关头注入；客户端传值被剥离（防伪造）                            |
| 404 防探测 | `load` 返回 null 而非抛错；不可见资源与不存在资源行为一致                                |
| 并发兼容   | `save` 默认 last-write-wins；传入 `baseRevision` 时自动升级为乐观锁                      |
| 版本可选   | `listVersions` 与 `load({revision})` 是可选能力；宿主未实现时 shell 隐藏版本历史面板     |
| 最小接入   | 宿主只需实现 `load` + `save` 即可获得基本持久化；`list`/`delete`/`listVersions` 按需渐进 |

## 3. 核心类型

```ts
export interface GraphRecordMeta {
  id: string; // 宿主侧唯一标识（UUID/slug，宿主生成）
  name: string;
  description?: string;
  owner?: string; // 缺省=共享，复用名单 owner 语义
  tags?: string[];
  extensions?: Record<string, unknown>; // 图+配置打包：调度、环境绑定等非图数据
  revision: string; // 当前 head 版本号（宿主生成，单调递增）
  createdAt?: string;
  updatedAt?: string;
}

export interface GraphRecord extends GraphRecordMeta {
  content: unknown; // DecisionGraphType(nodes/edges/meta)，由消费方解包
}

export class GraphPersistenceError extends Error {
  code: 'NOT_FOUND' | 'CONFLICT' | 'FORBIDDEN';
}

export interface GraphPersistenceAdapter {
  list?(query?: { q?: string }): Promise<GraphRecordMeta[]>;
  load(id: string, opts?: { revision?: string }): Promise<GraphRecord | null>;
  save(record: GraphRecord, opts?: { baseRevision?: string }): Promise<{ id: string; revision: string }>;
  delete?(id: string): Promise<boolean>;
  listVersions?(id: string): Promise<Array<{ revision: string; updatedAt?: string }>>;
}
```

## 4. 行为约定

### 4.1 load

```ts
const graph = await adapter.load('rule-abc');
// null → 不存在或当前用户无权限（统一 404 语义）

const historical = await adapter.load('rule-abc', { revision: 'v3' });
// null → 该版本不存在（同样 404）
```

### 4.2 save

**无锁（last-write-wins）**：

```ts
const { id, revision } = await adapter.save({ ...record, id: 'rule-abc' });
// id 由宿主首次保存时分配；后续 upsert 按 id 匹配
```

**乐观锁（并发写冲突）**：

```ts
const current = await adapter.load('rule-abc');
try {
  await adapter.save({ ...current!, content: newGraph }, { baseRevision: current!.revision });
} catch (e) {
  if (e instanceof GraphPersistenceError && e.code === 'CONFLICT') {
    // 他人已写入新版本，提示用户刷新后重试
  }
}
```

### 4.3 listVersions

```ts
const versions = await adapter.listVersions('rule-abc');
// [{ revision: 'v1', updatedAt: '...' }, { revision: 'v2', updatedAt: '...' }]
// 配合 load({ revision }) 实现版本浏览器与回滚
```

### 4.4 extensions

```ts
// 宿主可挂载任意非图配置
const record: GraphRecord = {
  id: 'rule-abc',
  name: '风控规则',
  revision: 'v1',
  extensions: {
    environment: 'production',
    schedule: { cron: '0 9 * * 1-5' },
    variables: { timeout: 3000 },
  },
  content: { nodes: [...], edges: [...] },
};
```

## 5. EditorShellOptions 集成

```tsx
<EditorShellProvider
  options={{
    persistence: myGraphAdapter, // 宿主实现的适配器
    authAdapter: myAuthAdapter,
    simulate: mySimulate,
  }}
>
  <MyGraphPage />
</EditorShellProvider>
```

Shell 行为分支（decision-simple 实际代码路径）：
| persistence | Open | Save / Save as | 冲突处理 |
|-------------|------|----------------|---------|
| 已注入 | Open 菜单多出 "Graph library" 子菜单=`adapter.list()` → `adapter.load(id)` | `saveToRemote` → `adapter.save()`；已打开图 upsert 带 `baseRevision` 乐观锁 | 返回 `{kind:'conflict'}` → 提示刷新后再存 |
| 未注入 | 浏览器 showOpenFilePicker / 模板 | 浏览器 showSaveFilePicker / 下载 | 无 |

> 版本历史子面板（第十四批）：打开宿主图后，若适配器具备 `listVersions`，顶栏出现 "Versions" 下拉——列出版本、选中后经 AlertDialog 确认、以 `adapter.load(id, {revision})` 加载历史，并将该版本记为 `remoteSource.revision` 作为后续保存的 `baseRevision` 乐观锁（防覆盖更新的 head）。

## 6. 服务端参考实现（已实施，第十二批 `5576820`）

apps/editor 提供 `/api/graphs` 参考实现，复用名单的 owner 模型与存储布局模式。

### 6.1 存储布局

```
GRAPHS_DIR/
  shared/                      # owner 缺省
    {id}.json                  # { meta: {name,revision,...}, content: {...} }  head
    {id}.v1.json               # 历史版本
  users/{owner}/
    {id}.json                  # 用户私有图(head)
    {id}.v1.json               # 历史版本
```

head 文件 `{id}.json` 含 `{meta, content}`；历史版本为分版本文件 `{id}.v{N}.json`（N 从 1 递增，revision 记为 `v{N}`）。revision 单调递增，head 保存最新版。

> 实施说明（第十二批）：版本采用 head + 增量版本文件方案。大图场景下的磁盘/IO 表现未做专门评估，Q1 仍开放。

### 6.2 REST 端点（已实施）

| 方法   | 路径                       | 说明                                       | 状态码          |
| ------ | -------------------------- | ------------------------------------------ | --------------- |
| GET    | `/api/graphs?q=`           | 当前用户可见 head 元数据列表(不含 content) | 200             |
| GET    | `/api/graphs/:id`          | 加载 head；`?revision=vN` 加载指定版本     | 200 / 404       |
| POST   | `/api/graphs`              | 新建(服务端注入 owner，revision=v1)        | 200 / 400 / 500 |
| PUT    | `/api/graphs/:id`          | 更新(保留原 owner；baseRevision 乐观锁)    | 200 / 404 / 409 |
| DELETE | `/api/graphs/:id`          | 删除(head + 全部历史版本)                  | 200 / 404       |
| GET    | `/api/graphs/:id/versions` | 历史版本列表(不含 head)                    | 200 / 404       |

409 响应体为 `{ error: { code: 'CONFLICT', message } }`，供客户端区分乐观锁冲突。

### 6.3 与名单 owner 模式对齐

沿用第九批 `apps/editor` 名单的双层作用域设计：

- 共享 = `GRAPHS_DIR/shared/*.json`；用户私有 = `GRAPHS_DIR/users/{owner}/*.json`
- PUT 保留原 owner（防通过请求伪造所有权）；新建默认私有(owner=会话用户)
- 他人私有 GET/PUT/DELETE 一律 404；共享图任意登录用户可读写

### 6.4 HTTP 适配器参考

`src/shell/graphs-http-adapter.ts` 的 `createGraphsHttpAdapter(baseUrl)` 把上述端点封装为 `GraphPersistenceAdapter`：

- 404 → `load` 返回 null / `delete` 返回 false（404 语义）
- 409 CONFLICT → 抛 `GraphPersistenceError('CONFLICT')`
- `list`/`save`(按有无 id 自动选 create/update)/`delete`/`listVersions` 齐全

宿主可原样复用，或照此实现自己的后端。集成用例见 `apps/editor/src/index.test.ts`（+6：owner 注入落盘/他人 404/版本递增与历史读/乐观锁 409/共享保留 owner/删除清历史版本），apps/editor 测试 21→27。

## 7. 安全红线

1. **owner 由服务端注入**：HTTP POST/PUT 在 session 无 userId 时拒绝写入
2. **404 而非 403**：不可见资源返回与不存在资源一致，防枚举探测
3. **ExecCtx 无 actor = 管理员视角**：该路径仅供引擎直调/CLI，不得暴露为 HTTP 行为
4. **http_request 出站不携带用户凭证**：如需第三方凭据，走服务端凭据库（设计先行）

## 7.5 快照持久化（第五十批：历史 = 完整现场）

内核 `GraphRef.serialize()/restore()`（上游 PR #239 的 serializer 设计）返回
`DecisionGraphSnapshot`——图数据之外的 **UI 会话现场**：`viewport`（视口）、
打开页签与活动页签、各页签 slice（滚动位置等）。本批把这一上游公开契约接入宿主持久化：

- **保存**：`content.session = graphRef.serialize()`（UI 现场随图数据同批入库，兄弟键存储——
  图数据本身仍走受控 `value` 通道，二者分离）
- **加载**：`setGraph(content)` 后 `graphRef.restore(content.session)` 恢复现场
  （内核 pending 机制兜底未挂载页签）；旧记录无 `session` 键 → 跳过 restore，向后兼容
- **服务端**：`GraphContentSchema` 放行 `session` 兄弟键（`z.record` 宽松透传）；
  simulate 链路（`DecisionContentSchema`）**不接收 session**——zen-engine wasm
  对 content 未知键敏感（InvalidArg），session 仅存在于存储链路
- **版本历史面板**（`VersionHistoryPanel`，appshell 导出）：受控组件，宿主喂入
  `versions/currentRevision` 与 `onRestore` 回调，替换原 Versions 下拉

> 已知限制：input 节点（TabRequest）的在途 schema 编辑（700ms 防抖窗口）未注册
> tab slice，不被快照捕获——如需覆盖由内核仓注册（上游 tab-expression 模式，~30 行）。

## 8. 开放问题

| #   | 问题                                                                  | 影响                       | 待定                               |
| --- | --------------------------------------------------------------------- | -------------------------- | ---------------------------------- |
| Q1  | 历史版本是否需要清理策略（保留 N 版本）？                             | 磁盘占用                   | 实施参考实现时定                   |
| Q2  | 批量导出/导入时 extensions 是否序列化？                               | 文件格式兼容性             | 实施时定                           |
| Q3  | 部署场景：遗留 Rust 后端（backend/、Cargo.toml）是否可删除？          | Dockerfile/CI 重写范围     | **已确认可删除**，留待部署批次执行 |
| Q4  | 大图并发写是否需要引入 ETag/If-Match 头（从乐观锁扩展到 HTTP 层面）？ | REST 端点设计              | 实施时定                           |
| Q5  | graph extensions 是否需要类型校验（如 JSON Schema）？                 | 宿主扩展灵活性 vs 类型安全 | 实施时定                           |
