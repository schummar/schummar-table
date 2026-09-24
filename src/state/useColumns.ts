import { useMemo, useState } from 'react';
import type { DisplaySize, Id, InternalColumn, InternalTableProps } from '../types';
import { useControllableState } from './useControllableState';

export function useColumns<T>(props: InternalTableProps<T>, displaySize: DisplaySize | undefined) {
  const [hiddenColumns, setHiddenColumns, setHiddenColumnsInternal] = useControllableState(
    props.hiddenColumns,
    () => props.defaultHiddenColumns ?? new Set<Id>(),
    props.onHiddenColumnsChange,
  );
  const [columnWidths, setColumnWidths] = useState(() => new Map<Id, string>());

  const allColumns = props.columns;

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
    columnWidths,
    setColumnWidths,
    columns,
    activeColumns,
    visibleColumns,
  };
}
