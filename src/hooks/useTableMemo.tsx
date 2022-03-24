import { createContext, DependencyList, ReactNode, useContext, useMemo } from 'react';
import { FunctionWithDeps } from '../types';

const TableMemoContext = createContext(new Map<string, [value: any, deps: DependencyList]>());

export function TableMemoContextProvider({ children }: { children: ReactNode }) {
  return <TableMemoContext.Provider value={useMemo(() => new Map(), [])}>{children}</TableMemoContext.Provider>;
}

export function useTableMemo() {
  const memoCache = useContext(TableMemoContext);

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
