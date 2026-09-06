// 自动保存触发策略（第五十七批 idle 门控设计的判定核心抽出）——供 use-autosave 与单测。
export const AUTO_SAVE_IDLE_MS = 10_000;
export const AUTO_SAVE_MAX_WAIT_MS = 90_000;
export const AUTO_SAVE_TICK_MS = 1_000;

export interface AutosaveFireInput {
  /** 保存进行中（进行中永不触发） */
  busy: boolean;
  /** 距上次用户交互的时长 */
  idleForMs: number;
  /** 本次布防以来的时长 */
  waitedForMs: number;
  /** 触发所需静止时长 */
  idleMs: number;
  /** 持续无停顿的兜底等待 */
  maxWaitMs: number;
}

/** idle 门控判定：非忙碌 且（静止满 idleMs 或 布防满 maxWaitMs 兜底） */
export const shouldAutosaveFire = ({ busy, idleForMs, waitedForMs, idleMs, maxWaitMs }: AutosaveFireInput): boolean =>
  !busy && (idleForMs >= idleMs || waitedForMs >= maxWaitMs);
