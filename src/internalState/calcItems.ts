import { castDraft } from 'immer';
import { useEffect } from 'react';
import { Store } from 'schummar-state/react';
import { flatMap, orderBy } from '../misc/helpers';
import { Id, InternalTableState, TableItem } from '../types';

export function calcItems<T>(state: Store<InternalTableState<T>>): void {
  useEffect(
    () =>
      state.addReaction(
        (state) =>
          [
            state.props.items,
            state.props.id,
            state.props.parentId,
            state.sort,
            state.filters,
            state.activeColumns,
            state.expanded,
          ] as const,
        ([items, id, parentId, sort, filters, activeColumns, expanded], draft) => {
          const tableItems = items.map<TableItem<T>>((item) => ({
            ...item,
            id: id(item),
            parentId: parentId?.(item),
            children: [],
          }));

          let sorted;
          if (sort.length === 0) {
            sorted = tableItems;
          } else {
            const selectors = flatMap(sort, (sort) => {
              const column = activeColumns.find((column) => column.id === sort.columnId);
              if (!column) return [];
              const sortBy = column.sortBy instanceof Array ? column.sortBy : [column.sortBy];
              return sortBy.map((sortBy) => ({ selector: (item: T) => sortBy(column.value(item), item), direction: sort.direction }));
            }).filter(Boolean);

            sorted = orderBy(
              tableItems,
              selectors.map((x) => x.selector),
              selectors.map((x) => x.direction),
            );
          }

          const lookup = new Map<Id, TableItem<T>>();
          for (const item of sorted) {
            lookup.set(item.id, item);
          }

          for (const item of sorted) {
            const parent = item.parentId !== undefined ? lookup.get(item.parentId) : undefined;
            parent?.children.push(item);
          }

          const allItems = new Array<TableItem<T>>();
          const allItemsById = new Map<Id, TableItem<T>>();

          const traverse = (items: TableItem<T>[]): void => {
            for (const item of items) {
              allItems.push(item);
              allItemsById.set(item.id, item);
              traverse(item.children);
            }
          };
          traverse(sorted.filter((item) => item.parentId === undefined));

          const activeItemsById = new Map<Id, TableItem<T>>();
          const activeSet = new Set<Id>();
          const activeItems = [...allItems]
            .reverse()
            .filter((item) => {
              let isActive = activeSet.has(item.id);

              isActive ||=
                (item.parentId === undefined || expanded.has(item.parentId)) &&
                activeColumns.every((column) => {
                  const filter = filters.get(column.id);
                  return filter?.filter(item) ?? true;
                });

              if (isActive && item.parentId !== undefined) {
                activeSet.add(item.parentId);
              }
              if (isActive) {
                activeItemsById.set(item.id, item);
              }
              return isActive;
            })
            .reverse();

          draft.items = castDraft(allItems);
          draft.itemsById = castDraft(allItemsById);
          draft.activeItems = castDraft(activeItems);
          draft.activeItemsById = castDraft(activeItemsById);
        },
        { runNow: true },
      ),
    [state],
  );
}
