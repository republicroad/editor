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
