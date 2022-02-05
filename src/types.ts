import { CSSProperties, ReactNode } from 'react';
import { Filter } from './components/filterComponent';
import { CsvExportOptions } from './misc/csvExport';
import { TableStateStorage } from './internalState/tableStateStorage';

export type Sort = { columnId: string | number; direction: SortDirection };
export type SortDirection = 'asc' | 'desc';

export type Id = string | number;
export type KeyOfType<T, S> = { [K in keyof T]: T[K] extends S ? K : never }[keyof T];

export type TableProps<T> = {
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

  text?: {
    deselectAll?: ReactNode;
    exportTitle?: ReactNode;
    exportCopy?: ReactNode;
    exportDownload?: ReactNode;
  };
  classes?: {
    table?: string;
    headerCell?: string;
    cell?: string | ((item: T, index: number) => string | undefined);
    evenCell?: string;
    oddCell?: string;
  };
  wrapCell?: (cell: ReactNode, item: T) => ReactNode;
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
};

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

  filterComponent?: ReactNode;
  defaultFilter?: Filter<V>;
  filter?: Filter<V>;
  onFilterChange?: (filter?: Filter<T>) => void;

  cannotHide?: boolean;

  width?: string;
  justifyContent?: CSSProperties['justifyContent'];

  classes?: {
    headerCell?: string;
    cell?: string | ((item: T, index: number) => string | undefined);
    evenCell?: string;
    oddCell?: string;
  };

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

export type InternalTableState<T> = {
  // Basically the passed in props, but normalized
  props: InternalTableProps<T>;

  // Actual internal state
  sort: Sort[];
  selection: Set<Id>;
  expanded: Set<Id>;
  rowHeights: Map<Id, number>;
  filters: Map<Id, Filter<unknown> | undefined>;
  hiddenColumns: Set<Id>;
  columnWidths: Map<Id, string>;
  columnOrder: Id[];

  // Helper data structures for efficient lookup etc.
  activeColumns: InternalColumn<T, unknown>[];
  items: TableItem<T>[];
  itemsById: Map<Id, TableItem<T>>;
  activeItems: TableItem<T>[];
  activeItemsById: Map<Id, TableItem<T>>;
  lastSelectedId?: Id;
};
