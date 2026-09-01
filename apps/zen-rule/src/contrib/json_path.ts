// json_path 域(JSON 提取，有专属 UI 设计，文件名即 namespace)
import { JSONPath } from 'jsonpath-plus';

import { createExtRegister } from '../register.ts';

const registerUdf = createExtRegister(import.meta.url);

export const jsonPath = registerUdf('json_path', {
  description:
    '按 JSONPath 表达式从数据中提取值(标准语法，支持通配符/下标/过滤)，单个命中返回该值，多个命中返回数组；' +
    '无命中或表达式非法时返回 default. input 为对象，字符串会先尝试 JSON 解析.',
  parametersSchema: {
    properties: {
      input: {
        type: 'any',
        title: 'Input',
        description: '待提取的数据对象(字符串将尝试 JSON 解析)',
      },
      path: {
        type: 'string',
        title: 'Path',
        description: 'JSONPath 表达式，如 $.cart.items[*].price',
      },
      default: {
        type: 'any',
        title: 'Default',
        description: '无命中或解析失败时的回退值，默认 null',
        default: null,
      },
    },
    required: ['input', 'path'],
    title: 'json_path',
    type: 'object',
  },
  returnsSchema: { type: 'object', title: 'json_path 函数返回', properties: {} },
})(function jsonPathUdf(kwargs: Record<string, unknown>) {
  let data = kwargs?.input;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data) as unknown;
    } catch {
      data = kwargs?.input;
    }
  }
  const path = String(kwargs?.path ?? '').trim();
  const fallback = kwargs?.default ?? null;
  if (!path || data == null || typeof data !== 'object') {
    return fallback;
  }
  try {
    const hits = JSONPath({ path, json: data, wrap: true }) as unknown[];
    if (!hits || hits.length === 0) {
      return fallback;
    }
    return hits.length === 1 ? hits[0] : hits;
  } catch {
    return fallback;
  }
});
