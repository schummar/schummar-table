import { useMemo } from 'react';
import type { Id, InternalTableProps, TableItem } from '../types';
import { sortBy } from './useSort';
import type { useSort } from './useSort';

type ItemRecord<T> = { id: Id; parentId: Id | undefined | null; value: T };

const isRoot = (parentId: Id | undefined | null) => parentId === undefined || parentId === null;

/** All items, sorted, as a flattened tree. */
export function useItems<T>(
  props: InternalTableProps<T>,
  criteria: ReturnType<typeof useSort<T>>['criteria'],
) {
  const { items: input, id, parentId } = props;

  const records = useMemo(
    () =>
      (input ?? []).map<ItemRecord<T>>((value) => ({
        id: id(value),
        parentId: parentId?.(value),
        value,
      })),
    [input, id, parentId],
  );

  const sorted = useMemo(
    () => sortBy(records, criteria, (record) => record.value),
    [records, criteria],
  );

  return useMemo(() => {
    const byId = new Map<Id, TableItem<T>>();
    for (const record of sorted) {
      byId.set(record.id, { ...record, children: [], depth: 0 });
    }

    const roots: TableItem<T>[] = [];
    for (const item of byId.values()) {
      if (isRoot(item.parentId)) {
        roots.push(item);
      } else {
        byId.get(item.parentId!)?.children.push(item);
      }
    }

    // Items whose parent is missing are dropped, like before: they are unreachable from a root.
    const items: TableItem<T>[] = [];
    const itemsById = new Map<Id, TableItem<T>>();
    const traverse = (level: TableItem<T>[], depth: number) => {
      for (const item of level) {
        item.depth = depth;
        items.push(item);
        itemsById.set(item.id, item);
        traverse(item.children, depth + 1);
      }
    };
    traverse(roots, 0);

    return { items, itemsById };
  }, [sorted]);
}

/** Items that pass the filters and whose ancestors are all expanded. */
export function useActiveItems<T>(
  items: TableItem<T>[],
  matching: Set<Id> | undefined,
  expanded: Set<Id>,
) {
  return useMemo(() => {
    const activeItems: TableItem<T>[] = [];
    const activeItemsById = new Map<Id, TableItem<T>>();

    for (const item of items) {
      if (matching && !matching.has(item.id)) continue;
      if (
        !isRoot(item.parentId) &&
        !(activeItemsById.has(item.parentId!) && expanded.has(item.parentId!))
      ) {
        continue;
      }

      activeItems.push(item);
      activeItemsById.set(item.id, item);
    }

    return { activeItems, activeItemsById };
  }, [items, matching, expanded]);
}
