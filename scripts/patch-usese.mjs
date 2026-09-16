/**
 * postinstall 补丁：将 node_modules 内 CJS-only 的 use-sync-external-store 覆写为 ESM 直通实现。
 *
 * 背景（docs/19 npm 化后首个 dev 期发布面问题）：rolldown dev 预打包器把深层 CJS 的
 * require('react') 转写为运行时惰性垫片（__require），浏览器端必炸——
 * 「Calling `require` for "react" in an environment that doesn't expose the require function」。
 * alias / plugin / rolldownOptions 三条配置通道均不参与 optimizer 的深层转换（已实测），
 * 故直接覆写包文件：React 18 已内建 useSyncExternalStore，shim 层直通即可。
 * 幂等；bun install（含 CI --frozen-lockfile 与 Docker）后自动执行（root postinstall）。
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const storeRoots = [path.resolve('node_modules/.bun'), path.resolve('node_modules')];

const SHIM_INDEX_ESM = `import * as React from 'react';
export const useSyncExternalStore = React.useSyncExternalStore;
export default useSyncExternalStore;
`;

const WITH_SELECTOR_ESM = `import * as React from 'react';
const objectIsPolyfill = (x, y) =>
  (x === y && (x !== 0 || 1 / x === 1 / y)) || (x !== x && y !== y);
const objectIs = typeof Object.is === 'function' ? Object.is : objectIsPolyfill;
export function useSyncExternalStoreWithSelector(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
  const instRef = React.useRef(null);
  let inst;
  if (instRef.current === null) {
    inst = { hasValue: false, value: null };
    instRef.current = inst;
  } else {
    inst = instRef.current;
  }
  const [getSelection, getServerSnapshotWithSelector] = React.useMemo(() => {
    let hasMemo = false;
    let memoizedSnapshot;
    let memoizedSelection;
    const memoizedSelector = (nextSnapshot) => {
      if (!hasMemo) {
        hasMemo = true;
        memoizedSnapshot = nextSnapshot;
        const firstSelection = selector(nextSnapshot);
        if (isEqual !== undefined && inst.hasValue) {
          const currentSelection = inst.value;
          if (isEqual(currentSelection, firstSelection)) {
            memoizedSelection = currentSelection;
            return currentSelection;
          }
        }
        memoizedSelection = firstSelection;
        return firstSelection;
      }
      const currentSelection = memoizedSelection;
      if (objectIs(memoizedSnapshot, nextSnapshot)) return currentSelection;
      const nextSelection = selector(nextSnapshot);
      if (isEqual !== undefined && isEqual(currentSelection, nextSelection)) {
        memoizedSnapshot = nextSnapshot;
        return currentSelection;
      }
      memoizedSnapshot = nextSnapshot;
      memoizedSelection = nextSelection;
      return nextSelection;
    };
    const getSnapshotWithSelector = () => memoizedSelector(getSnapshot());
    const getServerSnapshotWithSelector =
      getServerSnapshot === undefined ? undefined : () => memoizedSelector(getServerSnapshot);
    return [getSnapshotWithSelector, getServerSnapshotWithSelector];
  }, [getSnapshot, getServerSnapshot, selector, isEqual]);
  const value = React.useSyncExternalStore(subscribe, getSelection, getServerSnapshotWithSelector ?? getSelection);
  React.useEffect(() => {
    inst.hasValue = true;
    inst.value = value;
  }, [value]);
  React.useDebugValue(value);
  return value;
}
export default useSyncExternalStoreWithSelector;
`;

let patched = 0;
const patchDir = (pkgDir) => {
  const write = (rel, content) => {
    const file = path.join(pkgDir, rel);
    if (existsSync(path.dirname(file))) {
      writeFileSync(file, content);
      patched += 1;
    }
  };
  write('index.js', SHIM_INDEX_ESM);
  write('shim/index.js', SHIM_INDEX_ESM);
  write('with-selector.js', WITH_SELECTOR_ESM);
  write('shim/with-selector.js', WITH_SELECTOR_ESM);
};

for (const root of storeRoots) {
  if (!existsSync(root)) continue;
  let entries = [];
  try {
    entries = readdirSync(root);
  } catch {
    continue;
  }
  for (const entry of entries) {
    // bun isolated store 条目（.bun/use-sync-external-store@x.y.z+hash）与可能的顶层 hoist
    if (entry === 'use-sync-external-store') {
      patchDir(path.join(root, entry));
    } else if (entry.startsWith('use-sync-external-store@')) {
      const pkgDir = path.join(root, entry, 'node_modules', 'use-sync-external-store');
      if (existsSync(pkgDir)) patchDir(pkgDir);
    }
  }
}
console.log(`[patch-usese] use-sync-external-store ESM 覆写完成（${patched} 个文件）`);
