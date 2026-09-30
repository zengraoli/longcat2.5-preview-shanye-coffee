import { useEffect, useRef } from 'react';

/**
 * 监听依赖变化并执行回调（替代 react 不存在的 watch 导出）。
 * 首次渲染不执行，仅在依赖变化时执行。
 */
export function useWatch(deps: unknown[], callback: () => void) {
  const isFirst = useRef(true);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    callbackRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
