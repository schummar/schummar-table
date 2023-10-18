import { useMemo } from 'react';
import { useTableMemo } from '../hooks/useTableMemo';
import { asString } from '../misc/helpers';
import type { Column, Id, InternalColumn, InternalTableProps, TableProps } from '../types';

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
      parentId = cache('parentId', [
        (item: T) => item[props.parentId as keyof T] as unknown as Id | undefined,
        props.parentId,
      ]);
    } else {
      parentId = noopParentId;
    }

    const columnProps = props.columnProps && cache('columnProps', props.columnProps);

    let inputColumns;
    if (props.columns instanceof Function) {
      inputColumns = props.columns((value, column) => ({ ...column, value }));
    } else {
      inputColumns = props.columns.map((column) => ({ ...column, dependecies: undefined }));
    }

    const globalDefaults = props.defaultColumnProps;
    const mapColumn = <V>(
      {
        id: _id,
        header,
        footer,
        value,
        renderCell,
        exportCell,
        sortBy,
        disableSort,
        hidden,
        classes,
        styles,
        filter,
        width,
      }: Column<T, V>,
      index: number,
    ): InternalColumn<T, V> => {
      const id = _id ?? index;
      const cacheKey = typeof id === 'string' ? `s${id}` : `n${id}`;
      const defaults = { ...globalDefaults, ...columnProps?.(id) };

      return {
        id,
        header: header ?? defaults?.header ?? null,
        footer: footer ?? defaults?.footer ?? null,
        value: cache(`columns.${cacheKey}.value`, value),
        renderCell: cache(
          `columns.${cacheKey}.renderCell`,
          renderCell ?? defaults?.renderCell ?? asString,
        ),
        exportCell: exportCell ?? defaults?.exportCell ?? asString,
        sortBy: (
          sortBy ??
          defaults?.sortBy ?? [
            (v) =>
              typeof v === 'number' || v instanceof Date
                ? v
                : v === null || v === undefined
                ? ''
                : String(v),
          ]
        ).map((function_, i) => cache(`columns.${cacheKey}.sortBy.${i}`, function_)),
        disableSort,
        hidden: hidden ?? defaults?.hidden,
        classes: classes ?? defaults?.classes,
        styles: styles ?? defaults?.styles,
        filter: filter ?? defaults?.filter,
        width: width ?? defaults?.width,
      };
    };

    const columns = inputColumns.map(mapColumn);

    const wrapCell = props.wrapCell && cache('wrapCell', props.wrapCell);

    const rowAction =
      props.rowAction instanceof Function || Array.isArray(props.rowAction)
        ? cache('rowAction', props.rowAction)
        : props.rowAction;

    let copy;
    if (
      props.enableExport === true ||
      (props.enableExport instanceof Object && props.enableExport.copy === true)
    ) {
      copy = { separator: '\t' };
    } else if (props.enableExport && props.enableExport.copy instanceof Object) {
      copy = props.enableExport.copy;
    }

    let download;
    if (
      props.enableExport === true ||
      (props.enableExport instanceof Object && props.enableExport.download === true)
    ) {
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
      columnProps,
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
