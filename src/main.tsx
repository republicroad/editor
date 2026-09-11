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
import { toast } from 'sonner';
import { Rocket } from 'lucide-react';
import { Button } from '@republicroad/jdm-appshell/src/components/ui/button';
import { ThemeContextProvider, type SkinDefinition, type SkinSlotRender } from '@republicroad/jdm-appshell';
import { OceanCurrentDateNode } from './components/skins/ocean-current-date-node';
import { DecisionSimplePage } from './pages/decision-simple/index.tsx';
import { NotFoundPage } from './pages/not-found';

// 皮肤目录 = 宿主关注点：seeds 换配色，nodeOverrides 劫持节点 UI（一键换UI/换肤），
// layout 注入布局槽位（S005 P1：工具栏槽位；槽位 id 必须 host: 前缀，映射层校验）
/** ocean 皮肤的工具栏注入：发布按钮（S005 P1 消费示范，host:toolbar.publish 独立组） */
const publishSlot: SkinSlotRender = (ctx) => (
  <Button
    type="button"
    variant="outline"
    size="sm"
    disabled={ctx.disabled ?? false}
    title="Publish (skin slot demo — host:toolbar.publish)"
    onClick={() =>
      toast.info(
        `发布：当前图 ${ctx.graph?.nodes?.length ?? 0} 节点 / ${ctx.graph?.edges?.length ?? 0} 连线（槽位示范动作）`,
      )
    }
  >
    <Rocket size={13} />
    发布
  </Button>
);

const SKINS: SkinDefinition[] = [
  { id: 'default', label: '默认' },
  { id: 'violet', label: '品牌紫', seeds: { primary: '#7c3aed' } },
  {
    id: 'ocean',
    label: '海洋蓝（接管 current_date UI）',
    seeds: { primary: '#0369a1' },
    nodeOverrides: { current_date: { renderNode: OceanCurrentDateNode } },
    layout: {
      toolbar: {
        slots: { 'host:toolbar.publish': publishSlot },
      },
      // S005 P2：右缘面板槽位（Sheet 容器）
      panels: {
        right: {
          slots: {
            'host:panel.environment': ({ graph: g }) => (
              <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>Ocean 环境</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  节点 <strong>{(g.nodes ?? []).length}</strong> · 连线 <strong>{(g.edges ?? []).length}</strong>
                </p>
                <p style={{ margin: 0, opacity: 0.7 }}>
                  由皮肤 layout.panels.right 槽位渲染（host:panel.environment）。
                </p>
              </div>
            ),
          },
          order: ['host:panel.environment'],
        },
      },
      // S005 P3：头部槽位（左：环境标识；右：节点数徽标）
      header: {
        slots: {
          left: () => (
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              🌊 Ocean&nbsp;
              <span style={{ fontWeight: 400, opacity: 0.7 }}>staging</span>
            </span>
          ),
          right: ({ graph: g }) => (
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 999,
                background: 'rgba(3, 105, 161, 0.15)',
                color: '#075985',
              }}
            >
              {(g.nodes ?? []).length} nodes
            </span>
          ),
        },
      },
    },
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
