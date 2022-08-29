import { castDraft } from 'immer';
import { useEffect, useMemo, useState } from 'react';
import { Store } from 'schummar-state/react';
import { InternalTableState, TableProps } from '../types';
import { calcItems } from './calcItems';
import { calcProps } from './calcProps';
import { cleanupState } from './cleanupState';
import { filterColumns } from './filterColumns';
import { normalizeExpanded } from './normalizeExpanded';
import { syncSelections } from './syncSelections';

export function useTableState<T>(_props: TableProps<T>): [Store<InternalTableState<T>>, () => void] {
  const [key, setKey] = useState({});
  const props = calcProps(_props);

  function reset() {
    setKey({});
  }

  const state = useMemo(
    () =>
      new Store<InternalTableState<T>>({
        props,

        sort: props.defaultSort ?? [],
        selection: props.defaultSelection ?? new Set(),
        expanded: props.defaultExpanded ?? new Set(),
        rowHeights: new Map(),
        filters: new Map(),
        filterValues: new Map(),
        hiddenColumns: props.defaultHiddenColumns ?? new Set(),
        columnWidths: new Map(),
        columnOrder: props.columns.map((column) => column.id),
        columnStyleOverride: new Map(),

        activeColumns: [],
        items: [],
        itemsById: new Map(),
        activeItems: [],
        activeItemsById: new Map(),
        lastSelectedId: undefined,
      }),
    [key],
  );

  filterColumns(state);
  calcItems(state);
  normalizeExpanded(state);
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
        if (!state.columnOrder.includes(column.id)) {
          const index = props.columns.indexOf(column);
          state.columnOrder.splice(index, 0, column.id);
        }
      }
    });
  }, [state, props]);

  return [state, reset];
}
