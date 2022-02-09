import { CSSInterpolation } from '@emotion/serialize';
import React, { ComponentType, CSSProperties, ReactNode } from 'react';
import { TableStateStorage } from './internalState/tableStateStorage';
import { CsvExportOptions } from './misc/csvExport';

export type Sort = { columnId: string | number; direction: SortDirection };
export type SortDirection = 'asc' | 'desc';

export type Id = string | number;
export type KeyOfType<T, S> = { [K in keyof T]: T[K] extends S ? K : never }[keyof T];

export interface TableTheme<T = unknown> {
  text: {
    selectColumns: ReactNode;
    noResults: ReactNode;
    exportTitle: ReactNode;
    exportCopy: ReactNode;
    exportDownload: ReactNode;
    textFilter: ReactNode;
    selectFilter: ReactNode;
    dateFilter: ReactNode;
    today: ReactNode;
    reset: ReactNode;
  };
  css?: {
    table?: CSSInterpolation;
    headerCell?: CSSInterpolation;
    cell?: CSSInterpolation | ((item: T, index: number) => CSSInterpolation);
    evenCell?: CSSInterpolation;
    oddCell?: CSSInterpolation;
  };
  components: {
    IconButton: ComponentType<{ children: ReactNode; onClick?: (e: React.MouseEvent<Element>) => void; className?: string }>;
    Button: ComponentType<{
      children: ReactNode;
      onClick?: (e: React.MouseEvent<Element>) => void;
      startIcon?: ReactNode;
      variant?: 'text' | 'outlined' | 'contained';
      disabled?: boolean;
    }>;
    Checkbox: ComponentType<{ checked: boolean; onChange: (e: React.ChangeEvent) => void; disabled?: boolean; className?: string }>;
    Popover: ComponentType<{
      anchorEl: Element | null;
      open: boolean;
      onClose: () => void;
      children: ReactNode;
      className?: string;
      align?: 'center' | 'left';
    }>;
    Badge: ComponentType<{ children: ReactNode; badgeContent: ReactNode }>;
    TextField: ComponentType<{
      value: string | null;
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
      endIcon?: ReactNode;
      className?: string;
    }>;
    Spinner: (props: { className?: string }) => JSX.Element;
  };
  icons: {
    [K in
      | 'Settings'
      | 'Export'
      | 'Clipboard'
      | 'ChevronRight'
      | 'Search'
      | 'Clear'
      | 'ArrowDropDown'
      | 'FilterList'
      | 'ArrowUpward']: ComponentType<{
      className?: string;
    }>;
  };
  colors: {
    primary: string;
    primaryLight: string;
    primaryContrastText: string;
  };
  spacing: string | number;
}

export interface TableProps<T> extends Partial<TableTheme<T>> {
  items?: T[];
  id: ((item: T) => Id) | KeyOfType<T, Id>;
  parentId?: ((item: T) => Id | undefined) | KeyOfType<T, Id | undefined>;
  hasDeferredChildren?: (item: T) => boolean;

  columns: Column<T, any>[] | ((col: <V>(value: (item: T) => V, column: Omit<Column<T, V>, 'value'>) => Column<T, V>) => Column<T, any>[]);

  rowAction?: ReactNode | ((item: T, index: number) => ReactNode);

  defaultSort?: Sort[];
  sort?: Sort[];
  onSortChange?: (sort: Sort[]) => void;

  defaultSelection?: Set<Id>;
  selection?: Set<Id>;
  onSelectionChange?: (selection: Set<Id>) => void;
  selectSyncChildren?: boolean;
  revealFiltered?: boolean;

  defaultExpanded?: Set<Id>;
  expanded?: Set<Id>;
  onExpandedChange?: (expanded: Set<Id>) => void;
  expandOnlyOne?: boolean;

  defaultHiddenColumns?: Set<Id>;
  hiddenColumns?: Set<Id>;
  onHiddenColumnsChange?: (hiddenColumns: Set<Id>) => void;

  defaultWidth?: string;
  fullWidth?: boolean | 'left' | 'right';
  stickyHeader?: boolean;
  virtual?:
    | boolean
    | {
        rowHeight?: number;
        initalRowHeight?: number;
        throttleScroll?: number;
        overscan?: number;
        overscanBottom?: number;
        overscanTop?: number;
      };

  debug?: (...output: any) => void;

  enableSelection?: boolean;
  enableColumnSelection?: boolean;
  enableExport?: boolean | { copy?: boolean | CsvExportOptions; download?: boolean | CsvExportOptions };

  storeState?: {
    storage: TableStateStorage;
    id?: string;
    include?: {
      sort?: boolean;
      selection?: boolean;
      expanded?: boolean;
      hiddenColumns?: boolean;
    };
  };
}

export type InternalTableProps<T> = Omit<
  TableProps<T>,
  'id' | 'parentId' | 'columns' | 'enableSelection' | 'enableColumnSelection' | 'enableExport'
> & {
  id: (item: T) => Id;
  parentId?: (item: T) => Id | undefined;
  columns: InternalColumn<T, unknown>[];
  enableSelection: boolean;
  enableColumnSelection: boolean;
  enableExport: { copy?: CsvExportOptions; download?: CsvExportOptions };
};

export type TableItem<T = unknown> = T & { id: Id; parentId?: Id; children: TableItem<T>[] };

export type Column<T, V> = {
  id?: string;
  header?: ReactNode;
  value: (item: T) => V;
  renderCell?: (value: V, item: T) => ReactNode;
  exportCell?: (value: V, item: T) => string | number;
  sortBy?: ((value: V, item: T) => unknown) | ((value: V) => unknown)[];

  filter?: ReactNode;

  cannotHide?: boolean;

  width?: string;
  justifyContent?: CSSProperties['justifyContent'];

  css?: TableTheme<T>['css'];

  /** If the column definition changes, supply parameters that it depends on. If not set, the column will not update */
  dependencies?: any[];
};

export type InternalColumn<T, V> = Required<
  Omit<Column<T, V>, 'id'> & {
    id: Id;
  },
  'header' | 'stringValue' | 'sortBy' | 'renderValue' | 'renderCell' | 'exportCell'
>;

type Required<T, S> = T & {
  [P in keyof T as P extends S ? P : never]-?: T[P];
};

export type Rows<T, V> = [{ value: V; item: T }, ...{ value: V; item: T }[]];

export type Filter<T, V, S> = {
  id: string;
  test?: (value: V, item: T) => boolean;
  serialize?: (state: S) => any;
  deserialize?: (s: any) => S;
};

export type InternalTableState<T> = {
  // Basically the passed in props, but normalized
  props: InternalTableProps<T>;
  theme: TableTheme<T>;

  // Actual internal state
  sort: Sort[];
  selection: Set<Id>;
  expanded: Set<Id>;
  rowHeights: Map<Id, number>;
  filters: Map<Id, Filter<T, any, any>>;
  hiddenColumns: Set<Id>;
  columnWidths: Map<Id, string>;
  columnOrder: Id[];
  columnStyleOverride: Map<Id, CSSInterpolation>;

  // Helper data structures for efficient lookup etc.
  activeColumns: InternalColumn<T, unknown>[];
  items: TableItem<T>[];
  itemsById: Map<Id, TableItem<T>>;
  activeItems: TableItem<T>[];
  activeItemsById: Map<Id, TableItem<T>>;
  lastSelectedId?: Id;
};
