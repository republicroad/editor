import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import wasm from 'vite-plugin-wasm';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import tailwindcss from '@tailwindcss/vite';
import * as path from 'path';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// 反射定位 monaco-editor 的 package.json，读取其 version 生成版本化静态路径(与 src/lib/monaco.ts 单一来源，见下方 define)。
// 说明：
//  - monaco-editor 0.52.x 无 exports 且 main 为空(仅 module)，Node 下裸名 'monaco-editor' 解析失败，
//    但任意子路径可直接解析；0.56.x 起改为 exports map(不导出 './package.json'，会被 catch-all "./*" 改写)，
//    裸名可解析但 'esm/...' 子路径会被改写。故按序尝试裸名 / ESM 入口。
//  - 拿到包内真实文件后，自入口向上逐级找最近的 package.json。
//    刻意不依赖 node:module.findPackageJSON(需 Node ≥22.14.0，且 bun 1.x 的 node:module 未实现)，
//    bun 亦可用；config 层 import.meta.dirname 需 Node ≥20.11(低于 Vite 8 自身的 ≥20.19 门槛，不构成约束)。
const require = createRequire(import.meta.url);

// Vite 8 的 configLoader:'native'(未来默认)不支持 __dirname——统一改用 import.meta.dirname
// (package.json type:module，config 以 ESM 加载)
const rootDir = import.meta.dirname;

function resolveMonacoEntry(): string {
  for (const specifier of ['monaco-editor', 'monaco-editor/esm/vs/editor/editor.main.js']) {
    try {
      return require.resolve(specifier);
    } catch {
      // 尝试下一个候选
    }
  }
  throw new Error('Cannot resolve monaco-editor entry');
}

function findMonacoPackageJson(entry: string): string {
  let dir = path.dirname(entry);
  for (;;) {
    const candidate = path.join(dir, 'package.json');
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('Cannot locate package.json for monaco-editor');
}

const MONACO_VS_BASE = `/monaco-editor@${(JSON.parse(readFileSync(findMonacoPackageJson(resolveMonacoEntry()), 'utf8')) as { version: string }).version}/min/vs`;

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __MONACO_VS_BASE__: JSON.stringify(MONACO_VS_BASE),
  },
  plugins: [
    react(),
    wasm(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          // 插件会保留 src 匹配到的目录结构，stripBase: 4 剥离 node_modules/monaco-editor/min/vs 前缀
          src: 'node_modules/monaco-editor/min/vs/**/*',
          dest: MONACO_VS_BASE.slice(1),
          rename: { stripBase: 4 },
        },
      ],
    }),
  ],
  build: {
    outDir: path.join(rootDir, 'static'),
    // 将编辑器的构建输出到 apps/editor/public 目录，方便和后端服务器集成部署.
    // outDir: path.join(__dirname, 'apps/editor/public'),
    target: 'esnext',
  },
  resolve: {
    // Vite 8 内置 tsconfig paths 解析（S008 消费后启用：内核 monaco 类型映射已删，
    // monaco 全走 node_modules 解析）。按 importer 就近 tsconfig 各解析各的——
    // 宿主 `@/*`、`@republicroad/jdm-appshell*` 走根 tsconfig，内核 `#*` 走内核 tsconfig。
    // 内核 barrel(@republicroad/jdm-editor) 由下方 alias 显式直通 src（alias 优先于 paths）。
    tsconfigPaths: true,
    alias: {
      '@republicroad/jdm-editor': path.join(rootDir, 'jdm-editor/packages/jdm-editor/src/index.ts'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    // https: {
    //   cert: path.join(__dirname, 'cert', 'localhost.pem'),
    //   key: path.join(__dirname, 'cert', 'localhost-key.pem'),
    // },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''), // Optional: Remove '/api' prefix
      },
    },
  },
});
