import * as zenWasm from '@gorules/zen-engine-wasm';
import zenWasmUrl from '@gorules/zen-engine-wasm/dist/zen_engine_wasm_bg.wasm?url';

import React from 'react';
import ReactDOM from 'react-dom/client';

import './main.css';
import './lib/monaco';

// import '@republicroad/jdm-editor/dist/style.css';
import '@republicroad/jdm-editor';

import 'react-ace';

import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-json5';
import 'ace-builds/src-noconflict/mode-liquid';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-typescript';
import 'ace-builds/src-noconflict/snippets/javascript';
import 'ace-builds/src-noconflict/theme-chrome';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ThemeContextProvider, type SkinDefinition } from '@republicroad/jdm-appshell';
import { OceanCurrentDateNode } from './components/skins/ocean-current-date-node';
import { DecisionSimplePage } from './pages/decision-simple.tsx';
import { NotFoundPage } from './pages/not-found';

// 皮肤目录 = 宿主关注点：seeds 换配色，nodeOverrides 劫持节点 UI（一键换UI/换肤）
const SKINS: SkinDefinition[] = [
  { id: 'default', label: '默认' },
  { id: 'violet', label: '品牌紫', seeds: { primary: '#7c3aed' } },
  {
    id: 'ocean',
    label: '海洋蓝（接管 current_date UI）',
    seeds: { primary: '#0369a1' },
    nodeOverrides: { current_date: { renderNode: OceanCurrentDateNode } },
  },
];

// Example of a basic polyfill for environments without crypto.randomUUID
if (typeof crypto.randomUUID !== 'function') {
  crypto.randomUUID = function () {
    // 生成uuid4格式字符串
    const s = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    // const [p1,p2,p3,p4,p5] = s.split('-');
    // return `${p1}-${p2}-${p3}-${p4}-${p5}` as `${string}-${string}-${string}-${string}-${string}`;
    return s as `${string}-${string}-${string}-${string}-${string}`;
  };
}

await zenWasm.default(zenWasmUrl);

const router = createBrowserRouter([
  {
    path: '/',
    element: <DecisionSimplePage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeContextProvider options={{ skins: SKINS, defaultSkinId: 'default' }}>
      <RouterProvider router={router} />
    </ThemeContextProvider>
  </React.StrictMode>,
);
