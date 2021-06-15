import { Store } from 'schummar-state/react';
import { buildTree, filterTree, flatMap, flattenTree, orderBy, TreeNode } from './helpers';
import { InternalTableProps, InternalTableState } from './types';

export function calcItems<T>(
  { items, columns, id, parentId }: InternalTableProps<T>,
  store: Store<InternalTableState>,
): { tree: TreeNode<T>[]; itemsSorted: T[]; itemsFiltered: T[] } {
  return store.useState(
    (state) => {
      let sorted;
      if (state.sort.length === 0) {
        sorted = items;
      } else {
        const selectors = flatMap(state.sort, (sort) => {
          const column = columns.find((column) => column.id === sort.columnId);
          if (column) return [{ selector: (item: T) => column.sortBy(column.value(item)), direction: sort.direction }];
          return [];
        }).filter(Boolean);

        sorted = orderBy(
          items,
          selectors.map((x) => x.selector),
          selectors.map((x) => x.direction),
        );
      }

      const tree = buildTree({ items: sorted, id, parentId });
      const filteredTree = filterTree(tree, (item) =>
        columns.every((column) => {
          const filter = state.filters.get(column.id);
          return filter?.filter(column.value(item), column.stringValue(column.value(item))) ?? true;
        }),
      );
      const itemsSorted = flattenTree(tree);
      const itemsFiltered = flattenTree(filteredTree);

      return { tree: filteredTree, itemsSorted, itemsFiltered };
    },
    [items, columns, id, parentId],
  );
}
