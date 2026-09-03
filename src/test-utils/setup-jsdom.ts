import { JSDOM } from 'jsdom';

const KEPT_NATIVE = new Set([
  'fetch',
  'Request',
  'Response',
  'Headers',
  'AbortController',
  'AbortSignal',
  'performance',
  'queueMicrotask',
  'setImmediate',
  'clearImmediate',
  'structuredClone',
  'crypto',
  'location',
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'requestIdleCallback',
  'cancelIdleCallback',
]);

let jsDomWindow: Record<string, unknown> | null = null;

const assignGlobals = (win: Record<string, unknown>): void => {
  const globalTarget = globalThis as unknown as Record<string, unknown>;
  for (const key of Object.getOwnPropertyNames(win)) {
    if (KEPT_NATIVE.has(key) || key === 'global' || key === 'window') {
      continue;
    }
    try {
      const value = win[key];
      if (typeof value === 'function' || typeof value === 'object') {
        globalTarget[key] = value;
      }
    } catch {
      // 部分属性不可复制，跳过
    }
  }
  for (const key of ['window', 'document', 'navigator']) {
    try {
      Object.defineProperty(globalTarget, key, { value: win[key], configurable: true, writable: true });
    } catch {
      // 只读全局(navigator 等)保留原值即可
    }
  }
};

/**
 * 组件测试 DOM 环境：以 jsdom 注册全局(happy-dom v20 + GlobalRegistrator 的 window 绑定类
 * 与模块基类品牌割裂，dispatchEvent 不可用)，fetch/AbortSignal 等 native 全局保留。
 * bunfig preload 在每个测试文件前重新注册 happy-dom，因此每个测试文件开头都要调用一次；
 * jsdom window 为单例——RTL/react-dom 在首次 import 时绑定 document，跨文件必须保持同一文档。
 */
export const setupJsDom = (): void => {
  if (!jsDomWindow) {
    const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
    jsDomWindow = dom.window as unknown as Record<string, unknown>;
  }
  assignGlobals(jsDomWindow);
  ensureAnimationFrames();
};

/** bun 运行时无 rAF；happy-dom preload 移除后由此兜底（jsdom 默认也不实现） */
const ensureAnimationFrames = (): void => {
  const globalTarget = globalThis as unknown as Record<string, unknown>;
  if (typeof globalTarget.requestAnimationFrame !== 'function') {
    globalTarget.requestAnimationFrame = (callback: (time: number) => void): number =>
      setTimeout(() => callback(performance.now()), 0) as unknown as number;
  }
  if (typeof globalTarget.cancelAnimationFrame !== 'function') {
    globalTarget.cancelAnimationFrame = (handle: number): void => clearTimeout(handle);
  }
};
