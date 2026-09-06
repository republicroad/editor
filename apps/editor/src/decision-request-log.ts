// 决策请求日志（第六十二批）：simulate/decision 请求逐行落盘 JSONL，按 UTC 日分文件。
// 供 Vector 等采集器 tail 后归档对象存储（S3 兼容，示例见 deploy/vector-oss/）。
// 设计约束：日志失败绝不影响 API（append 失败仅 console.warn）；写入经串行队列保证行序；
// 文件按日滚动 + KEEP_DAYS 滚动清理（0 = 永久保留）。
import { appendFile, mkdir, readdir, unlink } from 'fs/promises';
import path from 'path';
import { join } from 'path';

let LOGS_DIR = process.env.LOGS_DIR ? path.resolve(process.env.LOGS_DIR) : path.resolve(import.meta.dir, '../logs');

export const configureLogsDir = (dir: string): void => {
  LOGS_DIR = path.resolve(dir);
};

const parseEnvNonNegativeInt = (value: string | undefined, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
};

/** 日志滚动保留天数（按文件名的 UTC 日计算；0 = 永久保留） */
export const DECISION_LOG_KEEP_DAYS = parseEnvNonNegativeInt(process.env.DECISION_LOG_KEEP_DAYS, 14);

export interface DecisionRequestLogRecord {
  /** 请求完成时刻（ISO） */
  ts: string;
  requestId: string;
  userId?: string;
  /** 请求路径（不含 query）：'/api/simulate' | '/api/decision' */
  route: string;
  method: string;
  status: number;
  durationMs: number;
  /** status < 400 */
  ok: boolean;
  /** 处理抛错时的错误摘要（400 校验类不经过异常，无此字段） */
  error?: string;
}

const DECISION_LOG_FILE_PATTERN = /^decision-requests-(\d{4}-\d{2}-\d{2})\.jsonl$/;

/** UTC 日频日志文件名 */
export const decisionLogFileName = (date: Date): string => `decision-requests-${date.toISOString().slice(0, 10)}.jsonl`;

/** 单行 JSON 序列化（纯函数，供单测） */
export const formatDecisionRequestLine = (record: DecisionRequestLogRecord): string => `${JSON.stringify(record)}\n`;

/** 清理超过保留天数的旧日志文件；返回删除数。now/keepDays 可注入（单测）。
 *  语义：保留今天 + 最近 keepDays 个先前日，更早的文件删除。 */
export const pruneDecisionLogs = async (opts?: { now?: Date; keepDays?: number; dir?: string }): Promise<number> => {
  const keepDays = opts?.keepDays ?? DECISION_LOG_KEEP_DAYS;
  if (keepDays <= 0) return 0;
  const dir = opts?.dir ?? LOGS_DIR;
  const now = opts?.now ?? new Date();
  const todayMs = new Date(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`).getTime();
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return 0;
  }
  let removed = 0;
  for (const name of entries) {
    const match = DECISION_LOG_FILE_PATTERN.exec(name);
    if (!match) continue;
    const fileDayMs = new Date(`${match[1]}T00:00:00.000Z`).getTime();
    if (todayMs - fileDayMs <= keepDays * 86_400_000) continue;
    try {
      await unlink(join(dir, name));
      removed++;
    } catch (error) {
      console.warn(`[decision-log] prune failed for ${name}:`, error);
    }
  }
  return removed;
};

let writeQueue: Promise<void> = Promise.resolve();
let prunedDay: string | undefined;

/** 追加一条决策请求日志（串行异步；失败仅告警）。日期跨越时顺带执行一次滚动清理。 */
export const logDecisionRequest = (record: DecisionRequestLogRecord): void => {
  const day = record.ts.slice(0, 10);
  writeQueue = writeQueue
    .then(async () => {
      try {
        await mkdir(LOGS_DIR, { recursive: true });
        const fileName = decisionLogFileName(new Date(record.ts));
        await appendFile(join(LOGS_DIR, fileName), formatDecisionRequestLine(record), 'utf-8');
      } catch (error) {
        console.warn('[decision-log] append failed:', error);
      }
      if (day !== prunedDay) {
        prunedDay = day;
        try {
          await pruneDecisionLogs();
        } catch (error) {
          console.warn('[decision-log] prune failed:', error);
        }
      }
    })
    .catch(() => {});
};

/** 等待在途日志写完（测试用） */
export const flushDecisionLog = (): Promise<void> => writeQueue;
