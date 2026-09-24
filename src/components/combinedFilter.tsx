import { useFilter } from '../hooks/useFilter';
import { useMemo } from 'react';
import { ColumnContext, useTableStructure } from '../state/context';
import type { CommonFilterProps } from '../types';
import { NestedFilterControl } from './nestedFilterControl';

export interface CombinedFilterProps extends Pick<
  CommonFilterProps<any, any, any, any>,
  'classNames'
> {
  columnIds?: string[];
}

export default function CombinedFilter({
  columnIds: inputColumnIds,
  ...props
}: CombinedFilterProps) {
  const { activeColumns, visibleColumns, filters, filterValues, actions } = useTableStructure();

  const columnIds = useMemo(
    () =>
      inputColumnIds ??
      activeColumns
        .filter(
          (column) =>
            column.filter !== undefined && !visibleColumns.some((c) => c.id === column.id),
        )
        .map((column) => column.id),
    [inputColumnIds, activeColumns, visibleColumns],
  );

  const isActive = columnIds.some((columnId) => {
    const filter = filters.get(columnId);
    const filterValue = filterValues.get(columnId);
    return filter !== undefined && filterValue !== undefined && filter.isActive(filterValue);
  });

  useFilter({
    ...props,

    id: 'combinedFilter',

    value: isActive,

    isActive(filterValue) {
      return filterValue;
    },

    test() {
      return true;
    },

    onChange(value) {
      if (value === undefined) {
        for (const columnId of columnIds) {
          actions.setFilterValue(columnId, undefined);
        }
      }
    },
  });

  return (
    <div>
      {columnIds.map((columnId) => (
        <ColumnContext.Provider key={columnId} value={columnId}>
          <NestedFilterControl />
        </ColumnContext.Provider>
      ))}
    </div>
  );
}
