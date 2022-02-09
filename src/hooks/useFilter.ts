import { castDraft } from 'immer';
import { DependencyList, useEffect } from 'react';
import { useColumnContext, useTableContext } from '..';
import { Filter, JSON_Value } from '../types';

export function useFilter<T, V, S extends JSON_Value>(filter: Filter<T, V, S>, deps: DependencyList) {
  const table = useTableContext<T>();
  const columnId = useColumnContext();

  useEffect(() => {
    table.update((state) => {
      state.filters.set(columnId, castDraft(filter));
    });

    return () => {
      table.update((state) => {
        state.filters.delete(columnId);
      });
    };
  }, [table, columnId, ...deps]);
}
