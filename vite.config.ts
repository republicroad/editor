import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import wasm from 'vite-plugin-wasm';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import tailwindcss from '@tailwindcss/vite';
import * as path from 'path';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import tsconfigPaths from 'vite-tsconfig-paths';

// 反射定位 monaco-editor 的 package.json，读取其 version 生成版本化静态路径(与 src/lib/monaco.ts 单一来源，见下方 define)。
// 说明：
//  - monaco-editor 0.52.x 无 exports 且 main 为空(仅 module)，Node 下裸名 'monaco-editor' 解析失败，
//    但任意子路径可直接解析；0.56.x 起改为 exports map(不导出 './package.json'，会被 catch-all "./*" 改写)，
//    裸名可解析但 'esm/...' 子路径会被改写。故按序尝试裸名 / ESM 入口。
//  - 拿到包内真实文件后，自入口向上逐级找最近的 package.json。
//    刻意不依赖 node:module.findPackageJSON(需 Node ≥22.14.0，且 bun 1.x 的 node:module 未实现)，
//    因此最低兼容 Node ≥18(与 package.json engines.node 一致)，bun 亦可用。
const require = createRequire(import.meta.url);

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

// 内核 tsconfig 的 `@/*` 别名指向内核自身 src；宿主的 `@/*` 指向主仓 src。
// 两个 project 一起交给 vite-tsconfig-paths，按 importer 所在目录各解析各的；
// 内核 barrel(@republicroad/jdm-editor) 由 resolve.alias 显式直通 src（优先级高于 paths，
// 且绕开根 tsconfig paths 中面向 tsc 的 tmp/kernel-types 类型桥）。
const tsconfigProjects = [
  path.join(__dirname, 'tsconfig.json'),
  path.join(__dirname, 'jdm-editor/packages/jdm-editor/tsconfig.json'),
];

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __MONACO_VS_BASE__: JSON.stringify(MONACO_VS_BASE),
  },
  plugins: [
    react(),
    wasm(),
    tailwindcss(),
    tsconfigPaths({ projects: tsconfigProjects }),
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
    outDir: path.join(__dirname, 'static'),
    // 将编辑器的构建输出到 apps/editor/public 目录，方便和后端服务器集成部署.
    // outDir: path.join(__dirname, 'apps/editor/public'),
    target: 'esnext',
  },
  resolve: {
    alias: {
      '@republicroad/jdm-editor': path.join(__dirname, 'jdm-editor/packages/jdm-editor/src/index.ts'),
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
