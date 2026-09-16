/**
 * 从 globalUdfRegistry 合并注册表导出自定义节点 schema 镜像，写入 src/assets/custom-node-schema.json。
 * 镜像用途：离线/库复用兜底夹具 + LLM 工具调用契约(与 /api/custom-nodes/schema 实时输出一致，含 namespace.type)。
 * 用法：注册或调整 contrib/ 扩展后执行 bun run sync:schema；
 *      门禁检查执行 bun run sync:schema:check(--check：不落盘，夹具漂移时以非零码退出)。
 * 注：@republicroad/* 三包为 npm semver 消费（docs/19），夹具落宿主仓——appshell 运行时
 *    兜底夹具由其发布包自带，宿主此文件为契约镜像（升级内核后跑 sync:schema 核对漂移）。
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { format } from 'prettier';

import { globalUdfRegistry } from '@republicroad/zen-udf';

// 夹具落宿主仓（第八十五批 npm 化：原内核 appshell 资产路径随 submodule 退役不可达）
const OUT_FILE = path.resolve(import.meta.dir, '../src/assets/custom-node-schema.json');
const checkMode = process.argv.includes('--check');

const namespaces = globalUdfRegistry.udfFunctionSchemaNamespaces();
// 经 prettier 格式化(与仓库 .prettierrc 一致：endOfLine=lf、printWidth=120)，保证重复执行零 diff
const formatted = await format(JSON.stringify(namespaces), { parser: 'json', endOfLine: 'lf', printWidth: 120 });

if (checkMode) {
  const existing = await readFile(OUT_FILE, 'utf-8');
  if (existing !== formatted) {
    console.error('[sync:schema] 夹具与合并注册表不一致——请执行 bun run sync:schema 刷新后提交');
    process.exit(1);
  }
  console.log(`[sync:schema] fixture up to date (${namespaces.length} namespace(s))`);
  process.exit(0);
}

await mkdir(path.dirname(OUT_FILE), { recursive: true });
await writeFile(OUT_FILE, formatted, 'utf-8');
console.log(
  `synced ${namespaces.length} namespace(s), ${namespaces.reduce((sum, ns) => sum + ns.tools.length, 0)} tool(s) -> ${path.relative(process.cwd(), OUT_FILE)}`,
);
