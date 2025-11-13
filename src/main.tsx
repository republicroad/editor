import * as zenWasm from '@gorules/zen-engine-wasm';
import zenWasmUrl from '@gorules/zen-engine-wasm/dist/zen_engine_wasm_bg.wasm?url';

import React from 'react';
import ReactDOM from 'react-dom/client';

import './main.css';

// import '@gorules/jdm-editor/dist/style.css';
import '@gorules/jdm-editor';  

import 'react-ace';

import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-json5';
import 'ace-builds/src-noconflict/mode-liquid';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-typescript';
import 'ace-builds/src-noconflict/snippets/javascript';
import 'ace-builds/src-noconflict/theme-chrome';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { DecisionSimplePage } from './pages/decision-simple.tsx';
import { NotFoundPage } from './pages/not-found';
import { ThemeContextProvider } from './context/theme.provider.tsx';

// Example of a basic polyfill for environments without crypto.randomUUID
if (typeof crypto.randomUUID !== 'function') {
    crypto.randomUUID = function () {
        // 生成uuid4格式字符串
        const s = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        const [p1,p2,p3,p4,p5] = s.split('-');
        return `${p1}-${p2}-${p3}-${p4}-${p5}`
    };
}

await zenWasm.default(zenWasmUrl);

const router = createBrowserRouter([
  {
    path: '*',
    element: <DecisionSimplePage />,
  },
//   {
//     path: '*',
//     element: <NotFoundPage />,
//   },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeContextProvider>
      <RouterProvider router={router} />
    </ThemeContextProvider>
  </React.StrictMode>,
);
