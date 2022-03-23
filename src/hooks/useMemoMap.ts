import { DependencyList, useMemo } from 'react';
import { FunctionWithDeps } from '../types';

export function useMemoMap() {
  const memoCache = useMemo(() => new Map<string, [value: any, deps: DependencyList]>(), []);

  return <Fn extends (...args: any[]) => any>(key: string, fn: FunctionWithDeps<Fn>): Fn => {
    let deps: DependencyList;
    if (Array.isArray(fn)) {
      deps = fn.slice(1);
      fn = fn[0];
    } else {
      deps = [fn.toString()];
    }

    let cachedValue = memoCache.get(key);
    const hit = cachedValue && cachedValue[1].length === deps.length && cachedValue[1].every((x, i) => x === deps[i]);
    if (!cachedValue || !hit) {
      cachedValue = [fn, deps];
      memoCache.set(key, cachedValue);
    }
    return cachedValue[0];
  };
}
