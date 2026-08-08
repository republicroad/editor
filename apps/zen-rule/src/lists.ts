import { registerUdf } from './register.js';

export interface NamedList {
  name: string;
  description?: string;
  items: string[];
}

const lists = new Map<string, NamedList>();

export const registerList = (list: NamedList): void => {
  lists.set(list.name, list);
};

export const getList = (name: string): NamedList | undefined => lists.get(name);

export const listLists = (query?: string): NamedList[] => {
  const q = query?.trim().toLowerCase() ?? '';
  const all = [...lists.values()];
  if (!q) {
    return all;
  }
  return all.filter((list) => list.name.toLowerCase().includes(q));
};

export const queryList = (name: string, value: unknown): { hit: boolean; list: string; value: unknown } => {
  const list = lists.get(name);
  const hit = list ? list.items.some((item) => String(item) === String(value)) : false;
  return { hit, list: name, value };
};

registerUdf('query_list', 'risk', {
  description: '查询名单：在服务端指定名单中查询某个值是否存在，返回命中结果.',
  parametersSchema: {
    properties: {
      listName: {
        type: 'string',
        title: '名单',
        description: '服务端名单名称（从名单下拉中动态选择）',
      },
      value: {
        type: 'string',
        title: '查询值',
        description: '待查询的值',
      },
    },
    required: ['listName', 'value'],
    title: 'query_list',
    type: 'object',
  },
  returnsSchema: { type: 'object', title: 'query_list 函数返回', properties: {} },
})(function queryListUdf(kwargs: Record<string, unknown>) {
  return queryList(String(kwargs?.listName ?? ''), kwargs?.value ?? null);
});
