import { useMemo } from 'react';
import { defaultSerializer } from '../exporters/serializer';
import { useTableMemo } from '../hooks/useTableMemo';
import { asString, castArray } from '../misc/helpers';
import { overrides } from '../misc/overrides';
import type { Column, Id, InternalColumn, InternalTableProps, TableProps } from '../types';

const defaultProps: InternalTableProps<any> = {
  id: () => '',
  columns: [],
  enableSelection: true,
  selectSyncChildren: true,
  stickyHeader: true,
  stickyFooter: true,
  enableColumnSelection: true,
  enableColumnResize: true,
  enableColumnReorder: true,
  displaySizeOverrides: {
    mobile: {
      enableSelection: false,
      enableColumnSelection: false,
      enableExport: false,
      enableColumnResize: false,
      enableColumnReorder: false,
    },
  },
};

export function calcProps<T>(props: TableProps<T>): InternalTableProps<T> {
  const cache = useTableMemo();

  return useMemo(
    () => overrides(defaultProps, calc(props, cache)) as InternalTableProps<T>,
    [props],
  );
}

function calc<T>(
  props: Partial<TableProps<T>>,
  cache: ReturnType<typeof useTableMemo>,
): Partial<InternalTableProps<T>> {
  let id;
  if (props.id instanceof Function || Array.isArray(props.id)) {
    id = cache('id', props.id);
  } else if (props.id !== undefined) {
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
  }

  const columnProps = props.columnProps && cache('columnProps', props.columnProps);

  let inputColumns;
  if (props.columns instanceof Function) {
    inputColumns = props.columns((value, column) => ({ ...column, value }));
  } else if (props.columns !== undefined) {
    inputColumns = props.columns.map((column) => column && { ...column, dependecies: undefined });
  }

  const globalDefaults = props.defaultColumnProps;
  const mapColumn = <V>(
    {
      id: _id,
      header,
      exportHeader,
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
      displaySize,
    }: Column<T, V>,
    index: number,
  ): InternalColumn<T, V> => {
    const id = _id ?? index;
    const cacheKey = typeof id === 'string' ? `s${id}` : `n${id}`;
    const defaults = { ...globalDefaults, ...columnProps?.(id) };

    return {
      id,
      header: header ?? defaults?.header ?? null,
      exportHeader: exportHeader ?? defaults?.exportHeader ?? id,
      footer: footer ?? defaults?.footer ?? null,
      value: cache(`columns.${cacheKey}.value`, value),
      renderCell: cache(
        `columns.${cacheKey}.renderCell`,
        renderCell ?? defaults?.renderCell ?? asString,
      ),
      exportCell: exportCell ?? defaults?.exportCell ?? defaultSerializer,
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
      disableSort: disableSort ?? defaults?.disableSort ?? false,
      hidden: hidden ?? defaults?.hidden,
      classes: classes ?? defaults?.classes,
      styles: styles ?? defaults?.styles,
      filter: filter ?? defaults?.filter,
      width: width ?? defaults?.width,
      displaySize:
        (displaySize ?? defaults.displaySize) !== undefined
          ? castArray((displaySize ?? defaults.displaySize)!)
          : undefined,
    };
  };

  const columns = inputColumns?.filter((x): x is Column<T, any> => !!x).map(mapColumn);

  const wrapRow = props.wrapRow && cache('wrapRow', props.wrapRow);
  const wrapCell = props.wrapCell && cache('wrapCell', props.wrapCell);

  const rowAction =
    props.rowAction instanceof Function || Array.isArray(props.rowAction)
      ? cache('rowAction', props.rowAction)
      : props.rowAction;

  const rowDetails =
    props.rowDetails instanceof Function || Array.isArray(props.rowDetails)
      ? cache('rowDetails', props.rowDetails)
      : props.rowDetails;

  const displaySizeOverrides =
    props.displaySizeOverrides &&
    Object.fromEntries(
      Object.entries(props.displaySizeOverrides ?? {}).map(([size, overrides]) => [
        size,
        overrides && calc(overrides, cache),
      ]),
    );

  return {
    ...props,
    id,
    parentId,
    columns,
    columnProps,
    wrapRow,
    wrapCell,
    rowAction,
    rowDetails,
    enableSelection: props.enableSelection,
    selectSyncChildren: props.selectSyncChildren,
    stickyHeader: props.stickyHeader,
    stickyFooter: props.stickyFooter,
    enableColumnSelection: props.enableColumnSelection,
    enableExport: props.enableExport,
    enableClearFiltersButton: props.enableClearFiltersButton,
    enableColumnResize: props.enableColumnResize,
    enableColumnReorder: props.enableColumnReorder,
    displaySizeOverrides,
  };
}
