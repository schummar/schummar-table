import { useEffect } from 'react';
import { Store } from 'schummar-state/react';
import { intersect } from '../misc/helpers';
import { InternalTableState } from '../types';

export function cleanupState<T>(state: Store<InternalTableState<T>>): void {
  useEffect(
    () =>
      state.addReaction(
        (state) => [state.props.columns, state.itemsById, state.activeItemsById, state.activeColumns] as const,
        ([columns, itemsById, activeItemsById, activeColumns], draft) => {
          const columnIds = new Set(columns.map((column) => column.id));
          const activeColumnIds = new Set(activeColumns.map((column) => column.id));

          // Remove sort entries for non active columns
          const newSort = draft.sort.filter((s) => activeColumnIds.has(s.columnId));
          if (newSort.length < draft.sort.length) {
            draft.sort = newSort;
            draft.props.onSortChange?.(newSort);
          }

          // Remove filters for non active columns
          for (const id of draft.filters.keys()) {
            if (!activeColumnIds.has(id)) draft.filters.delete(id);
          }

          // Remove hiddenColumns for non existing columns
          for (const id of draft.hiddenColumns.keys()) {
            if (!columnIds.has(id)) draft.hiddenColumns.delete(id);
          }

          // Remove columnWidth for non existing columns
          for (const id of draft.columnWidths.keys()) {
            if (!columnIds.has(id)) draft.columnWidths.delete(id);
          }

          // Remove non existing columns from columnOrder
          for (const id of draft.columnOrder) {
            if (!activeColumnIds.has(id)) draft.columnOrder = draft.columnOrder.filter((x) => x !== id);
          }

          if (draft.props.items) {
            // Remove selection for non active items
            const newSelection = intersect(draft.selection, activeItemsById);
            if (newSelection.size !== draft.selection.size) {
              draft.selection = newSelection;
              draft.props.onSelectionChange?.(newSelection);
            }

            // Remove expanded for non existing items
            const newExpanded = intersect(draft.expanded, itemsById);
            if (newExpanded.size < draft.expanded.size) {
              draft.expanded = newExpanded;
              draft.props.onExpandedChange?.(newExpanded);
            }
          }
        },
        { runNow: true },
      ),
    [state],
  );
}
