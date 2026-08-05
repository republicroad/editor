import { loader } from '@monaco-editor/react';

// 由 vite.config.ts 的 define 注入，与 viteStaticCopy 的 dest 单一来源保持一致
const MONACO_VS_BASE = __MONACO_VS_BASE__;

self.MonacoEnvironment = {
  getWorkerUrl() {
    // Monaco min 版本使用统一的 workerMain.js
    return `${MONACO_VS_BASE}/base/worker/workerMain.js`;
  },
};

loader.config({
  paths: {
    vs: MONACO_VS_BASE,
  },
});
