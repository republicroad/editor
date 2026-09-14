/**
 * S009 消费（第八十二批）：工具栏 undo/redo 按钮。
 * disabled 实时跟随内核 store 的 canUndo/canRedo（订阅 ref.stateStore；挂载前栈视为空）。
 * 独立成文件以满足 react-refresh 的导出约束（组件文件只出组件）。
 */
import React from 'react';
import { Redo2, Undo2 } from 'lucide-react';
import type { DecisionGraphRef } from '@republicroad/jdm-editor';

type GraphRef = React.RefObject<DecisionGraphRef | null>;

export const UndoRedoButton = ({ graphRef, kind }: { graphRef: GraphRef; kind: 'undo' | 'redo' }) => {
  const [available, setAvailable] = React.useState(false);

  React.useEffect(() => {
    const store = graphRef.current?.stateStore;
    if (!store) return;
    const sync = () => setAvailable(kind === 'undo' ? store.getState().canUndo : store.getState().canRedo);
    sync();
    return store.subscribe(sync);
  }, [graphRef, kind]);

  const Icon = kind === 'undo' ? Undo2 : Redo2;
  return (
    <button
      type="button"
      aria-label={kind === 'undo' ? 'undo' : 'redo'}
      title={kind === 'undo' ? 'Undo (Ctrl+Z)' : 'Redo (Ctrl+Shift+Z)'}
      disabled={!available}
      onClick={() => (kind === 'undo' ? graphRef.current?.undo() : graphRef.current?.redo())}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon size={13} />
    </button>
  );
};
