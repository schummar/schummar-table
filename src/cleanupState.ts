import { useEffect } from 'react';
import { Store } from 'schummar-state/react';
import { intersect } from './helpers';
import { InternalTableProps, InternalTableState } from './types';

export function cleanupState<T>(
  { columns, activeItemsById, onSortChange, onSelectionChange, onExpandedChange }: InternalTableProps<T>,
  store: Store<InternalTableState>,
): void {
  useEffect(() => {
    const columnIds = new Set(columns.map((column) => column.id));

    // Remove sort entries for non existings columns
    const newSort = store.getState().sort.filter((s) => columnIds.has(s.columnId));
    if (newSort.length < store.getState().sort.length) {
      store.update((state) => {
        state.sort = newSort;
      });
      onSortChange?.(newSort);
    }

    // Remove filters for non existing columns
    const newFilters = new Map(store.getState().filters);
    for (const id of newFilters.keys()) {
      if (!columnIds.has(id)) newFilters.delete(id);
    }
    if (newFilters.size < store.getState().filters.size) {
      store.update((state) => {
        state.filters = newFilters;
      });
    }

    // Remove selection for non existing items
    const newSelection = intersect(store.getState().selection, activeItemsById);
    if (newSelection.size !== store.getState().selection.size) {
      store.update((state) => {
        state.selection = newSelection;
      });
      onSelectionChange?.(newSelection);
    }

    // Remove expanded for non existing items
    const newExpanded = intersect(store.getState().expanded, activeItemsById);
    if (newExpanded.size < store.getState().expanded.size) {
      store.update((state) => {
        state.expanded = newExpanded;
      });
      onExpandedChange?.(newExpanded);
    }
  }, [columns, activeItemsById, onSortChange, onSelectionChange, onExpandedChange, store]);
}
