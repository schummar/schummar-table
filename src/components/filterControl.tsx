import React, { createContext, useCallback, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useCssVariables } from '../theme/useCssVariables';
import { useColumnContext, useTableContext } from './table';

export const FilterControlContext = createContext((): void => void 0);

export function FilterControl<T>(): JSX.Element | null {
  const table = useTableContext<T>();
  const columnId = useColumnContext();
  const {
    components: { IconButton, Popover },
    icons: { FilterList, ArrowDropDown },
  } = useTheme();
  const cssVariables = useCssVariables();

  const [anchor, setAnchor] = useState<Element | null>(null);
  const isActive = table.useState((state) => {
    const filter = state.filters.get(columnId);
    const filterValue = state.filterValues.get(columnId);
    return filter !== undefined && filterValue !== undefined && filter.isActive(filterValue);
  });
  const filter = table.useState((state) => state.activeColumns.find((column) => column.id === columnId)?.filter);

  function reset() {
    table.update((state) => {
      state.filterValues.delete(columnId);
    });
  }

  const close = useCallback(function () {
    setAnchor(null);
  }, []);

  if (!filter) return null;

  return (
    <FilterControlContext.Provider value={close}>
      <div
        onClick={(e) => setAnchor(e.currentTarget)}
        onContextMenu={(e) => {
          reset();
          e.preventDefault();
          return false;
        }}
      >
        <IconButton css={[isActive && { color: 'white !important', backgroundColor: 'var(--primaryMain) !important' }]}>
          {isActive ? <FilterList /> : <ArrowDropDown />}
        </IconButton>
      </div>

      <div
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
        }}
      >
        <Popover open hidden={!anchor} onClose={() => setAnchor(null)} anchorEl={anchor ?? document.body} css={cssVariables}>
          {filter}
        </Popover>
      </div>
    </FilterControlContext.Provider>
  );
}
