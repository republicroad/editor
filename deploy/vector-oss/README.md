# 决策请求日志归档到对象存储（Vector → OSS 示例）

第六十二批配套示例：编辑器（apps/editor）把 `/api/simulate`、`/api/decision` 的每次请求
逐行落盘为 JSONL（`$LOGS_DIR/decision-requests-YYYY-MM-DD.jsonl`，按 UTC 日滚动）；
本目录用 [Vector](https://vector.dev) tail 这些文件并压缩归档到 S3 兼容对象存储
（阿里云 OSS / AWS S3 / MinIO 通用）。

```
editor (LOGS_DIR=/data/logs) ──volume──> vector (file source → s3 sink) ──> OSS
                                                          │
                                                          └── vector-data（checkpoint/缓冲卷）
```

## 日志记录格式（每行一个 JSON）

```json
{
  "ts": "2026-09-07T08:00:00.000Z",
  "requestId": "…",
  "userId": "…",
  "route": "/api/simulate",
  "method": "POST",
  "status": 200,
  "durationMs": 12,
  "ok": true
}
```

处理抛错时附 `"error": "…"`（400 校验类不经过异常路径，无此字段）。

## 前置准备（阿里云 OSS）

1. 创建 bucket（如 `jdm-editor-logs`），与编辑器部署同 region 最省流量费。
2. 创建 RAM 用户，授予**最小**写权限（把 `your-bucket` 换成实际 bucket 名）：

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["oss:PutObject", "oss:GetObject", "oss:ListObjects"],
      "Resource": ["acs:oss:*:*:your-bucket/editor/*"]
    }
  ]
}
```

3. 记录 AccessKey（推荐只读控制台 + 定期轮换）。

## 环境变量

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `OSS_ENDPOINT` | S3 兼容端点 | `https://oss-cn-hangzhou.aliyuncs.com` |
| `OSS_REGION` | region id | `cn-hangzhou` |
| `OSS_BUCKET` | bucket 名（必填） | `jdm-editor-logs` |
| `OSS_ACCESS_KEY_ID` / `OSS_SECRET_ACCESS_KEY` | RAM 凭据（必填） | — |
| `AUTH_SECRET` / `CORS_ORIGINS` / `PORT` | 编辑器侧，同根 compose | 见根 `docker-compose.yml` |
| `DECISION_LOG_KEEP_DAYS` | 磁盘日志保留天数（0 = 永久，默认 14） | `14` |

## 启动与验证

```bash
cd deploy/vector-oss
export OSS_BUCKET=jdm-editor-logs OSS_ACCESS_KEY_ID=... OSS_SECRET_ACCESS_KEY=...
podman compose up -d            # 或 docker compose up -d

curl -s http://localhost:3000/healthz           # 编辑器健康
curl -s http://localhost:3000/api/simulate \
  -H 'content-type: application/json' \
  -d '{"content":{"contentType":"application/vnd.gorules.decision","nodes":[],"edges":[]},"context":{}}'

podman exec jdm-editor-log-vector vector top    # 观察吞吐（Ctrl+C 退出）
# 默认 60s 批次窗口后，OSS 控制台出现：
#   editor/decision-requests/dt=YYYY-MM-DD/<timestamp>-<uuid>.jsonl.gz
```

## 运维说明

- **对象布局**：`editor/decision-requests/dt=<UTC 日>/`，gzip 压缩 JSONL；建议在 OSS 上配
  生命周期规则（如 30 天转低频、180 天转归档、365 天删除）。
- **磁盘与远端的关系**：磁盘日志是短期缓冲（默认 14 天滚动清理），对象存储才是长期归档；
  Vector 自身 checkpoint 与 256 MiB 落盘缓冲在 `vector-data` 卷——OSS 不可达时不丢数据，
  恢复后续传。
- **防重复**：`fingerprint.strategy = "device_and_inode"` + checkpoint 保证每行至多采集一次；
  重建 `vector-data` 卷会从头回读（受 `ignore_older_secs` 限制默认只回 1 天）。
- **本地试验**：没有 OSS 时可起一个 MinIO（`docker run -p 9000:9000 minio/minio …`），
  `OSS_ENDPOINT=http://host:9000` 即可联调同一份配置。
- **兼容性提示**：Vector 的 s3 sink 走 AWS S3 协议访问 OSS 的 S3 兼容端点；不同 Vector 版本
  与 OSS 签名版本（v1/v4）偶有兼容性差异，首次接入建议用测试 bucket 验证一次写通，必要时
  升级 Vector 镜像版本或改用 S3/MinIO。本示例未随批次实机联调 OSS，标注为**可运行起点**。

## 相关文件

| 文件 | 说明 |
| --- | --- |
| `vector.toml` | 采集/解析/归档配置（file source → remap → s3 sink） |
| `docker-compose.yml` | editor + vector 双服务编排（共享 `editor-logs` 卷） |
| `../../apps/editor/src/decision-request-log.ts` | 日志落盘实现（JSONL/滚动/清理） |
| `../../docs/03-project-status.md` | 第六十二批记录 |
