import { afterEach, describe, expect, test } from 'bun:test';
import React from 'react';

import { setupJsDom } from '../../../src/test-utils/setup-jsdom';

setupJsDom();

import { installJdmEditorMock, resetJdmMock } from '../../../src/test-utils/mock-jdm-editor';

installJdmEditorMock();

const { cleanup, fireEvent, render, screen } = await import('@testing-library/react');
const { KeyValueEditor } = await import('../../../packages/appshell/src/components/custom-node/key-value-editor');

const changes: string[] = [];

const Harness: React.FC = () => {
  const [value, setValue] = React.useState('{ Token: "abc" }');
  return (
    <KeyValueEditor
      label="Headers"
      addLabel="添加"
      deleteLabel="删除"
      valuePlaceholder="值"
      rawPlaceholder="原始"
      value={value}
      onChange={(next) => {
        changes.push(next);
        setValue(next);
      }}
    />
  );
};

const renderEditor = (value: string) => {
  changes.length = 0;
  render(
    <KeyValueEditor
      label="Headers"
      addLabel="添加"
      deleteLabel="删除"
      valuePlaceholder="值"
      rawPlaceholder="原始"
      value={value}
      onChange={(next) => changes.push(next)}
    />,
  );
};

afterEach(() => {
  cleanup();
  resetJdmMock();
});

describe('KeyValueEditor', () => {
  test('structured mode renders rows from object literal', () => {
    renderEditor('{ Token: "abc", Accept: "application/json" }');

    const nameInputs = screen.getAllByPlaceholderText('名称') as HTMLInputElement[];
    expect(nameInputs).toHaveLength(2);
    expect(nameInputs[0].value).toBe('Token');
    expect(nameInputs[1].value).toBe('Accept');

    const editors = screen.getAllByLabelText('code-editor') as HTMLTextAreaElement[];
    expect(editors).toHaveLength(2);
    expect(editors[0].value).toBe('"abc"');
    expect(editors[1].value).toBe('"application/json"');
  });

  test('editing key name emits updated serialization', () => {
    renderEditor('{ Token: "abc" }');

    fireEvent.change(screen.getByPlaceholderText('名称'), { target: { value: 'Role' } });

    expect(changes).toHaveLength(1);
    expect(changes[0]).toContain('Role: "abc"');
  });

  test('editing value expression emits updated serialization', () => {
    renderEditor('{ Token: "abc" }');

    fireEvent.change(screen.getByLabelText('code-editor'), { target: { value: '"xyz"' } });

    expect(changes).toHaveLength(1);
    expect(changes[0]).toContain('Token: "xyz"');
  });

  test('add row appends empty entry and typing its key emits it', () => {
    renderEditor('{ Token: "abc" }');

    fireEvent.click(screen.getByText('添加'));
    expect(screen.getAllByPlaceholderText('名称')).toHaveLength(2);

    fireEvent.change(screen.getAllByPlaceholderText('名称')[1], { target: { value: 'Role' } });

    expect(changes[changes.length - 1]).toContain('Role');
  });

  test('delete row removes entry from serialization', () => {
    renderEditor('{ Token: "abc", Accept: "application/json" }');

    fireEvent.click(screen.getAllByLabelText('删除')[0]);

    const nameInputs = screen.getAllByPlaceholderText('名称') as HTMLInputElement[];
    expect(nameInputs).toHaveLength(1);
    expect(nameInputs[0].value).toBe('Accept');
    expect(changes[0]).not.toContain('Token');
  });

  test('unparseable value falls back to raw expression mode', () => {
    renderEditor('input.headers');

    expect(screen.queryByPlaceholderText('名称')).toBeNull();
    const editor = screen.getByLabelText('code-editor') as HTMLTextAreaElement;
    expect(editor.value).toBe('input.headers');
  });

  test('mode toggle round-trips raw and structured for parseable value', () => {
    renderEditor('{ Token: "abc" }');

    fireEvent.click(screen.getByLabelText('原始表达式模式'));
    expect(screen.queryByPlaceholderText('名称')).toBeNull();
    const rawEditor = screen.getByLabelText('code-editor') as HTMLTextAreaElement;
    expect(rawEditor.value).toBe('{ Token: "abc" }');

    fireEvent.click(screen.getByLabelText('结构化模式'));
    expect((screen.getAllByPlaceholderText('名称')[0] as HTMLInputElement).value).toBe('Token');
  });

  test('switching back to structured with unparseable raw content shows hint and stays raw', () => {
    changes.length = 0;
    render(<Harness />);

    fireEvent.click(screen.getByLabelText('原始表达式模式'));
    fireEvent.change(screen.getByLabelText('code-editor'), { target: { value: 'not an object' } });
    fireEvent.click(screen.getByLabelText('结构化模式'));

    expect(screen.getByText('当前内容无法解析为键值对，请检查对象字面量语法')).toBeDefined();
    expect(screen.queryByPlaceholderText('名称')).toBeNull();
  });
});
