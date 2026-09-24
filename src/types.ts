import type {
  ComponentSelector,
  CSSObject,
  Interpolation,
  Keyframes,
  SerializedStyles,
  Theme,
} from '@emotion/react';
import type React from 'react';
import type { ComponentType, CSSProperties, ReactElement, ReactNode, Ref } from 'react';
import { ExportOptions } from './exporters/exporter';
import type { PersistEntry, TableStateStorage } from './state/persistence';

export type Sort = {
  columnId: string | number;
  direction: SortDirection;
  locale?: string;
  options?: Intl.CollatorOptions;
};
export type SortDirection = 'asc' | 'desc';

export type Id = string | number;
export type KeyOfType<T, S> = { [K in keyof T]: T[K] extends S ? K : never }[keyof T];

type InterpolationPrimitive =
  | null
  | undefined
  | boolean
  | number
  | string
  | ComponentSelector
  | Keyframes
  | SerializedStyles
  | CSSObject;

interface ArrayCSSInterpolation extends ReadonlyArray<CSSInterpolation> {}

export type CSSInterpolation = InterpolationPrimitive | ArrayCSSInterpolation;

type Falsy = false | 0 | '' | null | undefined;

export type DisplaySize = 'desktop' | 'mobile' | (string & {});
export type DisplaySizes = Partial<Record<DisplaySize, number>>;

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
    hiddenColumnFilters: ReactNode;
  };
  /** Define styles. */
  classes?: {
    table?: string;
    row?: string | ((item: TItem, index: number) => string | undefined);
    headerCell?: string;
    footerCell?: string;
    cell?: string | ((item: TItem, index: number) => string | undefined);
    evenCell?: string;
    oddCell?: string;
    popover?: string;
    popoverBackdrop?: string;
    dialog?: string;
    columnDivider?: string;
    details?: string | ((item: TItem, index: number) => string | undefined);
  };
  /** Emotion styles. Static styles are resolved once per table. Function styles (`row`, `cell`,
   * `details`) run on every row or cell render; if they return new style objects, emotion serializes
   * them each time, which is expensive for large tables. Return `css` results or constants, or use
   * `classes` instead. */
  styles?: {
    table?: Interpolation<Theme>;
    row?:
      | CSSInterpolation
      | ((item: TItem, index: number) => CSSInterpolation | CSSInterpolation[]);
    headerCell?: Interpolation<Theme>;
    footerCell?: Interpolation<Theme>;
    cell?: CSSInterpolation | ((item: TItem, index: number) => Interpolation<Theme>);
    evenCell?: Interpolation<Theme>;
    oddCell?: Interpolation<Theme>;
    popover?: Interpolation<Theme>;
    popoverBackdrop?: CSSInterpolation;
    dialog?: Interpolation<Theme>;
    columnDivider?: Interpolation<Theme>;
    details?:
      | Exclude<Interpolation<Theme>, ((...args: any[]) => any) | Array<any>>
      | ((item: TItem, index: number) => Interpolation<Theme>);
  };
  /** Define components to be used in the table. */
  components: {
    IconButton: ComponentType<{
      children: ReactNode;
      onClick?: (event: React.MouseEvent<Element>) => void;
      onContextMenu?: (event: React.MouseEvent<Element>) => void;
      className?: string;
      type?: React.ButtonHTMLAttributes<HTMLButtonElement>['type'];
    }>;
    Button: ComponentType<{
      children: ReactNode;
      onClick?: (event: React.MouseEvent<Element>) => void;
      onContextMenu?: (event: React.MouseEvent<Element>) => void;
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
      onKeyUp?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
      onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
      startIcon?: ReactNode;
      endIcon?: ReactNode;
      className?: string;
      inputRef?: Ref<HTMLInputElement>;
      placeholder?: string;
    }>;
    Spinner: (props: { className?: string }) => ReactElement;
  };
  /** Define icons for the table. */
  icons: {
    [
      K in
        | 'Settings'
        | 'Export'
        | 'Clipboard'
        | 'ChevronRight'
        | 'Search'
        | 'Clear'
        | 'ArrowDropDown'
        | 'FilterList'
        | 'ArrowUpward'
    ]: ComponentType<{
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

export type ColumnGenerator<TItem> = (col: ColumnFactory<TItem>) => (Column<TItem, any> | Falsy)[];

export type ColumnFactory<TItem> = <TColumnValue, TFilterBy = TColumnValue>(
  value: (item: TItem) => TColumnValue,
  column: Omit<Column<TItem, TColumnValue, TFilterBy>, 'value'>,
) => Column<TItem, TColumnValue, TFilterBy>;

export interface TableProps<TItem> extends PartialTableTheme<TItem> {
  /// ///////////////////////////////////////////////
  // Table data
  /// ///////////////////////////////////////////////

  /** The data to be rendered. One item per row. */
  items?: readonly TItem[];
  /** Unique id for each item/row. */
  id: ((item: TItem) => Id) | KeyOfType<TItem, Id>;
  /** Create a nested structure by assigning parents to items. Child items are hidden until the parent is expanded. */
  parentId?: ((item: TItem) => Id | undefined) | KeyOfType<TItem, Id | undefined | null>;
  /** If true for an item, it means that children will be loaded asynchronously as soon as item is expanded. */
  hasDeferredChildren?: (item: TItem) => boolean;

  /// ///////////////////////////////////////////////
  // Columns and rows
  /// ///////////////////////////////////////////////
  /** Column definitions. */
  columns: (Column<TItem, any> | Falsy)[] | ColumnGenerator<TItem>;
  /** Default props for all column. Will take effect if not overriden in column definition. */
  defaultColumnProps?: Omit<Column<TItem, unknown>, 'id' | 'value'>;
  /** Set props for multiple columns at once. Will take effect if not overriden in column definition. */
  columnProps?: (id: Id) => Partial<Omit<Column<TItem, unknown>, 'id'>>;
  /** Wrap each row */
  /** Wrap each row. `props` must be spread onto the row element: it carries the ref and
   * `data-index` the virtualizer measures the row with. */
  wrapRow?: (props: WrapRowProps, item: TItem, index: number) => ReactNode;
  /** Wrap each cell */
  wrapCell?: (content: ReactNode, value: unknown, item: TItem, index: number) => ReactNode;

  /** Display a cell at the start of each row. Useful for "go to details" button for example. */
  rowAction?: ReactNode | ((item: TItem, index: number) => ReactNode);
  /** Expand row to show details. */
  rowDetails?: ReactNode | ((item: TItem, index: number) => ReactNode);

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
  // Filters
  /// ///////////////////////////////////////////////
  /** Default filter values by column id. Columns without an entry use their filter's `defaultValue`. */
  defaultFilterValues?: Map<Id, unknown>;
  /** If given, controls filter values. Columns without an entry use their filter's `defaultValue`;
   * a cleared filter has an entry with the value `undefined`. */
  filterValues?: Map<Id, unknown>;
  /** Called when filter values change, with an entry for every filter that has a value. */
  onFilterValuesChange?: (filterValues: Map<Id, unknown>) => void;
  /** Keep applying the filters of hidden columns and make them editable from a button in the
   * header. Without it, the value of a hidden column's filter is kept but ignored.
   * @default false
   */
  enableHiddenColumnFilters?: boolean;

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
   * @default false
   */
  virtual?:
    | boolean
    | {
        /** Fixed row height in px. Rows are not measured when set. */
        rowHeight?: number;
        /** Row height in px assumed until a row has been measured.
         * @default 40
         */
        estimatedRowHeight?: number;
        /** Number of rows rendered beyond each edge of the viewport.
         * @default 5
         */
        overscan?: number;
        /** Render cells progressively: rows render normally until about 8 ms of the current frame
         * are used; the deferred cells of the rest show a placeholder and are revealed a row at a time
         * over the following frames, visible rows first. Meant for expensive
         * cells. A single row always renders at once, so a very expensive row can exceed the budget.
         * Columns without a fixed `width` may widen while rows are revealed. Can be overridden per
         * column with `deferred`.
         * @default false
         */
        deferCells?: boolean;
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
  enableExport?: boolean | ExportOptions;
  /** Shows a button to clear all filters while any are active
   * @default false
   */
  enableClearFiltersButton?: boolean;
  /** Allow to drag and drop column separators to resize the column left of it.
   * @default true
   */
  enableColumnResize?: boolean | 'visualOnly';
  /** If enabled, automatically store table state in localStorage, localForage or another compatible storage. */
  persist?: {
    storage: TableStateStorage;
    id: string;
    /** What to persist; everything by default. `{ filterValues: [...] }` persists the values of the
     * given filters (column ids) only. */
    include?: readonly PersistEntry[];
    /** What not to persist. `{ filterValues: [...] }` excludes the values of the given filters. */
    exclude?: readonly PersistEntry[];
  };
  /** The current screen size. Used to determine which columns to display.
   * Either assert the size manually - e.g. "mobile" or "desktop".
   * Or provide a map of screen sizes to maximum pixel widths of the screen.
   * If not provided, <= 400 px will be "mobile", else "desktop".
   *
   * @example
   * displaySize: 'mobile' // assert the size manually
   * displaySize: { mobile: 450, desktop: Infinity } // provide a map of screen sizes
   * */
  displaySize?: DisplaySize | DisplaySizes;
  displaySizeOverrides?: Partial<
    Record<DisplaySize, Partial<Omit<TableProps<TItem>, 'displaySize' | 'displaySizeOverrides'>>>
  >;
  debug?: (...output: any) => void;
  debugRender?: (...output: any) => void;
  onReset?: (scope?: 'table' | 'filters') => void;
}

export interface WrapRowProps {
  ref: Ref<HTMLDivElement>;
  'data-index': number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export interface TableRef {
  getSort: () => Sort[];
  setSort: (sort: Sort[]) => void;
  getSelection: () => Set<Id>;
  setSelection: (selection: Set<Id>) => void;
  getExpanded: () => Set<Id>;
  setExpanded: (expanded: Set<Id>) => void;
  getHiddenColumns: () => Set<Id>;
  setHiddenColumns: (hidden: Set<Id>) => void;
  getFilterValues: () => Map<Id, unknown>;
  setFilterValues: (filterValues: Map<Id, unknown>) => void;
}

export type InternalTableProps<TItem> = Omit<
  TableProps<TItem>,
  'id' | 'parentId' | 'columns' | 'defaultColumnProps' | 'columnProps' | 'displaySizeOverrides'
> & {
  id: (item: TItem) => Id;
  parentId?: (item: TItem) => Id | undefined;
  columns: InternalColumn<TItem, unknown>[];
};

export type TableItem<TItem = unknown> = {
  id: Id;
  parentId?: Id | null;
  children: TableItem<TItem>[];
  depth: number;
  value: TItem;
};

export type Column<TItem, TColumnValue, TFilterBy = TColumnValue> = {
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
  value: (item: TItem) => TColumnValue;
  /** Render table cell. If not provided, a string representation of the value will be rendered. */
  renderCell?: (value: TColumnValue, item: TItem) => ReactNode;
  /** Serialize column value for exports. If not provided, a string representation of the value will be used. */
  exportCell?: (value: TColumnValue, item: TItem) => string | number | Date;
  /** Customize sort criteria. By default it will be the value itself in case it's a number or Date, or a string representation of the value otherwise. */
  sortBy?: ((value: TColumnValue, item: TItem) => unknown)[];
  /** Disable sort for this column */
  disableSort?: boolean;
  /** Render this column's cells progressively, see `virtual.deferCells`. Overrides the table setting.
   * Give the column a fixed `width` to keep it from widening while its cells are revealed. */
  deferred?: boolean;
  /** The value the column's filter works with. By default the column value. */
  filterBy?: (value: TColumnValue, item: TItem) => TFilterBy;
  /** Filter shown in the column header, e.g. `textFilter()`. It must accept the `filterBy` value.
   * `NoInfer`: the column value alone determines the type the filter is checked against. */
  filter?: Filter<NoInfer<TFilterBy>>;
  /** Override whether the column is hidden. If set, prevents toggling the column via menu. */
  hidden?: boolean;
  /** Specify a css width.
   * @default 'max-content'
   */
  width?: string;
  /** Provide css class names to override columns styles. */
  classes?: Omit<NonNullable<TableTheme<TItem>['classes']>, 'table' | 'details'>;
  /** Provide css styles to override columns styles. See the note on `TableTheme['styles']`. */
  styles?: Omit<NonNullable<TableTheme<TItem>['styles']>, 'table' | 'details'>;
  /** Specify the screen size(s) for which this column should be displayed. */
  displaySize?: DisplaySize | DisplaySize[];
};

export type InternalColumn<TItem, TColumnValue> = Required<
  Omit<Column<TItem, TColumnValue, unknown>, 'id' | 'sortBy' | 'displaySize' | 'filter'>,
  'header' | 'exportHeader' | 'renderCell' | 'exportCell' | 'sortBy' | 'filterBy'
> & {
  id: Id;
  filter?: Filter<any>;
  sortBy: ((value: TColumnValue, item: TItem) => unknown)[];
  displaySize: DisplaySize[] | undefined;
};

type Required<T, S> = T & {
  [P in keyof T as P extends S ? P : never]-?: T[P];
};

export interface TableState<TItem> {
  /** Normalized props with the overrides of the current display size applied. */
  props: InternalTableProps<TItem>;
  displaySize: DisplaySize | undefined;

  sort: Sort[];
  selection: Set<Id>;
  expanded: Set<Id>;
  hiddenColumns: Set<Id>;
  columnWidths: Map<Id, string>;
  /** Filter values by column id, defaults included. Hidden columns keep theirs. */
  filterValues: Map<Id, unknown>;

  /** Columns matching the current display size, hidden ones included. */
  columns: InternalColumn<TItem, unknown>[];
  /** Columns that are not hidden, regardless of display size. */
  activeColumns: InternalColumn<TItem, unknown>[];
  /** Columns that are rendered: not hidden and matching the display size. */
  visibleColumns: InternalColumn<TItem, unknown>[];
  /** All items in display order, as a flattened tree. */
  items: TableItem<TItem>[];
  itemsById: Map<Id, TableItem<TItem>>;
  /** Items that pass the filters and whose ancestors are expanded. */
  activeItems: TableItem<TItem>[];
  activeItemsById: Map<Id, TableItem<TItem>>;
}

export interface TableActions<TItem = unknown> {
  /** Latest state, for event handlers. */
  getState: () => TableState<TItem>;
  setSort: (sort: Sort[]) => void;
  setSelection: (selection: Set<Id>) => void;
  /** Toggle one item, or all active items when `itemId` is undefined. With `range`, toggles
   * everything between the last toggled item and this one. */
  toggleSelection: (itemId: Id | undefined, options?: { range?: boolean }) => void;
  setExpanded: (expanded: Set<Id>) => void;
  toggleExpanded: (itemId: Id) => void;
  setHiddenColumns: (hiddenColumns: Set<Id>) => void;
  setColumnWidth: (columnId: Id, width: string | undefined) => void;
  setFilterValues: (filterValues: Map<Id, unknown>) => void;
  setFilterValue: (columnId: Id, value: unknown) => void;
  /** Clears every filter, hidden columns' included. */
  clearFilters: () => void;
  /** Clear persisted state and reset the table to its defaults. */
  resetTable: () => Promise<void>;
}

export type TableContextValue<TItem = unknown> = TableState<TItem> & {
  actions: TableActions<TItem>;
};

/** Table state without selection, expansion and the resulting active items. */
export type TableStructure<TItem = unknown> = Omit<
  TableContextValue<TItem>,
  'selection' | 'expanded' | 'activeItems' | 'activeItemsById'
>;

/** A single value, or several of them: an item matches if one of them does. */
export type SingleOrMultiple<T> = T | readonly T[] | ReadonlySet<T>;

/** The single values in `SingleOrMultiple<T>`. */
export type SingleOf<T> = T extends readonly (infer U)[]
  ? U
  : T extends ReadonlySet<infer U>
    ? U
    : T;

export interface FilterComponentProps<TInput, TState, TOptions> {
  /** The current value; `undefined` (or `null` after persisting) when cleared. */
  value: TState | null | undefined;
  onChange: (value: TState | undefined) => void;
  /** Closes the filter popover. */
  close: () => void;
  options: TOptions;
  /** The `filterBy` values of all items, regardless of filters, flattened and deduplicated. */
  getValues: () => SingleOf<TInput>[];
}

/** Options every filter accepts. */
export interface FilterOptions<TState> {
  /** Value while the filter has none set, see `TableProps['filterValues']`. */
  defaultValue?: TState;
  /** The table does not filter by this filter; it's done externally, e.g. server side. Read its
   * value through `onFilterValuesChange`. */
  external?: boolean;
  classNames?: {
    popover?: string;
    popoverBackdrop?: string;
  };
}

/**
 * A column filter, created by a filter factory like `textFilter()` or one made with
 * `defineFilter`. `TInput` is what it accepts from the column's `filterBy`, `TState` its own value.
 *
 * Members are methods on purpose: their parameters are then compared bivariantly, which lets
 * `col(...)` infer the column value before checking the filter against it.
 */
export interface Filter<TInput, TState = any, TOptions = any> extends FilterOptions<TState> {
  isActive(value: TState, options: TOptions): boolean;
  test(value: TState, input: TInput, options: TOptions): boolean;
  /** Delay in ms before changes made in the UI apply. Filters may take it as an option. */
  debounce?: number;
  options: TOptions;
  Component(props: FilterComponentProps<TInput, TState, TOptions>): ReactNode;
}
