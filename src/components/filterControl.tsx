import React, { useState } from 'react';
import { useCssVariables } from '../theme/useCssVariables';
import { useColumnContext, useTableContext } from './table';

export function FilterControl<T>(): JSX.Element | null {
  const state = useTableContext<T>();
  const columnId = useColumnContext();
  const isActive = state.useState((state) => !!state.filters.get(columnId)?.test);
  const filter = state.useState((state) => state.activeColumns.find((column) => column.id === columnId)?.filter);
  const IconButton = state.useState((state) => state.theme.components.IconButton);
  const Popover = state.useState((state) => state.theme.components.Popover);
  const FilterListIcon = state.useState((state) => state.theme.icons.FilterList);
  const ArrowDropDownIcon = state.useState((state) => state.theme.icons.ArrowDropDown);
  const cssVariables = useCssVariables();

  const [anchor, setAnchor] = useState<Element | null>(null);

  if (!filter) return null;

  return (
    <>
      <IconButton
        onClick={(e) => setAnchor(e.currentTarget)}
        css={[isActive && { color: 'white !important', backgroundColor: 'var(--primary) !important' }]}
      >
        {isActive ? <FilterListIcon /> : <ArrowDropDownIcon />}
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
