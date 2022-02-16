import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useCssVariables } from '../theme/useCssVariables';
import { useColumnContext, useTableContext } from './table';

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

  if (!filter) return null;

  return (
    <>
      <IconButton
        onClick={(e) => setAnchor(e.currentTarget)}
        css={[isActive && { color: 'white !important', backgroundColor: 'var(--primary) !important' }]}
      >
        {isActive ? <FilterList /> : <ArrowDropDown />}
      </IconButton>

      <div
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
        }}
      >
        <Popover open={!!anchor} onClose={() => setAnchor(null)} anchorEl={anchor} css={cssVariables}>
          {filter}
        </Popover>
      </div>
    </>
  );
}
