import { describe, expect, test } from 'bun:test';

import './contrib.js';
import { udfManager } from './register.js';

const call = async (name: string, ...args: unknown[]): Promise<unknown> => {
  const kwargs = udfManager.funcBindParams(name, args);
  return udfManager.call(name, kwargs);
};

const STORE_JSON = {
  store: {
    bicycle: { color: 'red' },
    book: [
      { price: 10, title: 'a' },
      { price: 20, title: 'b' },
    ],
  },
};

describe('json_path UDF', () => {
  test('单命中返回值，多命中返回数组', async () => {
    expect(await call('json_path', STORE_JSON, '$.store.bicycle.color')).toBe('red');
    expect(await call('json_path', STORE_JSON, '$.store.book[*].price')).toEqual([10, 20]);
    expect(await call('json_path', STORE_JSON, '$.store.book[0].title')).toBe('a');
  });

  test('无命中回退 default(缺省 null)', async () => {
    expect(await call('json_path', STORE_JSON, '$.nope.deep')).toBeNull();
    expect(await call('json_path', STORE_JSON, '$.nope.deep', 'N/A')).toBe('N/A');
    expect(await call('json_path', STORE_JSON, '$.nope.deep', { fallback: true })).toEqual({ fallback: true });
  });

  test('字符串输入自动 JSON 解析；非法路径回退 default', async () => {
    expect(await call('json_path', '{"a":{"b":7}}', '$.a.b')).toBe(7);
    expect(await call('json_path', STORE_JSON, '$$$bad', 'fallback')).toBe('fallback');
    expect(await call('json_path', 'not-json', '$.a', 'fallback')).toBe('fallback');
  });

  test('default 参数 any 直通不被类型转换破坏', () => {
    const kwargs = udfManager.funcBindParams('json_path', [STORE_JSON, '$.x', 0]);
    expect(kwargs['default']).toBe(0);
    const keys = Object.keys(kwargs);
    expect(keys).toEqual(['input', 'path', 'default']);
  });
});

describe('template UDF', () => {
  test('基础与嵌套路径插值', async () => {
    expect(await call('template', '您好 ${user.name}', { user: { name: '张三' } })).toBe('您好 张三');
    expect(await call('template', '${a.b.c}!', { a: { b: { c: 42 } } })).toBe('42!');
  });

  test('数组下标与缺失变量', async () => {
    expect(await call('template', '第一项 ${items[0].name}', { items: [{ name: 'x' }] })).toBe('第一项 x');
    expect(await call('template', '[${missing}]', {})).toBe('[]');
    expect(await call('template', '${a.b}', { a: null })).toBe('');
  });

  test('无占位符原样返回；vars 缺省为空对象', async () => {
    expect(await call('template', 'plain $text')).toBe('plain $text');
    expect(await call('template', 'hi ${name}')).toBe('hi ');
    const kwargs = udfManager.funcBindParams('template', ['t']);
    expect(kwargs['vars']).toEqual({});
  });
});
