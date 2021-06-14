import { Filter } from './tableFilter';
import { Column, Id, Sort, TableProps } from './types';

export type InternalColumn<T, V> = Omit<Column<T, V>, 'id'> & { id: Id } & Required<
    Omit<Column<T, V>, 'id' | 'width' | 'style' | 'filter' | 'onFilterChange'>
  >;

export type InternalTableProps<T> = Omit<TableProps<T>, 'id' | 'columns'> & {
  id: (item: T) => Id;
  columns: InternalColumn<T, unknown>[];
};

export type InternalTableState = {
  sort?: Sort[];
  filters: Map<Id, Filter<unknown>>;
  selection: Set<Id>;
  expanded: Set<Id>;
};
