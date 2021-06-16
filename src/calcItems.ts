import { Store } from 'schummar-state/react';
import { filterTree, flatMap, flattenTree, orderBy } from './helpers';
import { MultiMap } from './multiMap';
import { Id, InternalTableProps, InternalTableState, WithIds } from './types';

export function calcItems<T>(props: InternalTableProps<T>, state: Store<InternalTableState>): InternalTableProps<T> {
  const result = state.useState(
    (state) => {
      let sorted;
      if (state.sort.length === 0) {
        sorted = props.items;
      } else {
        const selectors = flatMap(state.sort, (sort) => {
          const column = props.columns.find((column) => column.id === sort.columnId);
          if (column) return [{ selector: (item: T) => column.sortBy(column.value(item)), direction: sort.direction }];
          return [];
        }).filter(Boolean);

        sorted = orderBy(
          props.items,
          selectors.map((x) => x.selector),
          selectors.map((x) => x.direction),
        );
      }

      const tree = new MultiMap<Id | undefined, WithIds<T>>();
      for (const item of sorted) {
        tree.set(item.parentId, item);
      }

      const items = flattenTree(tree);

      const activeItemsByParentId = filterTree(tree, (item) =>
        props.columns.every((column) => {
          const filter = state.filters.get(column.id);
          return filter?.filter(column.value(item), column.stringValue(column.value(item))) ?? true;
        }),
      );

      const activeItems = flattenTree(activeItemsByParentId);

      const activeItemsById = new Map<Id, WithIds<T>>();
      for (const items of activeItemsByParentId.values())
        for (const item of items) {
          activeItemsById.set(item.id, item);
        }

      return { items, activeItems, activeItemsById, activeItemsByParentId };
    },
    [props.items, props.columns],
  );

  return { ...props, ...result };
}
