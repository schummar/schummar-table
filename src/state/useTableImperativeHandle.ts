import { useImperativeHandle, type Ref } from 'react';
import type { TableRef } from '../types';
import type { useTable } from './useTable';

/** The setters bypass the on*Change callbacks, as they always have. */
export function useTableImperativeHandle(
  ref: Ref<TableRef> | undefined,
  table: ReturnType<typeof useTable<any>>,
) {
  const { actions } = table;

  useImperativeHandle(
    ref,
    () => ({
      getSort: () => actions.getState().sort,
      setSort: table.setSortInternal,
      getSelection: () => actions.getState().selection,
      setSelection: table.setSelectionInternal,
      getExpanded: () => actions.getState().expanded,
      setExpanded: table.setExpandedInternal,
      getHiddenColumns: () => actions.getState().hiddenColumns,
      setHiddenColumns: table.setHiddenColumnsInternal,
      getFilterValues: () => actions.getState().filterValues,
      setFilterValues: table.setFilterValuesInternal,
    }),
    [actions],
  );
}
