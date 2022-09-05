import { useMemo } from 'react';
import { useTableMemo } from '../hooks/useTableMemo';
import { asString } from '../misc/helpers';
import { Column, Id, InternalColumn, InternalTableProps, TableProps } from '../types';

const noopParentId = () => undefined;

export function calcProps<T>(props: TableProps<T>): InternalTableProps<T> {
  const cache = useTableMemo();

  return useMemo(() => {
    let id;
    if (props.id instanceof Function || Array.isArray(props.id)) {
      id = cache('id', props.id);
    } else {
      id = cache('id', [(item: T) => item[props.id as keyof T] as unknown as Id, props.id]);
    }

    let parentId;
    if (props.parentId instanceof Function || Array.isArray(props.parentId)) {
      parentId = cache('parentId', props.parentId);
    } else if (props.parentId !== undefined) {
      parentId = cache('parentId', [(item: T) => item[props.parentId as keyof T] as unknown as Id | undefined, props.parentId]);
    } else {
      parentId = noopParentId;
    }

    let inputColumns;
    if (props.columns instanceof Function) {
      inputColumns = props.columns((value, column) => ({ ...column, value }));
    } else {
      inputColumns = props.columns.map((column) => ({ ...column, dependecies: undefined }));
    }

    const defCol = props.defaultColumnProps;
    const mapColumn = <V>(
      {
        id: _id,
        header = defCol?.header ?? null,
        footer = defCol?.footer ?? null,
        value,
        renderCell = defCol?.renderCell ?? asString,
        exportCell = defCol?.exportCell ?? asString,
        sortBy = defCol?.sortBy ?? [(v) => (typeof v === 'number' || v instanceof Date ? v : String(v))],
        disableSort,
        cannotHide = defCol?.cannotHide,
        classes = defCol?.classes,
        filter = defCol?.filter,
        width = defCol?.width,
      }: Column<T, V>,
      index: number,
    ): InternalColumn<T, V> => {
      const id = _id ?? index;
      const cacheKey = typeof id === 'string' ? `s${id}` : `n${id}`;

      return {
        id,
        header: header instanceof Function ? cache(`columns.${cacheKey}.header`, header) : header,
        footer: footer instanceof Function ? cache(`columns.${cacheKey}.footer`, footer) : footer,
        value: cache(`columns.${cacheKey}.value`, value),
        renderCell: cache(`columns.${cacheKey}.renderCell`, renderCell),
        exportCell,
        sortBy: sortBy.map((fn, i) => cache(`columns.${cacheKey}.sortBy.${i}`, fn)),
        disableSort,
        cannotHide,
        classes,
        filter,
        width,
      };
    };

    const columns = inputColumns.map(mapColumn);

    const wrapCell = props.wrapCell && cache('wrapCell', props.wrapCell);

    const rowAction =
      props.rowAction instanceof Function || Array.isArray(props.rowAction) ? cache('rowAction', props.rowAction) : props.rowAction;

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
      wrapCell,
      rowAction,
      enableSelection: props.enableSelection ?? true,
      selectSyncChildren: props.selectSyncChildren ?? true,
      stickyHeader: props.stickyHeader ?? true,
      stickyFooter: props.stickyFooter ?? true,
      enableExport,
      enableColumnSelection: props.enableColumnSelection ?? true,
      enableClearFiltersButton: props.enableClearFiltersButton ?? false,
      enableColumnResize: props.enableColumnResize ?? true,
      enableColumnReorder: props.enableColumnReorder ?? true,
    };
  }, [props]);
}
