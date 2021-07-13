import { useMemo } from 'react';
import { asString } from '../misc/helpers';
import { Column, Id, InternalColumn, InternalTableProps, TableProps } from '../types';

const noopParentId = () => undefined;

export function calcProps<T>(props: TableProps<T>): InternalTableProps<T> {
  let inputColumns: Column<T, any>[];
  if (props.columns instanceof Function) {
    inputColumns = props.columns((value, column) => ({ ...column, value }));
  } else {
    inputColumns = props.columns;
  }

  const withMemoizedFunctions = useMemo(() => {
    let id: (item: T) => Id;
    if (props.id instanceof Function) {
      id = props.id;
    } else {
      id = (item: T) => item[props.id as keyof T] as unknown as Id;
    }

    let parentId: (item: T) => Id | undefined;
    if (props.parentId instanceof Function) {
      parentId = props.parentId;
    } else if (typeof props.parentId === 'string') {
      parentId = (item: T) => item[props.parentId as keyof T] as unknown as Id | undefined;
    } else {
      parentId = noopParentId;
    }

    const columns = inputColumns.map(function <V>(
      {
        id,
        value,
        sortBy = (v) => (typeof v === 'number' || v instanceof Date ? v : String(v)),
        renderCell = asString,
        filterComponent,
        onFilterChange,
      }: Column<T, V>,
      index: number,
    ) {
      return {
        id: id ?? index,
        value,
        sortBy,
        renderCell,
        filterComponent,
        onFilterChange,
      };
    });

    return {
      id,
      parentId,
      hasDeferredChildren: props.hasDeferredChildren,
      onSortChange: props.onSortChange,
      onExpandedChange: props.onExpandedChange,
      onHiddenColumnsChange: props.onHiddenColumnsChange,
      debug: props.debug,
      columns,
    };
  }, props.dependencies);

  const columns = inputColumns.map(function <V>(
    {
      id,
      header = null,
      value,
      sortBy = (v) => (typeof v === 'number' || v instanceof Date ? v : String(v)),
      renderCell = (v) => v,
      ...props
    }: Column<T, V>,
    index: number,
  ): InternalColumn<T, V> {
    return {
      ...props,
      id: id ?? index,
      header,
      value,
      sortBy,
      renderCell,
      ...withMemoizedFunctions.columns.find((c) => c.id === (id ?? index)),
    };
  });

  return useMemo(
    () => ({
      ...props,
      ...withMemoizedFunctions,
      columns,
    }),
    [props],
  );
}
