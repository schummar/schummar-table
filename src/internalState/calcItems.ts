import { castDraft } from 'immer';
import { useEffect } from 'react';
import { Store } from 'schummar-state/react';
import { filterTree, flatMap, flattenTree, orderBy } from '../misc/helpers';
import { MultiMap } from '../misc/multiMap';
import { Id, InternalTableState, WithIds } from '../types';

export function calcItems<T>(state: Store<InternalTableState<T>>): void {
  useEffect(
    () =>
      state.addReaction(
        (state) => [state.props.items, state.props.id, state.props.parentId, state.sort, state.filters, state.activeColumns] as const,
        ([items, id, parentId, sort, filters, activeColumns], draft) => {
          const withIds = items.map((item) => ({ ...item, id: id(item), parentId: parentId?.(item) }));

          let sorted;
          if (sort.length === 0) {
            sorted = withIds;
          } else {
            const selectors = flatMap(sort, (sort) => {
              const column = activeColumns.find((column) => column.id === sort.columnId);
              if (!column) return [];
              const sortBy = column.sortBy instanceof Array ? column.sortBy : [column.sortBy];
              return sortBy.map((sortBy) => ({ selector: (item: T) => sortBy(column.value(item), item), direction: sort.direction }));
            }).filter(Boolean);

            sorted = orderBy(
              withIds,
              selectors.map((x) => x.selector),
              selectors.map((x) => x.direction),
            );
          }

          const tree = new MultiMap<Id | undefined, WithIds<T>>();
          for (const item of sorted) {
            tree.set(item.parentId, item);
          }

          const activeItemsByParentId = filterTree(tree, (item) =>
            activeColumns.every((column) => {
              const filter = filters.get(column.id);
              return filter?.filter(item) ?? true;
            }),
          );

          const activeItemsById = new Map<Id, WithIds<T>>();
          for (const items of activeItemsByParentId.values())
            for (const item of items) {
              activeItemsById.set(item.id, item);
            }

          draft.items = castDraft(flattenTree(tree));
          draft.activeItems = castDraft(flattenTree(activeItemsByParentId));
          draft.activeItemsById = castDraft(activeItemsById);
          draft.activeItemsByParentId = castDraft(activeItemsByParentId);
        },
        { runNow: true },
      ),
    [state],
  );
}
