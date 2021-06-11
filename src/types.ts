import { CSSProperties, ReactNode } from 'react';
import { Filter } from './tableFilter';

export type Id = string | number;
export type Sort = { id: string | number; direction: SortDirection };
export type SortDirection = 'asc' | 'desc';

export type TableItem = { id?: Id; parent?: Id };

export type TableProps<T extends TableItem> = {
  data?: T[];
  columns?: Column<T, any>[] | ((col: <V>(value: (item: T) => V, column: Omit<Column<T, V>, 'value'>) => Column<T, V>) => Column<T, any>[]);

  defaultSort?: Sort[];
  sort?: Sort[];
  onSortChange?: (sort: Sort[]) => void;

  defaultSelection?: Set<T>;
  selection?: Set<T>;
  onSelectionChange?: (selection: Set<T>) => void;

  defaultExpanded?: Set<T>;
  expanded?: Set<T>;
  onExpandedChange?: (expanded: Set<T>) => void;
  deferredExpansion?: (item: T) => boolean;

  defaultUseFilter?: boolean;
  defaultWidth?: string;
  fullWidth?: boolean;

  text?: {
    deselectAll?: string;
  };
};

export type Column<T, V> = {
  id?: string;
  header?: ReactNode;
  value: (item: T) => V;
  stringValue?: (value: V) => string;
  sortBy?: (value: V) => unknown;
  renderValue?: (value: V) => ReactNode;
  renderCell?: (value: V, item: T) => ReactNode;

  useFilter?: boolean;
  filterOptions?: V[];
  defaultFilter?: Filter<V>;
  filter?: Filter<V>;
  onFilterChange?: (filter: Filter<V>) => void;
  width?: string;
  style?: CSSProperties;
};

export type Rows<T, V> = [{ value: V; item: T }, ...{ value: V; item: T }[]];
