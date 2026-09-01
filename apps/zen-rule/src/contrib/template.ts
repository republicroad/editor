// template 域(模板渲染，有专属 UI 设计，文件名即 namespace)
import { createExtRegister } from '../register.ts';

const registerUdf = createExtRegister(import.meta.url);

const TEMPLATE_VAR_PATTERN = /\$\{([^}]+)\}/g;

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

/** 点路径 + [n] 数组下标取值，缺失返回 undefined */
const resolveTemplatePath = (vars: Record<string, unknown>, path: string): unknown => {
  const segments = path
    .split('.')
    .flatMap((segment) => {
      const match = segment.match(/^(.*?)\[(\d+)\]$/);
      return match ? [match[1], Number(match[2])] : [segment];
    })
    .filter((segment) => segment !== '');
  let current: unknown = vars;
  for (const segment of segments) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string | number, unknown>)[segment as string];
  }
  return current;
};

export const templateRender = registerUdf('template', {
  description:
    '渲染模板字符串：${path} 形式插值 vars 对象(支持点路径与 [n] 数组下标)，缺失变量替换为空串；' +
    '非字符串值按 String() 序列化.',
  parametersSchema: {
    properties: {
      template: {
        type: 'string',
        title: 'Template',
        description: '模板字符串，如 "您好 ${user.name}"',
      },
      vars: {
        type: 'object',
        title: 'Vars',
        description: '插值变量键值对对象，默认空对象',
        default: {},
      },
    },
    required: ['template'],
    title: 'template',
    type: 'object',
  },
  returnsSchema: { type: 'string', title: 'template 函数返回', properties: {} },
})(function templateUdf(kwargs: Record<string, unknown>) {
  const tpl = String(kwargs?.template ?? '');
  const vars = asRecord(kwargs?.vars);
  return tpl.replace(TEMPLATE_VAR_PATTERN, (_match, expr: string) => {
    const value = resolveTemplatePath(vars, expr.trim());
    return value == null ? '' : String(value);
  });
});
