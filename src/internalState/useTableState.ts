import { castDraft } from 'immer';
import { useEffect, useMemo } from 'react';
import { Store } from 'schummar-state/react';
import { Filter } from '../components/filterComponent';
import { Id, InternalTableState, TableProps } from '../types';
import { calcItems } from './calcItems';
import { calcProps } from './calcProps';
import { cleanupState } from './cleanupState';
import { filterColumns } from './filterColumns';
import { syncSelections } from './syncSelections';

export function useTableState<T>(_props: TableProps<T>): Store<InternalTableState<T>> {
  const props = calcProps(_props);

  const state = useMemo(
    () =>
      new Store<InternalTableState<T>>({
        props,

        sort: props.defaultSort ?? [],
        selection: props.defaultSelection ?? new Set(),
        expanded: props.defaultExpanded ?? new Set(),
        rowHeights: new Map(),
        filters: (() => {
          const filters = new Map<Id, Filter<unknown>>();
          for (const column of props.columns)
            if (column.defaultFilter) {
              filters.set(column.id, column.defaultFilter);
            }
          return filters;
        })(),
        isHidden: (() => {
          const isHidden = new Map<Id, boolean>();
          for (const column of props.columns)
            if (column.defaultIsHidden !== undefined) {
              isHidden.set(column.id, column.defaultIsHidden);
            }
          return isHidden;
        })(),

        activeColumns: [],
        items: [],
        activeItems: [],
        activeItemsById: new Map(),
        lastSelectedId: undefined,
      }),
    [],
  );

  filterColumns(state);
  calcItems(state);
  syncSelections(state);
  cleanupState(state);

  useEffect(() => {
    state.update((state) => {
      state.props = castDraft(props);
      if (props.sort) state.sort = props.sort;
      if (props.selection) state.selection = props.selection;
      if (props.expanded) state.expanded = props.expanded;
      for (const column of props.columns) {
        if (column.filter) state.filters.set(column.id, column.filter);
        if (column.isHidden !== undefined) state.isHidden.set(column.id, column.isHidden);
      }
    });
  }, [state, props]);

  return state;
}
