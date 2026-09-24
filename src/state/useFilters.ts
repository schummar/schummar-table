import { useMemo } from 'react';
import type { Filter, Id, InternalColumn, InternalTableProps, TableItem } from '../types';
import { useControllableState } from './useControllableState';

export const isActiveFilter = (filter: Filter<any, any> | undefined, value: unknown) =>
  filter !== undefined &&
  value !== undefined &&
  value !== null &&
  filter.isActive(value, filter.options);

/** Columns whose filters apply: the visible ones, or all with `enableHiddenColumnFilters`. */
export function filteredColumns<T>(
  props: InternalTableProps<T>,
  visibleColumns: InternalColumn<T, unknown>[],
) {
  return props.enableHiddenColumnFilters ? props.columns : visibleColumns;
}

/** Adds controlled values and defaults. Returns `stored` itself when there are none. */
// Outside the hook: React Compiler miscompiles the reassigned `result` into a memo that never hits.
function withFilterDefaults(stored: Map<Id, unknown>, columns: InternalColumn<any, unknown>[]) {
  let result = stored;
  for (const { id, filter } of columns) {
    const value =
      filter?.value !== undefined || stored.has(id) ? filter?.value : filter?.defaultValue;
    if (value === undefined) continue;
    if (result === stored) result = new Map(stored);
    result.set(id, value);
  }
  return result;
}

export function useFilters<T>(
  props: InternalTableProps<T>,
  visibleColumns: InternalColumn<T, unknown>[],
  items: TableItem<T>[],
) {
  const [stored, setFilterValues, setFilterValuesInternal] = useControllableState(
    props.filterValues,
    () => props.defaultFilterValues ?? new Map<Id, unknown>(),
    props.onFilterValuesChange,
  );

  const filterValues = useMemo(
    () => withFilterDefaults(stored, props.columns),
    [stored, props.columns],
  );

  const applied = filteredColumns(props, visibleColumns);

  /** Ids of matching items and of all their ancestors; undefined when no filter is active. */
  const matching = useMemo(() => {
    const active = applied.flatMap((column) => {
      const { filter } = column;
      const value = filterValues.get(column.id);
      if (!filter || filter.external || !isActiveFilter(filter, value)) return [];
      return [{ column, filter, value }];
    });

    if (active.length === 0) return undefined;

    const result = new Set<Id>();
    // Children come after their parent, so walking backwards sees descendants first.
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i]!;
      const isMatch =
        result.has(item.id) ||
        active.every(({ column, filter, value }) =>
          filter.test(value, column.filterBy(column.value(item.value), item.value), filter.options),
        );

      if (isMatch) {
        result.add(item.id);
        if (item.parentId !== undefined && item.parentId !== null) result.add(item.parentId);
      }
    }
    return result;
  }, [applied, filterValues, items]);

  return { stored, filterValues, setFilterValues, setFilterValuesInternal, matching };
}
