import type { DependencyList, ReactNode } from 'react';
import { createContext, useContext, useMemo, useRef } from 'react';
import type { FunctionWithDeps } from '../types';

type MemoCache = Map<string, [value: any, deps: DependencyList]>;

// No default cache: a shared default would leak memoized values (and their closures)
// between unrelated tables. Without a provider, each consumer gets its own local cache.
const TableMemoContext = createContext<MemoCache | undefined>(undefined);

export function TableMemoContextProvider({ children }: { children: ReactNode }) {
  return (
    <TableMemoContext.Provider value={useMemo(() => new Map(), [])}>
      {children}
    </TableMemoContext.Provider>
  );
}

export function useTableMemo() {
  const contextCache = useContext(TableMemoContext);
  const localCache = useRef<MemoCache | undefined>(undefined);
  const memoCache = contextCache ?? (localCache.current ??= new Map() as MemoCache);

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
