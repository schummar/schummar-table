import { useMemo, useRef } from 'react';
import { asString } from '../misc/helpers';
import { Column, Id, InternalColumn, InternalTableProps, TableProps } from '../types';

const noopParentId = () => undefined;

export function calcProps<T>(props: TableProps<T>): InternalTableProps<T> {
  const columnCache = useRef(new Map<string | number, [any[], InternalColumn<T, any>]>());

  return useMemo(() => {
    let id;
    if (props.id instanceof Function) {
      id = props.id;
    } else {
      id = (item: T) => item[props.id as keyof T] as unknown as Id;
    }

    let parentId;
    if (props.parentId instanceof Function) {
      parentId = props.parentId;
    } else if (typeof props.parentId === 'string') {
      parentId = (item: T) => item[props.parentId as keyof T] as unknown as Id | undefined;
    } else {
      parentId = noopParentId;
    }

    let inputColumns;
    if (props.columns instanceof Function) {
      inputColumns = props.columns((value, column) => ({ ...column, value }));
    } else {
      inputColumns = props.columns.map((column) => ({ ...column, dependecies: undefined }));
    }

    const newColumnCache = new Map<string | number, [any[], InternalColumn<T, any>]>();

    const columns = inputColumns.map<InternalColumn<T, any>>(function <V>(
      {
        id,
        header = null,
        renderCell = asString,
        exportCell = asString,
        sortBy = (v) => (typeof v === 'number' || v instanceof Date ? v : String(v)),
        dependencies = [],
        ...props
      }: Column<T, V>,
      index: number,
    ) {
      const [depsInCache, columnInCache] = columnCache.current.get(id ?? index) ?? [];

      let column;
      if (
        depsInCache &&
        columnInCache &&
        depsInCache.length === dependencies.length &&
        depsInCache.every((x, i) => dependencies[i] === x)
      ) {
        column = columnInCache;
      } else {
        column = {
          id: id ?? index,
          header,
          renderCell,
          exportCell,
          sortBy,
          dependencies,
          ...props,
        };
      }

      newColumnCache.set(id ?? index, [dependencies, column]);
      return column;
    });

    columnCache.current = newColumnCache;

    let copy;
    if (props.enableExport === true || (props.enableExport instanceof Object && props.enableExport.copy === true)) {
      copy = { separator: '\t' };
    } else if (props.enableExport && props.enableExport.copy instanceof Object) {
      copy = props.enableExport.copy;
    }

    let download;
    if (props.enableExport === true || (props.enableExport instanceof Object && props.enableExport.download === true)) {
      download = { sepPrefix: true };
    } else if (props.enableExport && props.enableExport.download instanceof Object) {
      download = props.enableExport.download;
    }

    const enableExport = { copy, download };

    return {
      ...props,
      id,
      parentId,
      columns,
      enableSelection: props.enableSelection ?? true,
      selectSyncChildren: props.selectSyncChildren ?? true,
      stickyHeader: props.stickyHeader ?? true,
      enableExport,
      enableColumnSelection: props.enableColumnSelection ?? true,
      enableColumnResize: props.enableColumnResize ?? true,
      enableColumnReorder: props.enableColumnReorder ?? true,
    };
  }, [props]);
}
