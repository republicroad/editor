import { describe, expect, test } from 'bun:test';
import { shouldAutosaveFire } from '../autosave';

const base = { busy: false, idleForMs: 0, waitedForMs: 0, idleMs: 10_000, maxWaitMs: 90_000 };

describe('shouldAutosaveFire', () => {
  test('静止未满 idle 且未满 maxWait：不触发', () => {
    expect(shouldAutosaveFire({ ...base, idleForMs: 9_999, waitedForMs: 89_999 })).toBe(false);
  });

  test('静止满 idle：触发（阅读停顿不漏存）', () => {
    expect(shouldAutosaveFire({ ...base, idleForMs: 10_000, waitedForMs: 10_000 })).toBe(true);
  });

  test('持续无停顿满 maxWait：兜底触发', () => {
    expect(shouldAutosaveFire({ ...base, idleForMs: 0, waitedForMs: 90_000 })).toBe(true);
  });

  test('保存进行中：永不触发（含已达阈值）', () => {
    expect(shouldAutosaveFire({ ...base, busy: true, idleForMs: 60_000, waitedForMs: 120_000 })).toBe(false);
  });
});
