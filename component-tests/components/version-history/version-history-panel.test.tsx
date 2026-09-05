import { afterEach, describe, expect, test } from 'bun:test';
import React from 'react';

import { setupJsDom } from '../../../src/test-utils/setup-jsdom';

setupJsDom();

const { cleanup, fireEvent, render, screen, waitFor } = await import('@testing-library/react');
const { VersionHistoryPanel } =
  await import('../../../jdm-editor/packages/appshell/src/components/version-history/version-history-panel');

afterEach(() => cleanup());

const versions = [
  { revision: 'v1', updatedAt: '2026-01-01' },
  { revision: 'v2', updatedAt: '2026-01-02' },
  { revision: 'v3', updatedAt: '2026-01-03' },
];

describe('VersionHistoryPanel', () => {
  test('关闭时不渲染列表', async () => {
    const { container } = render(
      <VersionHistoryPanel
        open={false}
        onOpenChange={() => {}}
        versions={versions}
        currentRevision="v3"
        onRestore={() => {}}
      />,
    );
    expect(container.textContent).not.toContain('v1');
  });

  test('打开后列出全部版本与元信息', async () => {
    render(
      <VersionHistoryPanel
        open
        onOpenChange={() => {}}
        versions={versions}
        currentRevision="v3"
        onRestore={() => {}}
      />,
    );
    await waitFor(() => expect(screen.getByText('v1')).toBeTruthy());
    expect(screen.getByText('v2')).toBeTruthy();
    expect(screen.getByText('v3')).toBeTruthy();
    expect(screen.getByText('2026-01-02')).toBeTruthy();
    expect(screen.getByText('3 version(s). Restoring loads that version as the current one.')).toBeTruthy();
  });

  test('当前版本带 current 标记且恢复按钮禁用', async () => {
    render(
      <VersionHistoryPanel
        open
        onOpenChange={() => {}}
        versions={versions}
        currentRevision="v2"
        onRestore={() => {}}
      />,
    );
    await waitFor(() => expect(screen.getByText('current')).toBeTruthy());
    const buttons = screen.getAllByText('Restore') as HTMLButtonElement[];
    expect(buttons).toHaveLength(3);
    // v2 行的按钮禁用，其余可用
    const disabled = buttons.filter((b) => (b as HTMLButtonElement).disabled);
    expect(disabled).toHaveLength(1);
  });

  test('点击恢复回调携带对应 revision', async () => {
    let seen: string | undefined;
    render(
      <VersionHistoryPanel
        open
        onOpenChange={() => {}}
        versions={versions}
        currentRevision="v3"
        onRestore={(revision) => {
          seen = revision;
        }}
      />,
    );
    await waitFor(() => expect(screen.getByText('v1')).toBeTruthy());
    fireEvent.click(screen.getAllByText('Restore')[0]);
    expect(seen).toBe('v1');
  });

  test('auto 条目带 auto 徽标、manual 条目不带', async () => {
    render(
      <VersionHistoryPanel
        open
        onOpenChange={() => {}}
        versions={[
          { revision: 'v1', updatedAt: '2026-01-01' },
          { revision: 'v2', updatedAt: '2026-01-02', auto: true },
        ]}
        currentRevision="v2"
        onRestore={() => {}}
      />,
    );
    await waitFor(() => expect(screen.getByText('v1')).toBeTruthy());
    expect(screen.getByText('auto')).toBeTruthy();
  });

  test('空态与加载态', async () => {
    const { rerender } = render(
      <VersionHistoryPanel open onOpenChange={() => {}} versions={[]} currentRevision="" onRestore={() => {}} />,
    );
    expect(screen.getByText('No versions yet. Each save creates one.')).toBeTruthy();
    rerender(
      <VersionHistoryPanel
        open
        onOpenChange={() => {}}
        versions={[]}
        currentRevision=""
        loading
        onRestore={() => {}}
      />,
    );
    expect(screen.getByText('Loading…')).toBeTruthy();
  });
});
