/**
 * 批量旧图 kind 迁移（第六十七批 D1，docs/13 §8.3 已验证映射表）。
 *
 * 用法：
 *   bun scripts/migrate-legacy-graphs.ts [目录或文件...] [--dry-run]
 * 缺省扫描 apps/editor/graphs（含 head 与版本文件）；对每个 .json 图执行
 * migrateLegacyNodeKinds，有变化才写回（2 空格缩进）；--dry-run 只报告不写。
 *
 * 迁移规则与在线路径（normalizeGraphNodes）共用同一纯函数，幂等：
 *   contrib.<fn> → <fn>（http_request 例外保留，走占位卡）
 *   roster.roster / risk.query_list → roster
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'path';
import { migrateLegacyNodeKinds } from '../src/lib/graph-kind-migration.ts';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const targets = args.filter((a) => !a.startsWith('--'));
const roots = targets.length > 0 ? targets : ['apps/editor/graphs'];

const jsonFilesUnder = async (root: string): Promise<string[]> => {
  const st = await readdir(root, { withFileTypes: true }).catch(() => null);
  if (!st) return root.endsWith('.json') ? [root] : [];
  const files: string[] = [];
  for (const e of st) {
    const p = path.join(root, e.name);
    if (e.isDirectory()) files.push(...(await jsonFilesUnder(p)));
    else if (e.name.endsWith('.json')) files.push(p);
  }
  return files;
};

let scanned = 0;
let filesChanged = 0;
let nodesMigrated = 0;

for (const root of roots) {
  for (const file of await jsonFilesUnder(root)) {
    let data: unknown;
    try {
      data = JSON.parse(await readFile(file, 'utf8'));
    } catch {
      continue; // 非 JSON 图文件
    }
    const container = data as { content?: { nodes?: unknown[] }; nodes?: unknown[] };
    const nodes = (container?.content?.nodes ?? container?.nodes) as
      | Parameters<typeof migrateLegacyNodeKinds>[0]
      | undefined;
    if (!Array.isArray(nodes)) continue;

    scanned += 1;
    const { nodes: migrated, changes } = migrateLegacyNodeKinds(nodes);
    if (changes.length === 0) continue;

    nodesMigrated += changes.length;
    filesChanged += 1;
    console.log(`[migrate] ${file}: ${changes.map((c) => `${c.from}→${c.to}`).join(', ')}`);
    if (dryRun) continue;

    if (container?.content?.nodes) container.content.nodes = migrated;
    else if (container?.nodes) container.nodes = migrated;
    await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  }
}

console.log(
  `[migrate] 完成：扫描 ${scanned} 个图文件，迁移 ${nodesMigrated} 个节点（${filesChanged} 个文件）${dryRun ? '【dry-run 未写盘】' : ''}`,
);
if (dryRun) console.log('[migrate] 去掉 --dry-run 以写盘');
