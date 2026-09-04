# 发布手册（Release Process）

> 2026-09-04 沉淀（第五十二批）。本仓三包**独立版本线、独立发布节奏**的成文流程——
> 把发布从"会话记忆"搬进仓库。版本线决策背景：硬分叉自上游 GoRules editor 1.16.1，
> 独立 0.x 家族（不延续上游 1.x 号，避免误读），详见 docs/03 第五十一批。
> 姊妹篇：[Bun Workspaces](./bun-workspaces-best-practices.md)（§6 发布/§3.5 布局）、
> [多包编译与构建](./monorepo-multi-package-build.md)（§1 包形态）。

---

## 1. 版本线规则

### 1.1 三包版本现状（各线独立）

| 包 | 仓库 | 当前版本 | 发布物 | 发布方式 |
| --- | --- | --- | --- | --- |
| editor（应用） | republicroad/editor（reui 分支） | 0.1.0 | 不发 npm；tag + GitHub release（+ docker 镜像可选） | 手动 |
| @republicroad/jdm-editor（内核） | republicroad/jdm-editor（reui 分支） | 0.3.1 | npm + dist | `lerna publish from-package`（读 package.json 版本） |
| @republicroad/jdm-appshell（外壳） | 同上（内核仓 packages/appshell） | 0.1.0 | npm + dist | `npm publish --access public` |

### 1.2 语义

- **0.x 语义**：pre-1.0，API 可变；**breaking 允许出现在 minor**（0.3.0→0.4.0 可含 breaking）。
  升 1.0.0 的触发：API 冻结承诺 + 外部消费者出现。
- **三包独立、不锁步**：各包按自身节奏 bump；内核 breaking 时 appshell 升 peer 下限并
  同步适配（同一仓内同批完成）。
- **tag 约定**：裸 `v<x.y.z>`，**tag 属于各自仓库**（org 下两仓互不冲突），editor 与
  内核均维持裸前缀；npm 包版本号即 tag（`v0.3.1` ↔ `0.3.1`）。
- **上游继承记录**：editor CHANGELOG.md 顶部注记（1.16.1 及以下 = 上游继承归档）；
  master 分支退役冻结于上游 1.16.1，不再推送。

---

## 2. editor（应用）发布流程

```bash
# ① 全门禁（本地）
bun install && bun run lint && bunx tsc --noEmit && bun run typecheck:apps
bun test src --path-ignore-patterns **/jdm-editor/** && bun test component-tests
bun test apps/zen-rule apps/editor && bun run build

# ② 版本提交（package.json version 手动 bump）
git commit -m "chore(release): v0.x.y"

# ③ 打标 + 推送（tag 推送可触发 tag 工作流——如未来启用）
git tag v0.x.y && git push origin reui v0.x.y

# ④ GitHub release（gh 代创建，release notes 写本版摘要）
gh release create v0.x.y --title "v0.x.y" --notes "..."

# ⑤ docker 镜像（可选）：docker build -t ... .
```

---

## 3. 内核 + appshell（npm 包）发布流程

### 3.1 发布前检查单（缺一不可）

1. 内核 CI Validate 绿（含 Appshell typecheck/build 门禁）
2. 本地全门禁 + **pack 模式 smoke**：
   ```bash
   bun run --cwd packages/jdm-editor build        # 内核 dist（bundleTypes 声明）
   bun run --cwd packages/appshell build          # appshell dist 三件套
   cd packages/jdm-editor  && bun x vitest run    # 内核 vitest（自家树）
   cd packages/appshell    && bun run test:npm-smoke   # pack 契约断言
   ```
3. 版本 bump（手动，package.json）+ **lockfile 同步**
   （内核：`corepack pnpm install --lockfile-only`；editor 仓：`bun install`）

### 3.2 发布命令

```bash
# 内核（lerna from-package：读 package.json 版本，未发布的包才会发）
cd jdm-editor && corepack pnpm lerna publish from-package --yes

# appshell（npm publish；pack 已验证 tarball 形态）
cd packages/appshell && npm publish --access public
# 注意：npm pack/publish 不应用 publishConfig 字段重写（main/exports 永久指 dist 的
# 形态因此成立）；pnpm publish 才支持字段覆盖——勿混用假设

# 3.3 registry 模式复验（装"已发布版本"验证，非本地 tarball）
cd packages/appshell && bun run test:npm-smoke 0.1.0    # 传入已发布版本号
```

---

## 4. 回滚纪律

| 场景 | 处置 |
| --- | --- |
| npm 包发现问题 | **72h 内**可 `npm unpublish <pkg>@<ver>`（deprecation 通知替代：`npm deprecate`）；超过 72h 发修复版本并 deprecate 旧版 |
| tag 打错 | `git push origin :refs/tags/v0.x.y` 删除远端 tag → 修正 → 重打；**已创建的 GitHub release** 需手动删除重建 |
| 应用（editor）发版后回滚 | tag 不可变纪律：重打前先删远端 tag + release；生产回滚 = 重新部署上一个镜像/commit |
| 历史重写类操作 | 分支级 force-push 必须先打 `backup/*` 本地分支 + 双树等价断言（✦ 第四十七批内核 9→4 提交重写先例） |

---

## 5. changesets 引入（备案，触发即启动）

**触发条件**（任一）：
1. 内核/appshell 需要按包独立的 CHANGELOG.md（外部消费者出现）
2. 双包发布步骤开始互相绊脚（漏发/错发）
3. 外部贡献者参与内核仓（需要低门槛的发布意图表达）

**引入步骤**：
```bash
cd jdm-editor && corepack pnpm add -D -w @changesets/cli && corepack pnpm changesets init
```
- 流程：每个 PR 放 `.changeset/<name>.md`（声明 bump 级别 + 描述）→ CI `changeset status`
  门禁 → 发布时 `changeset version`（统一升版 + 生成 CHANGELOG）→ `changeset publish`
- **与手动的边界**：changesets 是"意图文件"流派（声明式），取代手动版本 bump；
  与 bun isolated linker 无耦合，可独立引入

---

## 6. 职责与边界

| 包 | 发布责任会话 | 说明 |
| --- | --- | --- |
| editor | editor 会话 | 应用发布，手动 |
| 内核 + appshell | 内核仓会话优先（同仓 CI/发布自动化在彼）；editor 会话可在内核会话暂停期代发布（流程本文即可执行） | 双仓提交竞争：内核仓变更归内核会话，editor 仓变更归 editor 会话 |
