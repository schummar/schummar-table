import { useMemo, useState } from 'react';
import type { DisplaySize, Id, InternalColumn, InternalTableProps } from '../types';
import { useControllableState } from './useControllableState';

/** Columns missing from `order` follow the column defined before them. */
function orderColumns<T>(columns: InternalColumn<T, unknown>[], order: Id[]) {
  if (order.length === 0) return columns;

  const ids = new Set(order);
  const byId = new Map(columns.map((column) => [column.id, column]));
  const result = [...ids].flatMap((id) => byId.get(id) ?? []);

  columns.forEach((column, index) => {
    if (ids.has(column.id)) return;
    const previous = columns[index - 1];
    result.splice(previous ? result.indexOf(previous) + 1 : 0, 0, column);
  });

  return result;
}

export function useColumns<T>(props: InternalTableProps<T>, displaySize: DisplaySize | undefined) {
  const [hiddenColumns, setHiddenColumns, setHiddenColumnsInternal] = useControllableState(
    props.hiddenColumns,
    () => props.defaultHiddenColumns ?? new Set<Id>(),
    props.onHiddenColumnsChange,
  );
  const [storedOrder, setColumnOrder, setColumnOrderInternal] = useControllableState(
    props.columnOrder,
    () => props.defaultColumnOrder ?? [],
    props.onColumnOrderChange,
  );
  const [columnWidths, setColumnWidths] = useState(() => new Map<Id, string>());

  const allColumns = useMemo(
    () => orderColumns(props.columns, storedOrder),
    [props.columns, storedOrder],
  );
  const columnOrder = useMemo(() => allColumns.map((column) => column.id), [allColumns]);

  const matchesDisplaySize = (column: InternalColumn<T, unknown>) =>
    displaySize === undefined ||
    column.displaySize === undefined ||
    column.displaySize.includes(displaySize);

  const columns = useMemo(() => allColumns.filter(matchesDisplaySize), [allColumns, displaySize]);

  const activeColumns = useMemo(
    () => allColumns.filter((column) => !(column.hidden ?? hiddenColumns.has(column.id))),
    [allColumns, hiddenColumns],
  );

  const visibleColumns = useMemo(
    () => activeColumns.filter(matchesDisplaySize),
    [activeColumns, displaySize],
  );

  return {
    hiddenColumns,
    setHiddenColumns,
    setHiddenColumnsInternal,
    storedOrder,
    columnOrder,
    setColumnOrder,
    setColumnOrderInternal,
    columnWidths,
    setColumnWidths,
    columns,
    activeColumns,
    visibleColumns,
  };
}
