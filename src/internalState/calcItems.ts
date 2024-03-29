import { castDraft } from 'immer';
import { useEffect } from 'react';
import type { Store } from 'schummar-state/react';
import { castArray, flatMap, orderBy } from '../misc/helpers';
import type { Id, InternalTableState, TableItem } from '../types';

export function calcItems<T>(state: Store<InternalTableState<T>>): void {
  useEffect(
    () =>
      state.addReaction(
        (state) =>
          [
            state.props.items,
            state.props.id,
            state.props.parentId,
            state.props.revealFiltered,
            state.props.externalSort,
            state.sort,
            state.filters,
            state.filterValues,
            state.activeColumns,
            state.expanded,
          ] as const,
        (
          [
            items = [],
            id,
            parentId,
            revealFiltered,
            externalSort,
            sort,
            filters,
            filterValues,
            activeColumns,
          ],
          draft,
        ) => {
          const tableItems = items.map<TableItem<T>>((item) => ({
            id: id(item),
            parentId: parentId?.(item),
            children: [],
            value: item,
          }));

          let sorted;
          if (sort.length === 0 || externalSort) {
            sorted = tableItems;
          } else {
            const selectors = flatMap(sort, (sort) => {
              const column = activeColumns.find((column) => column.id === sort.columnId);
              if (!column) return [];
              return column.sortBy.map((sortBy) => ({
                selector: (item: T) => sortBy(column.value(item), item),
                direction: sort.direction,
              }));
            }).filter(Boolean);

            sorted = orderBy(
              tableItems,
              selectors.map((x) => (item) => x.selector(item.value)),
              selectors.map((x) => x.direction),
            );
          }

          const lookup = new Map<Id, TableItem<T>>();
          for (const item of sorted) {
            lookup.set(item.id, item);
          }

          for (const item of sorted) {
            const parent =
              item.parentId !== undefined && item.parentId !== null
                ? lookup.get(item.parentId)
                : undefined;
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
          traverse(sorted.filter((item) => item.parentId === undefined || item.parentId === null));

          let expandedChanged = false;
          const activeItemsById = new Map<Id, TableItem<T>>();
          const activeSet = new Set<Id>();
          const activeItems = [...allItems]
            .reverse()
            .filter((item) => {
              let isActive = activeSet.has(item.id);

              isActive ||= activeColumns.every((column) => {
                const filter = filters.get(column.id);
                if (!filter || filter.external) return true;

                const filterValue = filterValues.get(column.id);
                if (filterValue === undefined || !filter.isActive(filterValue)) return true;

                const filterBy = filter.filterBy ?? ((x) => x);
                const value = filterBy(column.value(item.value), item.value);
                return castArray(value).some((value) => filter.test(filterValue, value));
              });

              if (isActive && item.parentId !== undefined && item.parentId !== null) {
                if (
                  revealFiltered &&
                  Array.from(filters.entries()).some(([id, filter]) => {
                    const filterValue = filterValues.get(id);
                    return !!filter && filterValue !== undefined && filter.isActive(filterValue);
                  })
                ) {
                  expandedChanged ||= !draft.expanded.has(item.parentId);
                  draft.expanded.add(item.parentId);
                } else if (!draft.expanded.has(item.parentId)) {
                  isActive = false;
                }
              }

              if (isActive && item.parentId !== undefined && item.parentId !== null) {
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

          if (expandedChanged) {
            setTimeout(() => {
              state.getState().props.onExpandedChange?.(state.getState().expanded);
            });
          }
        },
        { runNow: true },
      ),
    [state],
  );
}
