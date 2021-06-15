import { DefaultFilter } from './defaultFilterComponent';
import { Column, Id, InternalColumn, InternalTableProps, TableProps } from './types';

export function calcProps<T>(props: TableProps<T>): InternalTableProps<T> {
  let id;
  if (props.id instanceof Function) {
    id = props.id;
  } else {
    id = (item: T) => item[props.id as keyof T] as unknown as Id;
  }

  let parentId;
  if (props.parentId instanceof Function) {
    parentId = props.parentId;
  } else if (typeof parentId === 'string') {
    parentId = (item: T) => item[props.parentId as keyof T] as unknown as Id | undefined;
  }

  let inputColumns = props.columns;
  if (inputColumns instanceof Function) {
    inputColumns = inputColumns((value, column) => ({ ...column, value }));
  }
  const columns = inputColumns.map(function <V>(
    {
      id,
      header = null,
      value,
      stringValue = (v) => String(v ?? ''),
      sortBy = (v) => (typeof v === 'number' || v instanceof Date ? v : stringValue(v)),
      renderValue = stringValue,
      renderCell = renderValue,
      filterComponent,
      defaultFilter = new DefaultFilter<V>(),
      filter,
      onFilterChange,
      width,
      justifyContent,
    }: Column<T, V>,
    index: number,
  ): InternalColumn<T, V> {
    return {
      id: id ?? index,
      header,
      value,
      stringValue,
      sortBy,
      renderValue,
      renderCell,
      filterComponent,
      defaultFilter,
      filter,
      onFilterChange,
      width,
      justifyContent,
    };
  });

  return { ...props, id, parentId, columns, itemsSorted: [], itemsFiltered: [], itemsTree: [] };
}
