import { useMemo, useRef, useState } from 'react';
import { castArray } from '../misc/helpers';
import type { FilterImplementation, Id, InternalColumn, TableItem } from '../types';

type Filter<T> = FilterImplementation<T, any, any, any>;

const isActiveFilter = (filter: Filter<any> | undefined, value: unknown) =>
  filter !== undefined && value !== undefined && filter.isActive(value);

export function useFilters<T>(activeColumns: InternalColumn<T, unknown>[], items: TableItem<T>[]) {
  const [filters, setFilters] = useState(() => new Map<Id, Filter<T>>());
  // Registration happens in effects and restoring persisted values right after them, before the
  // registration has rendered: both read this instead of `filters`.
  const registry = useRef(new Map<Id, Filter<T>>());
  const [internalValues, setInternalValues] = useState(() => new Map<Id, unknown>());
  const [controlledValues, setControlledValues] = useState(() => new Map<Id, unknown>());
  // Restored from storage before the filter it belongs to has registered.
  const pendingValues = useRef(new Map<Id, unknown>());

  const filterValues = useMemo(() => {
    if (controlledValues.size === 0) return internalValues;
    const merged = new Map(internalValues);
    for (const [columnId, value] of controlledValues) merged.set(columnId, value);
    return merged;
  }, [internalValues, controlledValues]);

  /** Ids of matching items and of all their ancestors; undefined when no filter is active. */
  const matching = useMemo(() => {
    const active = activeColumns.flatMap((column) => {
      const filter = filters.get(column.id);
      const value = filterValues.get(column.id);
      if (!filter || filter.external || !isActiveFilter(filter, value)) return [];
      return [{ column, filter, value, filterBy: filter.filterBy ?? ((x: unknown) => x) }];
    });

    if (active.length === 0) return undefined;

    const result = new Set<Id>();
    // Children come after their parent, so walking backwards sees descendants first.
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i]!;
      const isMatch =
        result.has(item.id) ||
        active.every(({ column, filter, value, filterBy }) =>
          castArray(filterBy(column.value(item.value), item.value)).some((x) =>
            filter.test(value, x),
          ),
        );

      if (isMatch) {
        result.add(item.id);
        if (item.parentId !== undefined && item.parentId !== null) result.add(item.parentId);
      }
    }
    return result;
  }, [activeColumns, filters, filterValues, items]);

  const hasActiveFilters = useMemo(
    () =>
      activeColumns.some((column) =>
        isActiveFilter(filters.get(column.id), filterValues.get(column.id)),
      ),
    [activeColumns, filters, filterValues],
  );

  return {
    filters,
    setFilters,
    registry,
    filterValues,
    setInternalValues,
    setControlledValues,
    pendingValues,
    matching,
    hasActiveFilters,
  };
}
