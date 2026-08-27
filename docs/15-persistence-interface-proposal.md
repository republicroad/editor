# Graph Persistence 接口设计提案

> 状态：草案，待实例规则设计定型后转为正式规范并实施服务端参考实现。
> 相关类型：`src/shell/persistence.ts`

## 1. 背景与目标

编辑器定位为**通用无状态库**：图的存储、版本、权限完全由宿主负责，编辑器只消费宿主注入的适配器。本提案定义编辑器需要的最小持久化契约，使宿主可以：
- 用任意后端（文件系统/SQLite/S3/远程 API）实现图的 CRUD 与版本管理；
- 在 `EditorShellOptions.persistence` 注入适配器后，shell 自动将"打开/另存为/版本历史"面板路由到宿主存储；
- 不注入时，shell 回退到浏览器本地文件（现有行为不变）。

## 2. 设计原则

| 原则 | 说明 |
|------|------|
| 宿主管存储 | 编辑器只定义接口契约，不选择或绑定存储后端 |
| 宿主管身份 | `owner` 由服务端从会话/网关头注入；客户端传值被剥离（防伪造） |
| 404 防探测 | `load` 返回 null 而非抛错；不可见资源与不存在资源行为一致 |
| 并发兼容 | `save` 默认 last-write-wins；传入 `baseRevision` 时自动升级为乐观锁 |
| 版本可选 | `listVersions` 与 `load({revision})` 是可选能力；宿主未实现时 shell 隐藏版本历史面板 |
| 最小接入 | 宿主只需实现 `load` + `save` 即可获得基本持久化；`list`/`delete`/`listVersions` 按需渐进 |

## 3. 核心类型

```ts
export interface GraphRecordMeta {
  id: string;                            // 宿主侧唯一标识（UUID/slug，宿主生成）
  name: string;
  description?: string;
  owner?: string;                        // 缺省=共享，复用名单 owner 语义
  tags?: string[];
  extensions?: Record<string, unknown>;  // 图+配置打包：调度、环境绑定等非图数据
  revision: string;                      // 当前 head 版本号（宿主生成，单调递增）
  createdAt?: string;
  updatedAt?: string;
}

export interface GraphRecord extends GraphRecordMeta {
  content: unknown;                      // DecisionGraphType(nodes/edges/meta)，由消费方解包
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
    persistence: myGraphAdapter,   // 宿主实现的适配器
    authAdapter: myAuthAdapter,
    simulate: mySimulate,
  }}
>
  <MyGraphPage />
</EditorShellProvider>
```

Shell 行为分支：
| persistence | 打开面板 | 另存为面板 | 版本历史面板 |
|-------------|---------|-----------|-------------|
| 已注入 | `adapter.list()` + `adapter.load()` | `adapter.save()` | `adapter.listVersions()` + `adapter.load({revision})` |
| 未注入 | 浏览器 showOpenFilePicker | 浏览器 showSaveFilePicker / 下载 | 隐藏 |

## 6. 服务端参考实现路线（待实施）

apps/editor 提供 `/api/graphs` 参考实现，复用现有的 owner 模型与存储布局模式。

### 6.1 存储布局

```
GRAPHS_DIR/
  shared/                      # owner 缺省（存量兼容）
    {id}.json                  # { meta: {name,revision,...}, content: {...} }
  users/{owner}/
    {id}.json                  # 用户私有图
```

历史版本采用**分版本文件**：`{id}.v{N}.json`（N 从 1 递增），head 指向最新文件。

> 注意：版本文件组织为草案，实施时需评估大图场景下的磁盘/IO 表现，可能改为 head.json + versions/ 目录。

### 6.2 REST 端点（草案）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/graphs` | 列出当前用户可见图（head 元数据） |
| GET | `/api/graphs/:id` | 加载 head |
| GET | `/api/graphs/:id?revision=vN` | 加载指定版本 |
| POST | `/api/graphs` | 新建（服务端注入 owner） |
| PUT | `/api/graphs/:id` | 更新（支持 baseRevision 乐观锁） |
| DELETE | `/api/graphs/:id` | 删除（owner only） |
| GET | `/api/graphs/:id/versions` | 列出版本历史 |

### 6.3 与名单 owner 模式对齐

沿用第九批 `apps/editor` 名单的双层作用域设计：
- 共享名单 = `GRAPHS_DIR/shared/*.json`
- 用户私有 = `GRAPHS_DIR/users/{owner}/*.json`
- PUT 保留原 owner（防通过请求伪造所有权）
- 他人私有 GET/PUT/DELETE 一律 404

## 7. 安全红线

1. **owner 由服务端注入**：HTTP POST/PUT 在 session 无 userId 时拒绝写入
2. **404 而非 403**：不可见资源返回与不存在资源一致，防枚举探测
3. **ExecCtx 无 actor = 管理员视角**：该路径仅供引擎直调/CLI，不得暴露为 HTTP 行为
4. **http_request 出站不携带用户凭证**：如需第三方凭据，走服务端凭据库（设计先行）

## 8. 开放问题

| # | 问题 | 影响 | 待定 |
|---|------|------|------|
| Q1 | 历史版本是否需要清理策略（保留 N 版本）？ | 磁盘占用 | 实施参考实现时定 |
| Q2 | 批量导出/导入时 extensions 是否序列化？ | 文件格式兼容性 | 实施时定 |
| Q3 | 部署场景：遗留 Rust 后端（backend/、Cargo.toml）是否可删除？ | Dockerfile/CI 重写范围 | **已确认可删除**，留待部署批次执行 |
| Q4 | 大图并发写是否需要引入 ETag/If-Match 头（从乐观锁扩展到 HTTP 层面）？ | REST 端点设计 | 实施时定 |
| Q5 | graph extensions 是否需要类型校验（如 JSON Schema）？ | 宿主扩展灵活性 vs 类型安全 | 实施时定 |
