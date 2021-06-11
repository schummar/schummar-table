import { Filter } from './tableFilter';
import { Column, Id, Sort, TableProps } from './types';

export type InternalColumn<T = unknown, V = unknown> = Omit<Column<T, V>, 'id'> & { id: Id } & Required<
    Omit<Column<T, V>, 'id' | 'width' | 'style' | 'filter' | 'onFilterChange'>
  >;

export type InternalTableProps<T = unknown> = Omit<TableProps<T>, 'columns'> & { columns: InternalColumn<T, unknown>[] };

export type InternalTableState<T> = {
  sort?: Sort[];
  filters: Map<string | number, Filter<unknown>>;
  selection: Set<T>;
  expanded: Set<T>;
};
