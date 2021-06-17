import { useMemo } from 'react';
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
        stringValue = (v) => String(v ?? ''),
        sortBy = (v) => (typeof v === 'number' || v instanceof Date ? v : stringValue(v)),
        renderValue = stringValue,
        renderCell = renderValue,
      }: Column<T, V>,
      index: number,
    ) {
      return {
        id: id ?? index,
        value,
        stringValue,
        sortBy,
        renderValue,
        renderCell,
      };
    });

    return {
      id,
      parentId,
      hasDeferredChildren: props.hasDeferredChildren,
      onSortChange: props.onSortChange,
      onExpandedChange: props.onExpandedChange,
      debug: props.debug,
      columns,
    };
  }, props.dependencies);

  const items = props.items.map((item) => ({
    ...item,
    id: withMemoizedFunctions.id(item),
    parentId: withMemoizedFunctions.parentId?.(item),
  }));
  const columns = inputColumns.map(function <V>(
    {
      id,
      header = null,
      value,
      stringValue = (v) => String(v ?? ''),
      sortBy = (v) => (typeof v === 'number' || v instanceof Date ? v : stringValue(v)),
      renderValue = stringValue,
      renderCell = renderValue,
      ...props
    }: Column<T, V>,
    index: number,
  ): InternalColumn<T, V> {
    return {
      ...props,
      id: id ?? index,
      header,
      value,
      stringValue,
      sortBy,
      renderValue,
      renderCell,
      ...withMemoizedFunctions.columns.find((c) => c.id === (id ?? index)),
    };
  });

  return useMemo(
    () => ({
      ...props,
      ...withMemoizedFunctions,
      items,
      columns,
    }),
    [props],
  );
}
