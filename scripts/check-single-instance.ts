/**
 * 单实例守卫：isolated 布局下关键共享依赖在 store 中必须只有 1 个版本。
 *
 * 原理：isolated 下 host 与子仓成员各自 symlink 自己声明的依赖——若双方解析到
 * 不同版本，store 会出现多个物理副本（双 React/双 lezer 实例，类型与 hooks 均
 * 会炸）。本脚本扫描 node_modules/.bun 的目录名，断言关键依赖只有 1 个版本。
 *
 * 用法：bun run check:single-instance（CI 在 bun install 之后执行）
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const WATCH = [
  'react@',
  'react-dom@',
  '@types+react@',
  '@types+react-dom@',
  '@lezer+common@',
  '@lezer+lr@',
  '@lezer+highlight@',
  '@codemirror+state@',
  '@codemirror+language@',
  '@codemirror+view@',
];

const storeDir = join(import.meta.dir, '..', 'node_modules', '.bun');

let entries: string[] = [];
try {
  entries = readdirSync(storeDir);
} catch {
  console.error(`[single-instance] store 目录不存在: ${storeDir}（先 bun install）`);
  process.exit(1);
}

const violations: string[] = [];

for (const prefix of WATCH) {
  const hits = entries.filter((e) => e.startsWith(prefix));
  if (hits.length <= 1) continue;
  const versions = hits.map((h) => h.slice(prefix.length).split('+')[0]).join(', ');
  violations.push(`${prefix.replace(/@$/, '')}: ${hits.length} 份（${versions}）`);
}

if (violations.length > 0) {
  console.error('[single-instance] 关键依赖出现多版本（双实例风险）：');
  for (const v of violations) console.error(`  - ${v}`);
  console.error('修复：根 package.json overrides 强制统一版本，或对齐双仓声明范围后 bun install。');
  process.exit(1);
}

console.log(`[single-instance] ${WATCH.length} 个关键依赖均为单实例 ✓`);
