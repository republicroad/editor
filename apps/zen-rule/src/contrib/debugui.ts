// debugui 域(调试用专属 UI 函数，文件名即 namespace)
import { createExtRegister } from '../register.ts';

const registerUdf = createExtRegister(import.meta.url);

export const currentDate = registerUdf('current_date', {
  description: '返回服务器当前日期(本地时区，YYYY-MM-DD 格式)，无参数.',
  parametersSchema: {
    properties: {},
    title: 'current_date',
    type: 'object',
  },
  returnsSchema: { type: 'string', title: 'current_date 函数返回', properties: {} },
})(function currentDateUdf() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
});
