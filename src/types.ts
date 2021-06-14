import { CSSProperties, ReactNode } from 'react';
import { Filter } from './tableFilter';

export type Sort = { column: string | number; direction: SortDirection };
export type SortDirection = 'asc' | 'desc';

export type Id = string | number;
export type IdKey<T> = { [P in keyof T]: T[P] extends Id ? P : never }[keyof T];

export type TableProps<T> = {
  data: T[];
  id: ((item: T) => Id) | IdKey<T>;
  getChildren?: (item: T) => T[];
  childrenHook?: (item: T, isExpanded: boolean) => { hasChildren: boolean; children?: T[] };

  columns: Column<T, any>[] | ((col: <V>(value: (item: T) => V, column: Omit<Column<T, V>, 'value'>) => Column<T, V>) => Column<T, any>[]);

  defaultSort?: Sort[];
  sort?: Sort[];
  onSortChange?: (sort: Sort[]) => void;

  defaultSelection?: Set<Id>;
  selection?: Set<Id>;
  onSelectionChange?: (selection: Set<Id>) => void;

  defaultExpanded?: Set<Id>;
  expanded?: Set<Id>;
  onExpandedChange?: (expanded: Set<Id>) => void;
  expandOnlyOne?: boolean;

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
