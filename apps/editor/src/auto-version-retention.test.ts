// auto-version-retention 纯函数单测：auto 版本保留策略的选择逻辑（滚动条数 ∪ 按天检查点）。
// 落盘集成行为（pruneAutoVersions 全链路）见 index.test.ts 路由级用例。
import { describe, expect, test } from 'bun:test';
import { AUTO_VERSIONS_DAILY_KEEP, AUTO_VERSIONS_KEEP, pickAutoVersionsToPrune } from './auto-version-retention.js';

const NOW = new Date('2026-09-06T12:00:00.000Z');
/** NOW 往前 offsetDaysAgo 天的 UTC 时间戳（hh = 当日小时） */
const day = (offsetDaysAgo: number, hh = 10): string => {
  const d = new Date(NOW.getTime() - offsetDaysAgo * 86_400_000);
  d.setUTCHours(hh, 0, 0, 0);
  return d.toISOString();
};

describe('pickAutoVersionsToPrune', () => {
  test('常量：滚动条数 20 / 按天保留默认 30 天', () => {
    expect(AUTO_VERSIONS_KEEP).toBe(20);
    expect(AUTO_VERSIONS_DAILY_KEEP).toBe(30);
  });

  test('滚动条数：同日 21 条 auto 只删最旧 1 条（原策略回归）', () => {
    const autos = Array.from({ length: 21 }, (_, i) => ({ n: i + 2, updatedAt: day(0, 1 + i) }));
    expect(pickAutoVersionsToPrune(autos, { now: NOW })).toEqual(new Set([2]));
  });

  test('按天折叠：此前每天保留最新一条，当天条目只受滚动条数治理', () => {
    // 昨天 3 条（n2/n3/n4）→ 保留 n4；前天 2 条（n5/n6）→ 保留 n6；今天 2 条（n7/n8）→ 全保
    const autos = [
      { n: 2, updatedAt: day(1, 1) },
      { n: 3, updatedAt: day(1, 2) },
      { n: 4, updatedAt: day(1, 3) },
      { n: 5, updatedAt: day(2, 1) },
      { n: 6, updatedAt: day(2, 2) },
      { n: 7, updatedAt: day(0, 1) },
      { n: 8, updatedAt: day(0, 2) },
    ];
    // keepCount=2：今天的滚动窗口保 n7/n8；按天检查点保 n4/n6
    expect(pickAutoVersionsToPrune(autos, { now: NOW, keepCount: 2 })).toEqual(new Set([2, 3, 5]));
  });

  test('按天检查点受 dailyKeepDays 窗口限制：超出窗口的旧日检查点被删', () => {
    // 10 个先前日各 1 条（n2=10 天前 … n11=昨天），keepCount=1 / dailyKeepDays=7
    const autos = Array.from({ length: 10 }, (_, i) => ({ n: i + 2, updatedAt: day(10 - i, 1) }));
    // 滚动保 n11；按天窗口截取最近 7 个先前日（7 天前…昨天）→ 检查点 n5..n11
    expect(pickAutoVersionsToPrune(autos, { now: NOW, keepCount: 1, dailyKeepDays: 7 })).toEqual(new Set([2, 3, 4]));
  });

  test('dailyKeepDays=0 关闭按天保留：仅滚动条数生效', () => {
    const autos = [
      { n: 2, updatedAt: day(5, 1) },
      { n: 3, updatedAt: day(2, 1) },
      { n: 4, updatedAt: day(1, 1) },
      { n: 5, updatedAt: day(0, 1) },
    ];
    expect(pickAutoVersionsToPrune(autos, { now: NOW, keepCount: 1, dailyKeepDays: 0 })).toEqual(new Set([2, 3, 4]));
  });

  test('缺 updatedAt 的条目只受滚动条数保护', () => {
    const autos = [
      { n: 2 }, // 无时间戳：不参与按天折叠
      { n: 3, updatedAt: day(1, 1) },
      { n: 4, updatedAt: day(1, 2) },
    ];
    // keepCount=1 保 n4；昨天的检查点也是 n4（当日最新）——n2 缺时间戳、n3 输给检查点，均删
    expect(pickAutoVersionsToPrune(autos, { now: NOW, keepCount: 1 })).toEqual(new Set([2, 3]));
  });

  test('空输入返回空删除集合', () => {
    expect(pickAutoVersionsToPrune([], { now: NOW })).toEqual(new Set());
  });
});
