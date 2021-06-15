import { useEffect } from 'react';
import { Store } from 'schummar-state/react';
import { intersect } from './helpers';
import { InternalTableProps, InternalTableState } from './internalTypes';

export function cleanupState<T>(
  { columns, items, id, onSortChange, onSelectionChange, onExpandedChange }: InternalTableProps<T>,
  store: Store<InternalTableState>,
): void {
  useEffect(() => {
    const columnIds = new Set(columns.map((column) => column.id));
    const ids = new Set(items.map(id));

    const newSort = store.getState().sort.filter((s) => columnIds.has(s.columnId));
    if (newSort.length < store.getState().sort.length) {
      store.update((state) => {
        state.sort = newSort;
      });
      onSortChange?.(newSort);
    }

    const newFilters = new Map(store.getState().filters);
    for (const id of newFilters.keys()) {
      if (!columnIds.has(id)) newFilters.delete(id);
    }
    if (newFilters.size < store.getState().filters.size) {
      store.update((state) => {
        state.filters = newFilters;
      });
    }

    const newSelection = intersect(store.getState().selection, ids);
    if (newSelection.size < store.getState().selection.size) {
      store.update((state) => {
        state.selection = newSelection;
      });
      onSelectionChange?.(newSelection);
    }

    const newExpanded = intersect(store.getState().expanded, ids);
    if (newExpanded.size < store.getState().expanded.size) {
      store.update((state) => {
        state.expanded = newExpanded;
      });
      onExpandedChange?.(newExpanded);
    }
  }, [columns, items, id, onSortChange, onSelectionChange, onExpandedChange, store]);
}
