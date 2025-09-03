import { useImperativeHandle, type ForwardedRef } from 'react';
import { Store } from 'schummar-state/react';
import type { InternalTableState, TableRef } from '../types';

export default function useTableRef<T>(
  table: Store<InternalTableState<T>>,
  ref: ForwardedRef<TableRef>,
) {
  useImperativeHandle(
    ref,
    () => ({
      getSort() {
        return table.getState().sort;
      },

      setSort(sort) {
        table.update((state) => {
          state.sort = sort;
        });
      },

      getSelection() {
        return table.getState().selection;
      },

      setSelection(selection) {
        table.update((state) => {
          state.selection = selection;
        });
      },

      getExpanded() {
        return table.getState().expanded;
      },

      setExpanded(expanded) {
        table.update((state) => {
          state.expanded = expanded;
        });
      },

      getHiddenColumns() {
        return table.getState().hiddenColumns;
      },

      setHiddenColumns(hidden) {
        table.update((state) => {
          state.hiddenColumns = hidden;
        });
      },
    }),
    [table],
  );
}
