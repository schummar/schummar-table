import { castDraft } from 'immer';
import { DependencyList, useEffect } from 'react';
import { useColumnContext, useTableContext } from '..';
import { Filter } from '../types';

export function useFilter<T, V>(filter: Filter<T, V, any>, deps: DependencyList) {
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
