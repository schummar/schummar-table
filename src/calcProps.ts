import { orderBy, uniq } from './helpers';
import { InternalColumn, InternalTableProps } from './internalTypes';
import { DefaultFilter } from './tableFilterDefault';
import { Column, Id, TableProps } from './types';

export function calcProps<T>(props: TableProps<T>): InternalTableProps<T> {
  let id: (item: T) => Id;
  if (props.id instanceof Function) {
    id = props.id;
  } else {
    id = (item: T) => item[props.id as keyof T] as unknown as Id;
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
      useFilter = false,
      filterOptions = orderBy(uniq(data.map(value).filter((x) => x !== undefined))),
      defaultFilter = new DefaultFilter<V>(),
      filter,
      onFilterChange,
      width,
      style,
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
      useFilter,
      filterOptions,
      defaultFilter,
      filter,
      onFilterChange,
      width,
      style,
    };
  });

  return { ...props, id, columns };
}
