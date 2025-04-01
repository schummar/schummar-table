import type { Interpolation, Theme } from '@emotion/react';
import type React from 'react';
import type { CSSProperties, ComponentType, DependencyList, ReactNode, Ref } from 'react';
import { ExportOptions } from './exporters/exporter';
import type { TableStateStorage } from './internalState/tableStateStorage';

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

export interface TableTheme<TItem = unknown> {
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
    row?: string | FunctionWithDeps<(item: TItem, index: number) => string | undefined>;
    headerCell?: string;
    footerCell?: string;
    cell?: string | FunctionWithDeps<(item: TItem, index: number) => string | undefined>;
    evenCell?: string;
    oddCell?: string;
    popover?: string;
    popoverBackdrop?: string;
    columnDivider?: string;
    details?: string | FunctionWithDeps<(item: TItem, index: number) => string | undefined>;
  };
  styles?: {
    table?: Interpolation<Theme>;
    row?:
      | Exclude<Interpolation<Theme>, ((...args: any[]) => any) | Array<any>>
      | FunctionWithDeps<(item: TItem, index: number) => Interpolation<Theme>>;
    headerCell?: Interpolation<Theme>;
    footerCell?: Interpolation<Theme>;
    cell?:
      | Exclude<Interpolation<Theme>, ((...args: any[]) => any) | Array<any>>
      | FunctionWithDeps<(item: TItem, index: number) => Interpolation<Theme>>;
    evenCell?: Interpolation<Theme>;
    oddCell?: Interpolation<Theme>;
    columnDivider?: Interpolation<Theme>;
    details?:
      | Exclude<Interpolation<Theme>, ((...args: any[]) => any) | Array<any>>
      | FunctionWithDeps<(item: TItem, index: number) => Interpolation<Theme>>;
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
    background: string;
    text: string;
    border: string;
    borderLight: string;
  };
  /** Spacing. */
  spacing: string | number;
  /** Locale for number and date rendering */
  locale?: string;
}

export type PartialTableTheme<TItem = unknown> = {
  [K in keyof TableTheme<TItem>]?: TableTheme<TItem>[K] extends Record<string, any>
    ? Partial<TableTheme<TItem>[K]>
    : TableTheme<TItem>[K];
};

export type MemoizedTableTheme<TItem> = Omit<TableTheme, 'classes' | 'styles' | 'text'> & {
  classes: MemoizedFunctions<TableTheme<TItem>['classes']>;
  styles: MemoizedFunctions<TableTheme<TItem>['styles']>;
  text: MemoizedFunctions<TableTheme<TItem>['text']>;
};

export interface TableProps<TItem> extends PartialTableTheme<TItem> {
  /// ///////////////////////////////////////////////
  // Table data
  /// ///////////////////////////////////////////////

  /** The data to be rendered. One item per row. */
  items?: readonly TItem[];
  /** Unique id for each item/row. */
  id: FunctionWithDeps<(item: TItem) => Id> | KeyOfType<TItem, Id>;
  /** Create a nested structure by assigning parents to items. Child items are hidden until the parent is expanded. */
  parentId?:
    | FunctionWithDeps<(item: TItem) => Id | undefined>
    | KeyOfType<TItem, Id | undefined | null>;
  /** If true for an item, it means that children will be loaded asynchronously as soon as item is expanded. */
  hasDeferredChildren?: (item: TItem) => boolean;

  /// ///////////////////////////////////////////////
  // Columns and rows
  /// ///////////////////////////////////////////////
  /** Column definitions. */
  columns:
    | Column<TItem, any>[]
    | ((
        col: <TColumnValue>(
          value: (item: TItem) => TColumnValue,
          column: Omit<Column<TItem, TColumnValue>, 'value'>,
        ) => Column<TItem, TColumnValue>,
      ) => Column<TItem, any>[]);
  /** Default props for all column. Will take effect if not overriden in column definition. */
  defaultColumnProps?: Omit<Column<TItem, unknown>, 'id' | 'value'>;
  /** Set props for multiple columns at once. Will take effect if not overriden in column definition. */
  columnProps?: FunctionWithDeps<(id: Id) => Partial<Omit<Column<TItem, unknown>, 'id'>>>;
  /** Wrap each row */
  wrapRow?: FunctionWithDeps<(content: ReactNode, item: TItem, index: number) => ReactNode>;
  /** Wrap each cell */
  wrapCell?: FunctionWithDeps<
    (content: ReactNode, value: unknown, item: TItem, index: number) => ReactNode
  >;

  /** Display a cell at the start of each row. Useful for "go to details" button for example. */
  rowAction?: ReactNode | FunctionWithDeps<(item: TItem, index: number) => ReactNode>;
  /** Expand row to show details. */
  rowDetails?: ReactNode | FunctionWithDeps<(item: TItem, index: number) => ReactNode>;

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
  /** Whether to use a subgrid layout */
  subgrid?: boolean;

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
  enableExport?: boolean | ExportOptions;
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

export type InternalTableProps<TItem> = MemoizedFunctions<
  Omit<TableProps<TItem>, 'id' | 'parentId' | 'columns' | 'defaultColumnProps' | 'enableExport'> & {
    id: (item: TItem) => Id;
    parentId?: (item: TItem) => Id | undefined;
    columns: InternalColumn<TItem, unknown>[];
    enableExport: boolean | ExportOptions;
  }
>;

export type TableItem<TItem = unknown> = {
  id: Id;
  parentId?: Id | null;
  children: TableItem<TItem>[];
  value: TItem;
};

export type Column<TItem, TColumnValue> = {
  /** Column id. If not provided, the index in the column array will be used.
   * An explicit id is better however for controlling column related states, persitance etc.
   */
  id?: string;
  /** Render table header for this column. */
  header?: ReactNode;
  exportHeader?: string | number | Date;
  /** Render table header for this column. */
  footer?: ReactNode;
  /** Extract value for this column */
  value: FunctionWithDeps<(item: TItem) => TColumnValue>;
  /** Render table cell. If not provided, a string representation of the value will be rendered. */
  renderCell?: FunctionWithDeps<(value: TColumnValue, item: TItem) => ReactNode>;
  /** Serialize column value for exports. If not provided, a string representation of the value will be used. */
  exportCell?: (value: TColumnValue, item: TItem) => string | number | Date;
  /** Customize sort criteria. By default it will be the value itself in case it's a number or Date, or a string representation of the value otherwise. */
  sortBy?: FunctionWithDeps<(value: TColumnValue, item: TItem) => unknown>[];
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
  classes?: Omit<NonNullable<TableTheme<TItem>['classes']>, 'table' | 'details'>;
  /** Provide css styles to override columns styles. */
  styles?: Omit<NonNullable<TableTheme<TItem>['styles']>, 'table' | 'details'>;
};

export type InternalColumn<TItem, TColumnValue> = MemoizedFunctions<
  Required<
    Omit<Column<TItem, TColumnValue>, 'id' | 'sortBy'>,
    'header' | 'exportHeader' | 'renderCell' | 'exportCell' | 'sortBy'
  > & {
    id: Id;
    sortBy: ((value: TColumnValue, item: TItem) => unknown)[];
  }
>;

type Required<T, S> = T & {
  [P in keyof T as P extends S ? P : never]-?: T[P];
};

export type InternalTableState<TItem> = {
  // Basically the passed in props, but normalized
  props: InternalTableProps<TItem>;

  // Actual internal state
  key: any;
  sort: Sort[];
  selection: Set<Id>;
  expanded: Set<Id>;
  rowHeights: Map<Id, number>;
  filters: Map<Id, MemoizedFunctions<FilterImplementation<TItem, any, any, any>>>;
  filterValues: Map<Id, any>;
  hiddenColumns: Set<Id>;
  columnWidths: Map<Id, string>;
  columnOrder: Id[];
  columnStyleOverride: Map<Id, CSSProperties>;

  // Helper data structures for efficient lookup etc.
  activeColumns: InternalColumn<TItem, unknown>[];
  items: TableItem<TItem>[];
  itemsById: Map<Id, TableItem<TItem>>;
  activeItems: TableItem<TItem>[];
  activeItemsById: Map<Id, TableItem<TItem>>;
  lastSelectedId?: Id;
};

export type CommonFilterProps<TItem, TColumnValue, TFilterBy, TFilterValue> = {
  /** Filter by? By default the column value will be used. If filterBy returns an array, an items will be active if at least one entry matches the active filter. */
  filterBy?: FunctionWithDeps<(value: TColumnValue, item: TItem) => TFilterBy | TFilterBy[]>;
  /** Preselected filter value. */
  defaultValue?: TFilterValue;
  /** Controlled filter value. */
  value?: TFilterValue;
  /** Notifies on filter change. */
  onChange?: (value?: TFilterValue) => void;
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

export type FilterImplementation<TItem, TColumnValue, TFilterBy, TFilterValue> = CommonFilterProps<
  TItem,
  TColumnValue,
  TFilterBy,
  TFilterValue
> & {
  /** Unique filter id. Used to persist filter values. */
  id: string;
  /** Whether the filter is active currently. */
  isActive: (filterValue: TFilterValue) => boolean;
  /** When the filter is active, this function is used to filter the items to be displayed. */
  test: (filterValue: TFilterValue, value: TFilterBy) => boolean;
};
