import { describe, expect, test } from 'bun:test';
import { assertAcyclic, CYCLE_ERROR_MESSAGE } from '../graph-cycle';

describe('assertAcyclic', () => {
  test('无环边集合静默通过', () => {
    expect(() =>
      assertAcyclic([
        { sourceId: 'a', targetId: 'b' },
        { sourceId: 'b', targetId: 'c' },
      ]),
    ).not.toThrow();
  });

  test('空边集合静默通过', () => {
    expect(() => assertAcyclic([])).not.toThrow();
  });

  test('存在环时抛出固定文案', () => {
    expect(() =>
      assertAcyclic([
        { sourceId: 'a', targetId: 'b' },
        { sourceId: 'b', targetId: 'a' },
      ]),
    ).toThrow(CYCLE_ERROR_MESSAGE);
  });

  test('自环同样判定为环', () => {
    expect(() => assertAcyclic([{ sourceId: 'a', targetId: 'a' }])).toThrow(CYCLE_ERROR_MESSAGE);
  });
});
