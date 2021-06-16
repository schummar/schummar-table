import { useEffect } from 'react';
import { Store } from 'schummar-state/react';
import { intersect } from '../misc/helpers';
import { InternalTableState } from '../types';

export function cleanupState<T>(state: Store<InternalTableState<T>>): void {
  useEffect(
    () =>
      state.addReaction(
        (state) =>
          [
            state.props.columns,
            state.props.onSortChange,
            state.props.onSelectionChange,
            state.props.onExpandedChange,
            state.sort,
            state.selection,
            state.expanded,
            state.filters,
            state.isHidden,
            state.activeItemsById,
            state.activeColumns,
          ] as const,
        (
          [
            columns,
            onSortChange,
            onSelectionChange,
            onExpandedChange,
            sort,
            selection,
            expanded,
            filters,
            isHidden,
            activeItemsById,
            activeColumns,
          ],
          state,
        ) => {
          const columnIds = new Set(columns.map((column) => column.id));
          const activeColumnIds = new Set(activeColumns.map((column) => column.id));

          // Remove sort entries for non existings columns
          const newSort = sort.filter((s) => activeColumnIds.has(s.columnId));
          if (newSort.length < sort.length) {
            state.sort = newSort;
            onSortChange?.(newSort);
          }

          // Remove selection for non existing items
          const newSelection = intersect(selection, activeItemsById);
          if (newSelection.size !== selection.size) {
            state.selection = newSelection;
            onSelectionChange?.(newSelection);
          }

          // Remove expanded for non existing items
          const newExpanded = intersect(expanded, activeItemsById);
          if (newExpanded.size < expanded.size) {
            state.expanded = newExpanded;
            onExpandedChange?.(newExpanded);
          }

          // Remove filters for non active columns
          for (const id of filters.keys()) {
            if (!activeColumnIds.has(id)) filters.delete(id);
          }

          // Remove isHidden for non existing columns
          for (const id of isHidden.keys()) {
            if (!columnIds.has(id)) isHidden.delete(id);
          }
        },
        { runNow: true },
      ),
    [state],
  );
}
