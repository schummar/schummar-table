import React, { useState } from 'react';
import { useCssVariables } from '../theme/useCssVariables';
import { useColumnContext, useTableContext } from './table';

export type Filter<T> = { filter(item: T): boolean };

export function FilterComponent<T>(): JSX.Element | null {
  const state = useTableContext<T>();
  const columnId = useColumnContext();
  const isActive = state.useState((state) => !!state.filters.get(columnId), [columnId]);
  const filterComponent = state.useState((state) => state.activeColumns.find((column) => column.id === columnId)?.filterComponent);
  const IconButton = state.useState((state) => state.theme.components.IconButton);
  const Popover = state.useState((state) => state.theme.components.Popover);
  const FilterListIcon = state.useState((state) => state.theme.icons.FilterList);
  const ArrowDropDownIcon = state.useState((state) => state.theme.icons.ArrowDropDown);
  const cssVariables = useCssVariables();

  const [anchor, setAnchor] = useState<Element | null>(null);

  if (!filterComponent) return null;

  return (
    <>
      <IconButton onClick={(e) => setAnchor(e.currentTarget)} css={[isActive && { background: 'var(--primaryColor)' }]}>
        {isActive ? <FilterListIcon /> : <ArrowDropDownIcon />}
      </IconButton>

      <Popover open={!!anchor} onClose={() => setAnchor(null)} anchorEl={anchor} css={cssVariables}>
        {filterComponent}
      </Popover>
    </>
  );
}
