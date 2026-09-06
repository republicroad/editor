// 自动版本保留策略（纯逻辑，无 FS 依赖）——供 graphs-store 落盘治理调用与独立单测。
// 独立成模块的原因：graphs-store 在模块加载期捕获 GRAPHS_DIR 环境变量，bun test 单进程
// 内若被其他测试文件先加载会污染路由级测试的存储路径（第六十一批实证）；本模块零环境
// 依赖，任何加载顺序都安全。

/** 自动版本保留条数（manual 版本不受治理） */
export const AUTO_VERSIONS_KEEP = 20;

const parseEnvNonNegativeInt = (value: string | undefined, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
};

/** 按天保留天数：此前每个 UTC 日的 auto 版本折叠保留最新一条作为当日检查点（0 = 关闭按天保留）。
 *  与 AUTO_VERSIONS_KEEP 取并集——滚动条数防当天刷屏，按天检查点防跨天历史丢失。 */
export const AUTO_VERSIONS_DAILY_KEEP = parseEnvNonNegativeInt(process.env.AUTO_VERSIONS_DAILY_KEEP, 30);

export interface AutoVersionInfo {
  /** 版本序号（文件名 id.v{N}.json 中的 N） */
  n: number;
  /** 版本产生时间（ISO 串；缺省条目只受滚动条数保护，不参与按天折叠） */
  updatedAt?: string;
}

/**
 * 计算应删除的 auto 版本序号集合（输入任意序，内部升序处理）。
 * 保留 = 最近 keepCount 条 auto（滚动条数，第五十二批策略）
 *      ∪ 此前每个 UTC 日的最新一条 auto（按天检查点，第六十一批策略；
 *        仅治理距 now 最近的 dailyKeepDays 个"先前日"，今天的 auto 不参与按天折叠）。
 */
export const pickAutoVersionsToPrune = (
  autos: ReadonlyArray<AutoVersionInfo>,
  opts?: { now?: Date; keepCount?: number; dailyKeepDays?: number },
): Set<number> => {
  const keepCount = opts?.keepCount ?? AUTO_VERSIONS_KEEP;
  const dailyKeepDays = opts?.dailyKeepDays ?? AUTO_VERSIONS_DAILY_KEEP;
  const now = opts?.now ?? new Date();
  // 排序以真实数字为前提——n 必须是纯数字（第五十九批 NaN 教训：Number("v22") 让比较器静默失效）
  const sorted = [...autos].sort((a, b) => a.n - b.n);
  const keep = new Set<number>();
  for (const entry of sorted.slice(-keepCount)) {
    keep.add(entry.n);
  }
  if (dailyKeepDays > 0) {
    const today = now.toISOString().slice(0, 10);
    const newestOfDay = new Map<string, AutoVersionInfo>();
    for (const entry of sorted) {
      const day = entry.updatedAt?.slice(0, 10);
      if (!day || day >= today) continue;
      const current = newestOfDay.get(day);
      if (!current || entry.n > current.n) {
        newestOfDay.set(day, entry);
      }
    }
    const checkpointDays = [...newestOfDay.keys()].sort().slice(-dailyKeepDays);
    for (const day of checkpointDays) {
      keep.add(newestOfDay.get(day)!.n);
    }
  }
  return new Set(sorted.filter((entry) => !keep.has(entry.n)).map((entry) => entry.n));
};
