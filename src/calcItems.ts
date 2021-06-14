import { Store } from 'schummar-state/react';
import { flatMap, orderBy } from './helpers';
import { InternalTableProps, InternalTableState } from './internalTypes';

export function calcItems<T>({
  data,
  columns,
  defaultSort,
  defaultUseFilter,
  store,
  ...props
}: InternalTableProps<T> & { store: Store<InternalTableState> }): T[] {
  return store.useState((state) => {
    const filtered = columns.reduce((data, column) => {
      const filter = state.filters.get(column.id);
      if (!filter) return data;
      return data.filter((item) => filter.filter(column.value(item)));
    }, data);

    const sort = state.sort;
    if (!sort) return filtered;

    const selectors = flatMap(sort, (sort) => {
      const column = columns.find((column) => column.id === sort.column);
      if (column) return [{ selector: (item: T) => column.sortBy(column.value(item)), direction: sort.direction }];
      return [];
    }).filter(Boolean);

    const sorted = orderBy(
      filtered,
      selectors.map((x) => x.selector),
      selectors.map((x) => x.direction),
    );

    return sorted;
  });
}
