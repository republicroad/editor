import React, { useState } from 'react';

/** 顶栏可编辑标题：点击进入编辑态，blur/Enter 提交（trim + 非空校验），Escape 取消 */
export const EditableTitle: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  if (!editing && prevValue !== value) {
    setPrevValue(value);
    setDraft(value);
  }

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onChange(trimmed);
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        title={value}
        className="max-w-56 truncate rounded text-left text-base font-normal outline-none hover:bg-accent focus-visible:bg-accent"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
      >
        {value}
      </button>
    );
  }

  return (
    <input
      autoFocus
      value={draft}
      maxLength={24}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          commit();
        }
        if (event.key === 'Escape') {
          setEditing(false);
        }
      }}
      className="w-56 rounded-md border border-input bg-transparent px-1.5 py-0.5 text-base outline-none focus-visible:ring-1 focus-visible:ring-ring"
    />
  );
};
