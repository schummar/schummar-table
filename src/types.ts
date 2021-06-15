import { CSSProperties, ReactNode } from 'react';
import { Filter } from './filterComponent';
import { TreeNode } from './helpers';

export type Sort = { columnId: string | number; direction: SortDirection };
export type SortDirection = 'asc' | 'desc';

export type Id = string | number;
export type KeyOfType<T, S> = { [K in keyof T]: T[K] extends S ? K : never }[keyof T];

export type TableProps<T> = {
  items: T[];
  id: ((item: T) => Id) | KeyOfType<T, Id>;
  parentId?: ((item: T) => Id | undefined) | KeyOfType<T, Id | undefined>;
  hasDeferredChildren?: (item: T) => boolean;

  columns: Column<T, any>[] | ((col: <V>(value: (item: T) => V, column: Omit<Column<T, V>, 'value'>) => Column<T, V>) => Column<T, any>[]);

  defaultSort?: Sort[];
  sort?: Sort[];
  onSortChange?: (sort: Sort[]) => void;

  defaultSelection?: Set<Id>;
  selection?: Set<Id>;
  onSelectionChange?: (selection: Set<Id>, target?: T, action?: 'selected' | 'deselected') => void;
  selectSyncChildren?: boolean;

  defaultExpanded?: Set<Id>;
  expanded?: Set<Id>;
  onExpandedChange?: (expanded: Set<Id>, target?: T, action?: 'expanded' | 'closed') => void;
  expandOnlyOne?: boolean;

  defaultWidth?: string;
  fullWidth?: boolean;

  text?: {
    deselectAll?: string;
  };
  classes?: {
    cell: string;
  };
};

export type InternalTableProps<T> = Omit<TableProps<T>, 'id' | 'parentId' | 'columns'> & {
  id: (item: T) => Id;
  parentId?: (item: T) => Id | undefined;
  columns: InternalColumn<T, unknown>[];
  itemsSorted: T[];
  itemsFiltered: T[];
  itemsTree: TreeNode<T>[];
};

export type Column<T, V> = {
  id?: string;
  header?: ReactNode;
  value: (item: T) => V;
  stringValue?: (value: V) => string;
  sortBy?: (value: V) => unknown;
  renderValue?: (value: V) => ReactNode;
  renderCell?: (value: V, item: T) => ReactNode;

  filterComponent?: ReactNode;
  defaultFilter?: Filter<V>;
  filter?: Filter<V>;
  onFilterChange?: (filter: Filter<V>) => void;
  width?: string;
  justifyContent?: CSSProperties['justifyContent'];
};

export type InternalColumn<T, V> = Omit<Column<T, V>, 'id'> & {
  id: Id;
} & Required<Omit<Column<T, V>, 'id' | 'width' | 'justifyContent' | 'filter' | 'onFilterChange' | 'filterComponent'>>;

export type Rows<T, V> = [{ value: V; item: T }, ...{ value: V; item: T }[]];

export type InternalTableState = {
  sort: Sort[];
  filters: Map<Id, Filter<unknown>>;
  selection: Set<Id>;
  expanded: Set<Id>;
  lastSelectedId?: Id;
};
