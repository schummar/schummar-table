import { useMemo, useSyncExternalStore } from 'react';
import { defaultSerializer } from '../exporters/serializer';
import { asString, castArray } from '../misc/helpers';
import type {
  Column,
  DisplaySize,
  DisplaySizes,
  Id,
  InternalColumn,
  InternalTableProps,
  TableProps,
} from '../types';

const defaultProps = {
  enableSelection: true,
  selectSyncChildren: true,
  stickyHeader: true,
  stickyFooter: true,
  enableColumnSelection: true,
  enableColumnResize: true,
  displaySizeOverrides: {
    mobile: {
      enableSelection: false,
      enableColumnSelection: false,
      enableExport: false,
      enableColumnResize: false,
    },
  },
} satisfies Partial<TableProps<any>>;

const defaultSortBy = (v: unknown) =>
  typeof v === 'number' || v instanceof Date ? v : v === null || v === undefined ? '' : String(v);

function normalizeId<T>(id: TableProps<T>['id']): (item: T) => Id {
  return id instanceof Function ? id : (item) => item[id] as Id;
}

function normalizeParentId<T>(
  parentId: TableProps<T>['parentId'],
): ((item: T) => Id | undefined) | undefined {
  if (parentId === undefined) return undefined;
  return parentId instanceof Function ? parentId : (item) => item[parentId] as Id | undefined;
}

function normalizeColumns<T>(
  columns: TableProps<T>['columns'],
  defaultColumnProps: TableProps<T>['defaultColumnProps'],
  columnProps: TableProps<T>['columnProps'],
  disableSort: boolean | undefined,
): InternalColumn<T, unknown>[] {
  const input =
    columns instanceof Function ? columns((value, column) => ({ ...column, value })) : columns;

  return input
    .filter((column): column is Column<T, unknown> => !!column)
    .map((column, index) => {
      const id = column.id ?? index;
      const defaults = { ...defaultColumnProps, ...columnProps?.(id) };
      const displaySize = column.displaySize ?? defaults.displaySize;

      return {
        id,
        header: column.header ?? defaults.header ?? null,
        exportHeader: column.exportHeader ?? defaults.exportHeader ?? id,
        footer: column.footer ?? defaults.footer ?? null,
        value: column.value,
        renderCell: column.renderCell ?? defaults.renderCell ?? asString,
        exportCell: column.exportCell ?? defaults.exportCell ?? defaultSerializer,
        sortBy: column.sortBy ?? defaults.sortBy ?? [defaultSortBy],
        disableSort: column.disableSort ?? defaults.disableSort ?? disableSort ?? false,
        hidden: column.hidden ?? defaults.hidden,
        classes: column.classes ?? defaults.classes,
        styles: column.styles ?? defaults.styles,
        filter: column.filter ?? defaults.filter,
        width: column.width ?? defaults.width,
        displaySize: displaySize !== undefined ? castArray(displaySize) : undefined,
      };
    });
}

function subscribeResize(onChange: () => void) {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
}

function useDisplaySize(displaySize: DisplaySize | DisplaySizes | undefined) {
  const width = useSyncExternalStore(
    subscribeResize,
    () => window.innerWidth,
    () => undefined,
  );

  if (typeof displaySize !== 'object') return displaySize;
  if (width === undefined) return undefined;

  return Object.entries(displaySize).find(
    ([, maxWidth]) => maxWidth !== undefined && maxWidth >= width,
  )?.[0];
}

function definedOnly<T extends object>(object: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

/**
 * Normalizes the props. Every derived value keeps its identity as long as its inputs do, so memos
 * downstream only recompute when the relevant props change.
 */
export function useTableProps<T>(raw: TableProps<T>) {
  const displaySize = useDisplaySize(raw.displaySize);

  const id = useMemo(() => normalizeId(raw.id), [raw.id]);
  const parentId = useMemo(() => normalizeParentId(raw.parentId), [raw.parentId]);
  const columns = useMemo(
    () => normalizeColumns(raw.columns, raw.defaultColumnProps, raw.columnProps, raw.disableSort),
    [raw.columns, raw.defaultColumnProps, raw.columnProps, raw.disableSort],
  );

  const displaySizeOverrides: TableProps<T>['displaySizeOverrides'] =
    raw.displaySizeOverrides ?? defaultProps.displaySizeOverrides;
  const override = displaySize !== undefined ? displaySizeOverrides[displaySize] : undefined;

  const overrideId = useMemo(
    () => (override?.id !== undefined ? normalizeId(override.id) : undefined),
    [override?.id],
  );
  const overrideParentId = useMemo(
    () => normalizeParentId(override?.parentId),
    [override?.parentId],
  );
  const overrideColumns = useMemo(
    () =>
      override?.columns !== undefined
        ? normalizeColumns(
            override.columns,
            override.defaultColumnProps ?? raw.defaultColumnProps,
            override.columnProps ?? raw.columnProps,
            override.disableSort ?? raw.disableSort,
          )
        : undefined,
    [
      override?.columns,
      override?.defaultColumnProps,
      override?.columnProps,
      override?.disableSort,
      raw.defaultColumnProps,
      raw.columnProps,
      raw.disableSort,
    ],
  );

  // `raw` keeps its identity across the table's own state changes, so this only changes when the
  // parent renders.
  const props = useMemo(
    () =>
      ({
        ...defaultProps,
        ...definedOnly(raw),
        ...(override && definedOnly(override)),
        id: overrideId ?? id,
        parentId: overrideParentId ?? parentId,
        columns: overrideColumns ?? columns,
      }) as InternalTableProps<T>,
    [raw, override, id, parentId, columns, overrideId, overrideParentId, overrideColumns],
  );

  return { props, displaySize };
}
