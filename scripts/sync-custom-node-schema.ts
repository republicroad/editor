/**
 * 从 udfManager 合并注册表导出自定义节点 schema 镜像，写入 packages/appshell/src/assets/custom-node-schema.json。
 * 镜像用途：离线/库复用兜底夹具 + LLM 工具调用契约(与 /api/custom-nodes/schema 实时输出一致，含 namespace.type)。
 * 用法：注册或调整 contrib/ 扩展后执行 bun run sync:schema；
 *      门禁检查执行 bun run sync:schema:check(--check：不落盘，夹具漂移时以非零码退出)。
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { format } from 'prettier';

import { udfManager } from '../apps/zen-rule/src/index.js';

// 夹具随 appshell 抽包迁移（第四十三批）：归 packages/appshell 所有
const OUT_FILE = path.resolve(import.meta.dir, '../jdm-editor/packages/appshell/src/assets/custom-node-schema.json');
const checkMode = process.argv.includes('--check');

const namespaces = udfManager.udfFunctionSchemaNamespaces();
// 经 prettier 格式化(与仓库 .prettierrc 一致：endOfLine=lf、printWidth=120)，保证重复执行零 diff
const formatted = await format(JSON.stringify(namespaces), { parser: 'json', endOfLine: 'lf', printWidth: 120 });

if (checkMode) {
  // 语义比较（第七十八批）：解析后深比较而非逐字节——容忍内核/宿主两侧 prettier 口径差异，
  // 只要 namespace/tool 契约一致即绿（背景：内核 HEAD fixture 曾为展开/混合格式）
  const existingRaw = await readFile(OUT_FILE, 'utf8');
  const existingParsed = JSON.parse(existingRaw) as unknown;
  const semanticallyEqual =
    JSON.stringify(sortKeysDeep(existingParsed)) === JSON.stringify(sortKeysDeep(namespaces));
  if (!semanticallyEqual) {
    console.error('[sync:schema] 夹具与合并注册表不一致——请执行 bun run sync:schema 刷新后提交');
    process.exit(1);
  }
  console.log(`[sync:schema] fixture up to date (${namespaces.length} namespace(s))`);
  process.exit(0);
}

await mkdir(path.dirname(OUT_FILE), { recursive: true });
await writeFile(OUT_FILE, formatted, 'utf8');

/** 深比较辅助：对象键递归排序后序列化，消除键序与格式噪声 */
function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value !== null && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

await mkdir(path.dirname(OUT_FILE), { recursive: true });
await writeFile(OUT_FILE, formatted, 'utf8');

const toolCount = namespaces.reduce((sum, ns) => sum + (ns.tools?.length ?? 0), 0);
console.log(
  `synced ${namespaces.length} namespace(s), ${toolCount} tool(s) -> ${path.relative(process.cwd(), OUT_FILE)}`,
);
