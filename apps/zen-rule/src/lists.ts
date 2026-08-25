import { registerUdf } from './register.js';
import { getExecContext } from './exec-context.js';

export interface NamedList {
  name: string;
  description?: string;
  items: string[];
  owner?: string;
}

/** 外层键为归属域(''=共享, 其余=owner id), 内层键为名单名; 同名时自有遮蔽共享 */
const scopes = new Map<string, Map<string, NamedList>>();

const scopeOf = (owner?: string): Map<string, NamedList> => {
  const key = owner ?? '';
  let map = scopes.get(key);
  if (!map) {
    map = new Map<string, NamedList>();
    scopes.set(key, map);
  }
  return map;
};

export const registerList = (list: NamedList, owner?: string): void => {
  const effective = owner ?? list.owner;
  const stored: NamedList = effective !== undefined ? { ...list, owner: effective } : { ...list, owner: undefined };
  scopeOf(effective).set(stored.name, stored);
};

type ScopeEntry = { list: NamedList; scopeKey: string };

/** 解析 actor 可访问的名单: 有 actor 时自有优先、他人私有不可见; 无 actor(管理员)共享优先、遍历全部 */
const resolveEntry = (name: string, actor?: string): ScopeEntry | null => {
  if (actor !== undefined) {
    const own = scopes.get(actor)?.get(name);
    if (own) return { list: own, scopeKey: actor };
    const shared = scopes.get('')?.get(name);
    if (shared) return { list: shared, scopeKey: '' };
    return null;
  }
  const shared = scopes.get('')?.get(name);
  if (shared) return { list: shared, scopeKey: '' };
  for (const [key, map] of scopes) {
    if (key === '') continue;
    const hit = map.get(name);
    if (hit) return { list: hit, scopeKey: key };
  }
  return null;
};

export const getList = (name: string, actor?: string): NamedList | undefined => resolveEntry(name, actor)?.list;

export const listLists = (query?: string, actor?: string): NamedList[] => {
  const collected: NamedList[] = [];
  if (actor !== undefined) {
    collected.push(...(scopes.get(actor)?.values() ?? []));
    collected.push(...(scopes.get('')?.values() ?? []));
  } else {
    for (const map of scopes.values()) collected.push(...map.values());
  }
  const q = query?.trim().toLowerCase() ?? '';
  const visible = q ? collected.filter((list) => list.name.toLowerCase().includes(q)) : collected;
  return visible.map((list) => ({ ...list }));
};

/** 删除名单; 私有仅 owner 或管理员可删, 共享任意调用方可删; 返回是否存在且有权(便于 API 层区分 404) */
export const deleteList = (name: string, actor?: string): boolean => {
  const entry = resolveEntry(name, actor);
  if (!entry) return false;
  if (entry.list.owner !== undefined && actor !== undefined && entry.list.owner !== actor) {
    return false;
  }
  return scopes.get(entry.scopeKey)?.delete(name) ?? false;
};

export const queryList = (
  name: string,
  value: unknown,
  actor?: string,
): { hit: boolean; list: string; value: unknown } => {
  const list = resolveEntry(name, actor)?.list;
  const hit = list ? list.items.some((item) => String(item) === String(value)) : false;
  return { hit, list: list?.name ?? name, value };
};

registerUdf('query_list', 'risk', {
  description: '查询名单：在服务端指定名单中查询某个值是否存在，返回命中结果.',
  parametersSchema: {
    properties: {
      listName: {
        type: 'string',
        title: '名单',
        description: '服务端名单名称(从名单下拉中动态选择)',
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
  return queryList(String(kwargs?.listName ?? ''), kwargs?.value ?? null, getExecContext()?.userId);
});
