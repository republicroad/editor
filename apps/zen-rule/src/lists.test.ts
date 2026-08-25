import { describe, expect, test } from 'bun:test';
import { deleteList, getList, listLists, queryList, registerList } from './lists.js';

describe('lists storage', () => {
  test('register + get 往返，重复注册覆盖旧值', () => {
    registerList({ name: 't_list', description: '测试名单', items: ['a', 'b'] });
    expect(getList('t_list')).toEqual({ name: 't_list', description: '测试名单', items: ['a', 'b'] });

    registerList({ name: 't_list', items: ['c'] });
    expect(getList('t_list')?.items).toEqual(['c']);

    deleteList('t_list');
  });

  test('listLists 支持名称大小写不敏感过滤', () => {
    registerList({ name: 'Alpha_List', items: [] });
    registerList({ name: 'beta-list', items: [] });
    const names = listLists('ALPHA').map((list) => list.name);
    expect(names).toEqual(['Alpha_List']);
    expect(listLists().length).toBeGreaterThanOrEqual(2);
    deleteList('Alpha_List');
    deleteList('beta-list');
  });

  test('queryList 返回命中结果，缺失名单返回 hit=false', () => {
    registerList({ name: 't_query', items: ['1.2.3.4'] });
    expect(queryList('t_query', '1.2.3.4')).toEqual({ hit: true, list: 't_query', value: '1.2.3.4' });
    expect(queryList('t_query', '5.6.7.8').hit).toBe(false);
    expect(queryList('missing_list', 'x').hit).toBe(false);
    deleteList('t_query');
  });

  test('deleteList 返回是否存在，删除后不可查', () => {
    registerList({ name: 't_del', items: [] });
    expect(deleteList('t_del')).toBe(true);
    expect(deleteList('t_del')).toBe(false);
    expect(getList('t_del')).toBeUndefined();
  });
});

describe('lists owner scoping', () => {
  test('私有名单仅 owner 可见，共享名单所有人可见', () => {
    registerList({ name: 'o_private_a', items: ['x'] }, 'user-a');
    registerList({ name: 'o_private_b', items: ['y'] }, 'user-b');
    registerList({ name: 'o_shared', items: ['z'] });

    expect(getList('o_private_a', 'user-a')?.items).toEqual(['x']);
    expect(getList('o_private_a', 'user-b')).toBeUndefined();
    expect(getList('o_shared', 'user-b')).toBeDefined();
    // 无 actor = 管理员视角全可见
    expect(getList('o_private_a')).toBeDefined();

    const visibleB = listLists(undefined, 'user-b').map((l) => l.name);
    expect(visibleB).toContain('o_private_b');
    expect(visibleB).toContain('o_shared');
    expect(visibleB).not.toContain('o_private_a');

    deleteList('o_private_a', undefined);
    deleteList('o_private_b', undefined);
    deleteList('o_shared');
  });

  test('同名时自有遮蔽共享，且两份名单互不覆盖', () => {
    registerList({ name: 'o_shadow', items: ['shared-item'] });
    registerList({ name: 'o_shadow', items: ['own-item'] }, 'user-a');

    expect(getList('o_shadow', 'user-a')?.items).toEqual(['own-item']);
    expect(getList('o_shadow', 'user-b')?.items).toEqual(['shared-item']);
    // 删自有后回落到共享
    deleteList('o_shadow', 'user-a');
    expect(getList('o_shadow', 'user-a')?.items).toEqual(['shared-item']);
    deleteList('o_shadow');
  });

  test('deleteList 权限矩阵：私有仅 owner/管理员, 共享任意 actor', () => {
    registerList({ name: 'o_perm_priv', items: [] }, 'u1');
    registerList({ name: 'o_perm_shared', items: [] });

    expect(deleteList('o_perm_priv', 'u2')).toBe(false);
    expect(deleteList('o_perm_priv', 'u1')).toBe(true);
    expect(deleteList('o_perm_shared', 'anyone')).toBe(true);
    registerList({ name: 'o_perm_priv', items: [] }, 'u9');
    expect(deleteList('o_perm_priv')).toBe(true);
  });

  test('registerList 兼容对象内 owner 字段与第二参数两种传法', () => {
    registerList({ name: 'o_field', items: [], owner: 'via-field' });
    expect(getList('o_field', 'via-field')).toBeDefined();
    expect(getList('o_field', 'other')).toBeUndefined();
    deleteList('o_field');

    registerList({ name: 'o_param', items: [] }, 'via-param');
    expect(getList('o_param', 'via-param')).toBeDefined();
    deleteList('o_param', 'via-param');
  });

  test('并发双 ctx 下 query_list UDF 各自命中 actor 私有名单', async () => {
    const { runWithExecContext } = await import('./exec-context.js');
    const { udfManager } = await import('./register.js');
    registerList({ name: 'o_udf_a', items: ['ip-a'] }, 'udf-user-a');
    registerList({ name: 'o_udf_b', items: ['ip-b'] }, 'udf-user-b');

    const call = () =>
      udfManager.call('query_list', { listName: 'o_udf_a', value: 'ip-a' }) as Promise<{ hit: boolean }>;
    const [asA, asB] = await Promise.all([
      runWithExecContext({ userId: 'udf-user-a' }, call),
      runWithExecContext({ userId: 'udf-user-b' }, call),
    ]);
    expect(asA.hit).toBe(true);
    expect(asB.hit).toBe(false);

    deleteList('o_udf_a', undefined);
    deleteList('o_udf_b', undefined);
  });
});
