import type { Interpolation, Theme } from '@emotion/react';
import type React from 'react';
import type { CSSProperties, ComponentType, DependencyList, ReactNode, Ref } from 'react';
import type { TableStateStorage } from './internalState/tableStateStorage';
import type { CsvExportOptions } from './misc/csvExport';

export type Sort = { columnId: string | number; direction: SortDirection };
export type SortDirection = 'asc' | 'desc';

export type Id = string | number;
export type KeyOfType<T, S> = { [K in keyof T]: T[K] extends S ? K : never }[keyof T];

export type FunctionWithDeps<F extends (...args: any[]) => any> =
  | F
  | [function: F, ...deps: DependencyList];
export type MemoizedFunctions<T> = {
  [K in keyof T]: Exclude<T[K], [function: (...args: any[]) => any, ...deps: DependencyList]>;
};

export interface TableTheme<T = unknown> {
  /** Define display texts. */
  text: {
    selectColumns: ReactNode;
    showAllColumns: ReactNode;
    hideAllColumns: ReactNode;
    noResults: ReactNode;
    exportTitle: ReactNode;
    exportCopy: ReactNode;
    exportDownload: ReactNode;
    today: ReactNode;
    thisWeek: ReactNode;
    thisMonth: ReactNode;
    thisYear: ReactNode;
    lastSevenDays: ReactNode;
    lastThirtyDays: ReactNode;
    reset: ReactNode;
    loading: ReactNode;
    clearFilters: ReactNode;
    deselectAll: ReactNode;
    resetAll: ReactNode;
    rangeMin: ReactNode;
    rangeMax: ReactNode;
    calendarWeek: ReactNode;
  };
  /** Define styles. */
  classes?: {
    table?: string;
    headerCell?: string;
    footerCell?: string;
    cell?: string | FunctionWithDeps<(item: T, index: number) => string | undefined>;
    evenCell?: string;
    oddCell?: string;
    popover?: string;
    popoverBackdrop?: string;
    columnDivider?: string;
    details?: string | FunctionWithDeps<(item: T, index: number) => string | undefined>;
  };
  styles?: {
    table?: Interpolation<Theme>;
    headerCell?: Interpolation<Theme>;
    footerCell?: Interpolation<Theme>;
    cell?:
      | Exclude<Interpolation<Theme>, ((...args: any[]) => any) | Array<any>>
      | FunctionWithDeps<(item: T, index: number) => Interpolation<Theme>>;
    evenCell?: Interpolation<Theme>;
    oddCell?: Interpolation<Theme>;
    columnDivider?: Interpolation<Theme>;
    details?:
      | Exclude<Interpolation<Theme>, ((...args: any[]) => any) | Array<any>>
      | FunctionWithDeps<(item: T, index: number) => Interpolation<Theme>>;
  };
  /** Define components to be used in the table. */
  components: {
    IconButton: ComponentType<{
      children: ReactNode;
      onClick?: (event: React.MouseEvent<Element>) => void;
      className?: string;
      type?: React.ButtonHTMLAttributes<HTMLButtonElement>['type'];
    }>;
    Button: ComponentType<{
      children: ReactNode;
      onClick?: (event: React.MouseEvent<Element>) => void;
      startIcon?: ReactNode;
      variant?: 'text' | 'outlined' | 'contained';
      disabled?: boolean;
      className?: string;
      type?: React.ButtonHTMLAttributes<HTMLButtonElement>['type'];
    }>;
    Checkbox: ComponentType<{
      checked: boolean;
      onChange: (event: React.ChangeEvent) => void;
      disabled?: boolean;
      className?: string;
    }>;
    Popover: ComponentType<{
      anchorEl: Element | null;
      open: boolean;
      hidden?: boolean;
      onClose: () => void;
      children: ReactNode;
      className?: string;
      backdropClassName?: string;
      align?: 'center' | 'left';
    }>;
    Badge: ComponentType<{ children: ReactNode; badgeContent: ReactNode }>;
    TextField: ComponentType<{
      value?: string | null;
      onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
      onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
      startIcon?: ReactNode;
      endIcon?: ReactNode;
      className?: string;
      inputRef?: Ref<HTMLInputElement>;
      placeholder?: string;
    }>;
    Spinner: (props: { className?: string }) => JSX.Element;
  };
  /** Define icons for the table. */
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
  /** Define colors */
  colors: {
    primary: { main: string; light: string; contrastText: string };
    secondary: { main: string; light: string; contrastText: string };
    blocked: { main: string; light: string; contrastText: string };
  };
  /** Spacing. */
  spacing: string | number;
  /** Locale for number and date rendering */
  locale?: string;
}

export type PartialTableTheme<T = unknown> = {
  [K in keyof TableTheme<T>]?: TableTheme<T>[K] extends Record<string, any>
    ? Partial<TableTheme<T>[K]>
    : TableTheme<T>[K];
};

export type MemoizedTableTheme<T> = Omit<TableTheme, 'classes' | 'styles' | 'text'> & {
  classes: MemoizedFunctions<TableTheme<T>['classes']>;
  styles: MemoizedFunctions<TableTheme<T>['styles']>;
  text: MemoizedFunctions<TableTheme<T>['text']>;
};

export interface TableProps<T> extends PartialTableTheme<T> {
  /// ///////////////////////////////////////////////
  // Table data
  /// ///////////////////////////////////////////////

  /** The data to be rendered. One item per row. */
  items?: readonly T[];
  /** Unique id for each item/row. */
  id: FunctionWithDeps<(item: T) => Id> | KeyOfType<T, Id>;
  /** Create a nested structure by assigning parents to items. Child items are hidden until the parent is expanded. */
  parentId?: FunctionWithDeps<(item: T) => Id | undefined> | KeyOfType<T, Id | undefined | null>;
  /** If true for an item, it means that children will be loaded asynchronously as soon as item is expanded. */
  hasDeferredChildren?: (item: T) => boolean;

  /// ///////////////////////////////////////////////
  // Columns and rows
  /// ///////////////////////////////////////////////
  /** Column definitions. */
  columns:
    | Column<T, any>[]
    | ((
        col: <V>(value: (item: T) => V, column: Omit<Column<T, V>, 'value'>) => Column<T, V>,
      ) => Column<T, any>[]);
  /** Default props for all column. Will take effect if not overriden in column definition. */
  defaultColumnProps?: Omit<Column<T, unknown>, 'id' | 'value'>;
  /** Set props for multiple columns at once. Will take effect if not overriden in column definition. */
  columnProps?: FunctionWithDeps<(id: Id) => Partial<Omit<Column<T, unknown>, 'id'>>>;
  /** Wrap each cell */
  wrapCell?: FunctionWithDeps<
    (content: ReactNode, value: unknown, item: T, index: number) => ReactNode
  >;

  /** Display a cell at the start of each row. Useful for "go to details" button for example. */
  rowAction?: ReactNode | FunctionWithDeps<(item: T, index: number) => ReactNode>;
  /** Expand row to show details. */
  rowDetails?: ReactNode | FunctionWithDeps<(item: T, index: number) => ReactNode>;

  /// ///////////////////////////////////////////////
  // Sorting
  /// ///////////////////////////////////////////////
  /** Default sort order. */
  defaultSort?: Sort[];
  /** If given, controls the sort order. */
  sort?: Sort[];
  /** Called when sort order changes. */
  onSortChange?: (sort: Sort[]) => void;
  /** Handle sorting externally, e.g. server side */
  externalSort?: boolean;
  /** Disable sort for all columns (can be override per column) */
  disableSort?: boolean;

  /// ///////////////////////////////////////////////
  // Selection
  /// ///////////////////////////////////////////////
  /** Default selection. */
  defaultSelection?: Set<Id>;
  /** If given, controls the selection. */
  selection?: Set<Id>;
  /** Called when selection changes. */
  onSelectionChange?: (selection: Set<Id>) => void;
  /** Whether to show checkboxes at the start of each row.
   * @default true
   */
  enableSelection?: boolean;
  /** Select and deselect children if a parent is selected or deselected.
   * @default true
   */
  selectSyncChildren?: boolean;
  /** Expand parents whose children fit a newly selected filter
   * @default false
   */
  revealFiltered?: boolean;

  /// ///////////////////////////////////////////////
  // Expansion
  /// ///////////////////////////////////////////////
  /** Default expanded rows. */
  defaultExpanded?: Set<Id>;
  /** If given, controls expanded rows. */
  expanded?: Set<Id>;
  /** Called when expanded rows change. */
  onExpandedChange?: (expanded: Set<Id>) => void;
  /** If enabled and one row is expanded, other rows will be closed.
   * @default false
   */
  expandOnlyOne?: boolean;

  /// ///////////////////////////////////////////////
  // Hidden columns
  /// ///////////////////////////////////////////////
  /** Default hidden columns. */
  defaultHiddenColumns?: Set<Id>;
  /** If given, controls hidden columns. */
  hiddenColumns?: Set<Id>;
  /** Called when hidden columns change. */
  onHiddenColumnsChange?: (hiddenColumns: Set<Id>) => void;

  /// ///////////////////////////////////////////////
  // Layout
  /// ///////////////////////////////////////////////

  /** Whether to stretch the table component over the available space. If value is "left" or "right", align accordingly. */
  fullWidth?: boolean | 'left' | 'right';
  /** Whether the table header should be sticky.
   * @default true
   */
  stickyHeader?: boolean | { top: number };
  /** Whether the table footer should be sticky.
   * @default true
   */
  stickyFooter?: boolean | { bottom: number };
  /** Whether the table cells should only be rendered when in viewport.
   * @default true
   */
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

  /// ///////////////////////////////////////////////
  // Misc
  /// ///////////////////////////////////////////////
  /** Enable menu to select which columns are visible.
   * @default true
   */
  enableColumnSelection?: boolean;
  /** Enable exporting to csv.
   * @default false
   */
  enableExport?:
    | boolean
    | { copy?: boolean | CsvExportOptions; download?: boolean | CsvExportOptions };
  /** Shows a button to clear all filters while any are active
   * @default false
   */
  enableClearFiltersButton?: boolean;
  /** Allow to drag and drop column separators to resize the column left of it.
   * @default true
   */
  enableColumnResize?: boolean;
  /** Allow to drag and drop column header to reorder columns.
   * @default true
   */
  enableColumnReorder?: boolean;
  /** If enabled, automatically store table state in localStorage, localForage or another compatible storage. */
  persist?: {
    storage: TableStateStorage;
    id: string;
    include?: (
      | 'sort'
      | 'selection'
      | 'expanded'
      | 'hiddenColumns'
      | 'filterValues'
      | 'columnWidths'
      | 'columnOrder'
    )[];
    exclude?: (
      | 'sort'
      | 'selection'
      | 'expanded'
      | 'hiddenColumns'
      | 'filterValues'
      | 'columnWidths'
      | 'columnOrder'
    )[];
  };
  debug?: (...output: any) => void;
  debugRender?: (...output: any) => void;
  onReset?: (scope?: 'table' | 'filters') => void;
}

export type InternalTableProps<T> = MemoizedFunctions<
  Omit<TableProps<T>, 'id' | 'parentId' | 'columns' | 'defaultColumnProps' | 'enableExport'> & {
    id: (item: T) => Id;
    parentId?: (item: T) => Id | undefined;
    columns: InternalColumn<T, unknown>[];
    enableExport: { copy?: CsvExportOptions; download?: CsvExportOptions };
  }
>;

export type TableItem<T = unknown> = {
  id: Id;
  parentId?: Id | null;
  children: TableItem<T>[];
  value: T;
};

export type Column<T, V> = {
  /** Column id. If not provided, the index in the column array will be used.
   * An explicit id is better however for controlling column related states, persitance etc.
   */
  id?: string;
  /** Render table header for this column. */
  header?: ReactNode;
  /** Render table header for this column. */
  footer?: ReactNode;
  /** Extract value for this column */
  value: FunctionWithDeps<(item: T) => V>;
  /** Render table cell. If not provided, a string representation of the value will be rendered. */
  renderCell?: FunctionWithDeps<(value: V, item: T) => ReactNode>;
  /** Serialize column value for exports. If not provided, a string representation of the value will be used. */
  exportCell?: (value: V, item: T) => string | number;
  /** Customize sort criteria. By default it will be the value itself in case it's a number or Date, or a string representation of the value otherwise. */
  sortBy?: FunctionWithDeps<(value: V, item: T) => unknown>[];
  /** Disable sort for this column */
  disableSort?: boolean;
  /** Set filter component that will be displayed in the column header */
  filter?: ReactNode;
  /** Override whether the column is hidden. If set, prevents toggling the column via menu. */
  hidden?: boolean;
  /** Specify a css width.
   * @default 'max-content'
   */
  width?: string;
  /** Provide css class names to override columns styles. */
  classes?: Omit<NonNullable<TableTheme<T>['classes']>, 'table' | 'details'>;
  /** Provide css styles to override columns styles. */
  styles?: Omit<NonNullable<TableTheme<T>['styles']>, 'table' | 'details'>;
};

export type InternalColumn<T, V> = MemoizedFunctions<
  Required<
    Omit<Column<T, V>, 'id' | 'sortBy'>,
    'header' | 'renderCell' | 'exportCell' | 'sortBy'
  > & {
    id: Id;
    sortBy: ((value: V, item: T) => unknown)[];
  }
>;

type Required<T, S> = T & {
  [P in keyof T as P extends S ? P : never]-?: T[P];
};

export type InternalTableState<T> = {
  // Basically the passed in props, but normalized
  props: InternalTableProps<T>;

  // Actual internal state
  key: any;
  sort: Sort[];
  selection: Set<Id>;
  expanded: Set<Id>;
  rowHeights: Map<Id, number>;
  filters: Map<Id, MemoizedFunctions<FilterImplementation<T, any, any, any>>>;
  filterValues: Map<Id, any>;
  hiddenColumns: Set<Id>;
  columnWidths: Map<Id, string>;
  columnOrder: Id[];
  columnStyleOverride: Map<Id, CSSProperties>;

  // Helper data structures for efficient lookup etc.
  activeColumns: InternalColumn<T, unknown>[];
  items: TableItem<T>[];
  itemsById: Map<Id, TableItem<T>>;
  activeItems: TableItem<T>[];
  activeItemsById: Map<Id, TableItem<T>>;
  lastSelectedId?: Id;
};

export type CommonFilterProps<T, V, F, S extends SerializableValue> = {
  /** Filter by? By default the column value will be used. If filterBy returns an array, an items will be active if at least one entry matches the active filter. */
  filterBy?: FunctionWithDeps<(value: V, item: T) => F | F[]>;
  /** Preselected filter value. */
  defaultValue?: S;
  /** Controlled filter value. */
  value?: S;
  /** Notifies on filter change. */
  onChange?: (value?: S) => void;
  /** Table should not filter using this filter. It will be done externally, e.g. server side. */
  external?: boolean;
  /** Whether to persist filter value (given that filter persitance is enabled for the table).
   * @default true
   */
  persist?: boolean;
  classNames?: {
    popover?: string;
    popoverBackdrop?: string;
  };
};

export type FilterImplementation<T, V, F, S extends SerializableValue> = CommonFilterProps<
  T,
  V,
  F,
  S
> & {
  /** Unique filter id. Used to persist filter values. */
  id: string;
  /** Whether the filter is active currently. */
  isActive: (filterValue: S) => boolean;
  /** When the filter is active, this function is used to filter the items to be displayed. */
  test: (filterValue: S, value: F) => boolean;
};

export type SerializableValue =
  | string
  | number
  | boolean
  | null
  | Date
  | SerializableArray
  | SerializableObject
  | SerializableSet
  | SerializableMap;
export type SerializableObject = { [key: string]: SerializableValue };
export type SerializableArray = SerializableValue[];
export type SerializableSet = Set<SerializableValue>;
export type SerializableMap = Map<SerializableValue, SerializableValue>;
