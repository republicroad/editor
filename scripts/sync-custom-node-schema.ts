/**
 * 从 udfManager 合并注册表导出自定义节点 schema 镜像，写入 packages/appshell/src/assets/custom-node-schema.json。
 * 镜像用途：离线/库复用兜底夹具 + LLM 工具调用契约(与 /api/custom-nodes/schema 实时输出一致，含 namespace.type)。
 * 用法：注册或调整 contrib/ 扩展后执行 bun run sync:schema；
 *      门禁检查执行 bun run sync:schema:check(--check：不落盘，夹具漂移时以非零码退出)。
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { format } from 'prettier';

import { udfManager } from '../jdm-editor/packages/zen-udf/src/index.ts';

// 夹具随 appshell 抽包迁移（第四十三批）：归 packages/appshell 所有
const OUT_FILE = path.resolve(import.meta.dir, '../jdm-editor/packages/appshell/src/assets/custom-node-schema.json');
const checkMode = process.argv.includes('--check');

const namespaces = udfManager.udfFunctionSchemaNamespaces();
// 经 prettier 格式化(与仓库 .prettierrc 一致：endOfLine=lf、printWidth=120)，保证重复执行零 diff
const formatted = await format(JSON.stringify(namespaces), { parser: 'json', endOfLine: 'lf', printWidth: 120 });

/** 深比较辅助：递归排序对象键 + 数组按 name 规范化，消除键序/数组序/格式噪声 */
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

/** 语义规范化：namespace 与 tools 数组按 name 排序（内核/宿主生成端的数组序可能不同，契约无关） */
function normalizeNamespaces(value: unknown): unknown {
  const normalized = sortKeysDeep(value);
  if (Array.isArray(normalized)) {
    return normalized.sort((a, b) =>
      String((a as Record<string, unknown>).name ?? '').localeCompare(
        String((b as Record<string, unknown>).name ?? ''),
      ),
    );
  }
  return normalized;
}

if (checkMode) {
  // 语义比较（第七十八批）：解析后规范化深比较而非逐字节——容忍内核/宿主两侧 prettier 口径
  // 与数组序差异，只要 namespace/tool 契约一致即绿
  const existingRaw = await readFile(OUT_FILE, 'utf8');
  const semanticallyEqual =
    JSON.stringify(normalizeNamespaces(JSON.parse(existingRaw) as unknown)) ===
    JSON.stringify(normalizeNamespaces(namespaces));
  if (!semanticallyEqual) {
    console.error('[sync:schema] 夹具与合并注册表不一致——请执行 bun run sync:schema 刷新后提交');
    process.exit(1);
  }
  console.log(`[sync:schema] fixture up to date (${namespaces.length} namespace(s))`);
  process.exit(0);
}

await mkdir(path.dirname(OUT_FILE), { recursive: true });
await writeFile(OUT_FILE, formatted, 'utf8');

const toolCount = namespaces.reduce((sum, ns) => sum + (ns.tools?.length ?? 0), 0);
console.log(
  `synced ${namespaces.length} namespace(s), ${toolCount} tool(s) -> ${path.relative(process.cwd(), OUT_FILE)}`,
);
