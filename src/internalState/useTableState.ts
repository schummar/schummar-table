import { castDraft } from 'immer';
import { useEffect, useMemo } from 'react';
import { Store } from 'schummar-state/react';
import { Filter } from '../components/filterComponent';
import { useTableTheme } from '../theme/tableTheme';
import { Id, InternalTableState, TableProps } from '../types';
import { calcItems } from './calcItems';
import { calcProps } from './calcProps';
import { cleanupState } from './cleanupState';
import { filterColumns } from './filterColumns';
import { syncSelections } from './syncSelections';

export function useTableState<T>(_props: TableProps<T>): Store<InternalTableState<T>> {
  const props = calcProps(_props);
  const theme = useTableTheme(props);

  const state = useMemo(
    () =>
      new Store<InternalTableState<T>>({
        props,
        theme,

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
        hiddenColumns: props.defaultHiddenColumns ?? new Set(),
        columnWidths: new Map(),
        columnOrder: props.columns.map((column) => column.id),

        activeColumns: [],
        items: [],
        itemsById: new Map(),
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
      if (props.hiddenColumns) state.hiddenColumns = props.hiddenColumns;
      for (const column of props.columns) {
        if (column.filter) state.filters.set(column.id, column.filter);
        if (!state.columnOrder.includes(column.id)) {
          const index = props.columns.indexOf(column);
          state.columnOrder.splice(index, 0, column.id);
        }
      }
    });
  }, [state, props]);

  return state;
}
