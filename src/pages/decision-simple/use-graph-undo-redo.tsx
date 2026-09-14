/**
 * S009 消费（第八十二批）：undo/redo 入口接线。
 *
 * 内核 S009（jdm-editor 0.8.0，172b608）交付形态：快照栈内建于 dg-store——结构变更/拖拽/
 * 500ms 防抖编辑自动入栈（上限 100），undo/redo/commitUndo 为 store actions（GraphRef 直挂），
 * canUndo/canRedo 为 store state；MiniMap 与 snapToGrid 画布内建，无需宿主接线。
 * 本模块补宿主侧入口：键盘快捷键 + 工具栏按钮（S005 P1 槽位协议）。
 */
import React from 'react';
import type { DecisionGraphRef, ToolbarItem } from '@republicroad/jdm-editor';

import { UndoRedoButton } from './undo-redo-button';

type GraphRef = React.RefObject<DecisionGraphRef | null>;

/** 焦点在文本输入控件内时不劫持快捷键（控件自带原生 undo 语义） */
export const isEditableTarget = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable === true;
};

export const useGraphUndoRedo = (graphRef: GraphRef): { toolbarItems: ToolbarItem[] } => {
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (isEditableTarget(event.target)) return;
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        graphRef.current?.undo();
      } else if ((key === 'z' && event.shiftKey) || key === 'y') {
        event.preventDefault();
        graphRef.current?.redo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [graphRef]);

  const toolbarItems = React.useMemo<ToolbarItem[]>(
    () => [
      { id: 'host:undo', group: 'edit', order: 0, render: () => <UndoRedoButton graphRef={graphRef} kind="undo" /> },
      { id: 'host:redo', group: 'edit', order: 1, render: () => <UndoRedoButton graphRef={graphRef} kind="redo" /> },
    ],
    [graphRef],
  );

  return { toolbarItems };
};
