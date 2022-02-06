import { IconButton, Popover } from '@material-ui/core';
import { ArrowDropDown, FilterList } from '@material-ui/icons';
import React, { useState } from 'react';
import { useColumnContext, useTableContext } from './table';

export type Filter<T> = { filter(item: T): boolean };

export function FilterComponent<T>(): JSX.Element | null {
  const state = useTableContext<T>();
  const columnId = useColumnContext();
  const isActive = state.useState((state) => !!state.filters.get(columnId), [columnId]);
  const filterComponent = state.useState((state) => state.activeColumns.find((column) => column.id === columnId)?.filterComponent);
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

  if (!filterComponent) return null;

  return (
    <>
      <IconButton
        size="small"
        color="inherit"
        onClick={(e) => setAnchor(e.currentTarget)}
        css={[isActive && { background: 'var(--primaryColor)' }]}
      >
        {isActive ? <FilterList /> : <ArrowDropDown />}
      </IconButton>

      <Popover
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorEl={anchor}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        {filterComponent}
      </Popover>
    </>
  );
}
