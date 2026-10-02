/**
 * postinstall 补丁（自愈式）：zen-udf 0.12.1 的 contrib/notify.ts 解构了不存在的 `.fn`
 * 成员（tool() 重构后应为 run）——TS 源发布模式下该文件的 TS2339 会进入所有消费者的
 * typecheck 程序。前置 @ts-nocheck 压制（运行时不受影响；注册表路径正常）。
 * 自愈：仅当缺陷标记存在时注入，内核修复发版后本补丁自动变为 no-op。
 * （S012 同类：宿主 postinstall 补丁为内核修复前的过渡手段。）
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const MARKER = 'fn: notifyWebhook';
const patched = [];

const roots = [path.resolve('node_modules/.bun'), path.resolve('apps/editor/node_modules/.bun')];
for (const root of roots) {
  if (!existsSync(root)) continue;
  for (const entry of readdirSync(root)) {
    if (!entry.startsWith('@republicroad+zen-udf@')) continue;
    const contribDir = path.join(root, entry, 'node_modules', '@republicroad', 'zen-udf', 'src', 'contrib');
    const file = path.join(contribDir, 'notify.ts');
    if (!existsSync(file)) continue;
    const content = readFileSync(file, 'utf-8');
    if (content.includes(MARKER) && !content.startsWith('// @ts-nocheck')) {
      writeFileSync(file, `// @ts-nocheck — S012 残留缺陷（.fn 旧成员名），内核修复后本行自愈消失\n${content}`);
      patched.push(path.relative(process.cwd(), file));
    }
  }
}
console.log(
  `[patch-zen-udf] notify.ts @ts-nocheck 注入：${patched.length ? patched.join(', ') : 'no-op（已修复或已注入）'}`,
);
