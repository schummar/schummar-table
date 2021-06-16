import { CSSProperties, ReactNode } from 'react';
import { Filter } from './components/filterComponent';
import { MultiMap } from './misc/multiMap';

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
  onSelectionChange?: (selection: Set<Id>, targets?: T[], action?: 'selected' | 'deselected') => void;
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
    table?: string;
    headerCell?: string;
    cell?: string;
    evenCell?: string;
    oddCell?: string;
  };
};

export type InternalTableProps<T> = Omit<TableProps<T>, 'id' | 'parentId' | 'columns'> & {
  id: (item: T) => Id;
  parentId?: (item: T) => Id | undefined;
  columns: InternalColumn<T, unknown>[];
};

export type WithIds<T = unknown> = T & { id: Id; parentId?: Id };

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

  defaultIsHidden?: boolean;
  isHidden?: boolean;
  onIsHiddenChange?: (isHidden: boolean) => void;
  cannotHide?: boolean;

  width?: string;
  justifyContent?: CSSProperties['justifyContent'];

  classes?: {
    headerCell?: string;
    cell?: string;
    evenCell?: string;
    oddCell?: string;
  };
};

export type InternalColumn<T, V> = Required<
  Omit<Column<T, V>, 'id'> & {
    id: Id;
  },
  'header' | 'stringValue' | 'sortBy' | 'renderValue' | 'renderCell'
>;

type Required<T, S> = T &
  {
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
  filters: Map<Id, Filter<unknown>>;
  isHidden: Map<Id, boolean>;

  // Helper data structures for efficient lookup etc.
  activeColumns: InternalColumn<T, unknown>[];
  items: WithIds<T>[];
  activeItems: WithIds<T>[];
  activeItemsById: Map<Id, WithIds<T>>;
  activeItemsByParentId: MultiMap<Id | undefined, WithIds<T>>;
  lastSelectedId?: Id;
};
