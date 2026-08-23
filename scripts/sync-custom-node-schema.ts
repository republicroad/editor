/**
 * 从 zen-rule udfManager 导出自定义节点 schema，写入 src/assets/custom-node-schema.json。
 * 用法：bun run sync:schema（注册新 UDF 后执行一次，替代手工维护夹具）
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { udfManager } from '../apps/zen-rule/src/index.js';

const OUT_FILE = path.resolve(import.meta.dir, '../src/assets/custom-node-schema.json');

const namespaces = udfManager.udfFunctionSchemaNamespaces();

await mkdir(path.dirname(OUT_FILE), { recursive: true });
await writeFile(OUT_FILE, `${JSON.stringify(namespaces, null, 2)}\n`, 'utf8');

const toolCount = namespaces.reduce((sum, ns) => sum + (ns.tools?.length ?? 0), 0);
console.log(
  `synced ${namespaces.length} namespace(s), ${toolCount} tool(s) -> ${path.relative(process.cwd(), OUT_FILE)}`,
);
