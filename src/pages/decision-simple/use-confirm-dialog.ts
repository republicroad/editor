import { useState } from 'react';

export interface PendingConfirm {
  title: string;
  description: string;
  onConfirm: () => void;
}

/** 页面级确认对话框状态（New / 打开模板 / 打开历史版本 共用）——薄封装 */
export const useConfirmDialog = () => {
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  return {
    pendingConfirm,
    confirm: setPendingConfirm,
    close: () => setPendingConfirm(null),
  };
};
