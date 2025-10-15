import { useFilter } from '../hooks/useFilter';
import { ColumnContext, useTableContext } from '../misc/tableContext';
import type { CommonFilterProps } from '../types';
import { NestedFilterControl } from './nestedFilterControl';

export interface CombinedFilterProps
  extends Pick<CommonFilterProps<any, any, any, any>, 'classNames'> {
  columnIds?: string[];
}

export default function CombinedFilter({
  columnIds: inputColumnIds,
  ...props
}: CombinedFilterProps) {
  const table = useTableContext();

  const columnIds = table.useState((state) => {
    return (
      inputColumnIds ??
      state.activeColumns
        .filter(
          (column) =>
            column.filter !== undefined && !state.visibleColumns.some((c) => c.id === column.id),
        )
        .map((column) => column.id)
    );
  });

  const isActive = table.useState((state) => {
    return columnIds.some((columnId) => {
      const filter = state.filters.get(columnId);
      const filterValue = state.filterValues.get(columnId);
      return filter !== undefined && filterValue !== undefined && filter.isActive(filterValue);
    });
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
          const impl = table.getState().filters.get(columnId);

          impl?.onChange?.(undefined);

          if (impl?.value === undefined) {
            table.update((state) => {
              state.filterValues.delete(columnId);
            });
          }
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
