import { useEffect, useRef, useState } from 'react';
import { AUTO_SAVE_IDLE_MS, AUTO_SAVE_MAX_WAIT_MS, AUTO_SAVE_TICK_MS, shouldAutosaveFire } from '../../lib/autosave.ts';

interface UseAutosaveOptions {
  /** 布防开关：persistence + remoteSource 就绪且版本历史面板未打开 */
  armed: boolean;
  /** 远程来源键（id:revision）——保存成功推进 revision 后重判布防（未 dirty 即解除） */
  sourceKey: string;
  /** 图内容签名：用户编辑即变化 → 重新布防 */
  graphSignature: string;
  /** 执行一次自动保存；返回 true = 成功（清 dirty 位） */
  persist: () => Promise<boolean>;
}

export interface AutosaveController {
  autoSaving: boolean;
  markDirty: () => void;
  clearDirty: () => void;
}

// ── 自动保存 idle 门控（第五十二批引入，第五十七批重设计，第六十一批抽 hook）──
// dirty 门控 + idle 检测：仅"用户编辑过且尚未保存"时布防；图内容变化后，用户停止
// 交互满 AUTO_SAVE_IDLE_MS 即保存（阅读停顿不漏存、连续编辑不打断），持续无停顿由
// AUTO_SAVE_MAX_WAIT_MS 兜底。触发判定策略见 src/lib/autosave.ts（纯函数单测覆盖）。
// 失败静默保留 dirty 位；成功清位。杜绝旧实现"revision 变化重新布防 → 每 30s 空转
// 保存"缺陷的机制：保存推进 revision 改变 sourceKey → effect 重跑且 dirty 已清 → 解除布防。
export const useAutosave = ({ armed, sourceKey, graphSignature, persist }: UseAutosaveOptions): AutosaveController => {
  /** 用户自上次成功保存后是否编辑过（加载/恢复/模板不置位，防止加载后空保存） */
  const dirtySinceSaveRef = useRef(false);
  const lastActivityRef = useRef(Date.now());
  const [autoSaving, setAutoSaving] = useState(false);
  const autoSavingRef = useRef(false);
  autoSavingRef.current = autoSaving;
  const persistRef = useRef(persist);
  persistRef.current = persist;

  // 用户活动监听：pointerdown/keydown/wheel 三事件轻量采样（不监听 move，防抖动）
  useEffect(() => {
    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };
    const events = ['pointerdown', 'keydown', 'wheel'] as const;
    events.forEach((event) => window.addEventListener(event, markActivity, { passive: true }));
    return () => events.forEach((event) => window.removeEventListener(event, markActivity));
  }, []);

  useEffect(() => {
    if (!armed || !dirtySinceSaveRef.current) return;
    const armedAt = Date.now();
    const timer = window.setInterval(() => {
      if (
        !shouldAutosaveFire({
          busy: autoSavingRef.current,
          idleForMs: Date.now() - lastActivityRef.current,
          waitedForMs: Date.now() - armedAt,
          idleMs: AUTO_SAVE_IDLE_MS,
          maxWaitMs: AUTO_SAVE_MAX_WAIT_MS,
        })
      ) {
        return;
      }
      setAutoSaving(true);
      void (async () => {
        try {
          if (await persistRef.current()) {
            dirtySinceSaveRef.current = false;
            lastActivityRef.current = Date.now();
          }
        } finally {
          setAutoSaving(false);
        }
      })();
    }, AUTO_SAVE_TICK_MS);
    return () => window.clearInterval(timer);
  }, [armed, sourceKey, graphSignature]);

  return {
    autoSaving,
    markDirty: () => {
      dirtySinceSaveRef.current = true;
    },
    clearDirty: () => {
      dirtySinceSaveRef.current = false;
    },
  };
};
