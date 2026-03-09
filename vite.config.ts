import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import wasm from 'vite-plugin-wasm';
import * as path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), wasm(), tsconfigPaths()],
  build: {
    outDir: path.join(__dirname, 'static'),
    // 将编辑器的构建输出到 apps/editor/public 目录，方便和后端服务器集成部署.
    // outDir: path.join(__dirname, 'apps/editor/public'),  
    target: 'esnext',
  },
  resolve: {
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
