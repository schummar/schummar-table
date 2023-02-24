import type { DependencyList } from 'react';
import { useMemo } from 'react';
import type { FunctionWithDeps } from '../types';

export function useMemoMap() {
  const memoCache = useMemo(() => new Map<string, [value: any, deps: DependencyList]>(), []);

  return <Function_ extends (...args: any[]) => any>(
    key: string,
    function_: FunctionWithDeps<Function_>,
  ): Function_ => {
    let deps: DependencyList;
    if (Array.isArray(function_)) {
      deps = function_.slice(1);
      function_ = function_[0];
    } else {
      deps = [function_.toString()];
    }

    let cachedValue = memoCache.get(key);
    const hit =
      cachedValue &&
      cachedValue[1].length === deps.length &&
      cachedValue[1].every((x, i) => x === deps[i]);
    if (!cachedValue || !hit) {
      cachedValue = [function_, deps];
      memoCache.set(key, cachedValue);
    }
    return cachedValue[0];
  };
}
