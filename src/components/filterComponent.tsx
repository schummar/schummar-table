import { IconButton, makeStyles, Popover } from '@material-ui/core';
import { ArrowDropDown, FilterList } from '@material-ui/icons';
import React, { useState } from 'react';
import { useColumnContext, useTableContext } from '../table';

export type Filter<V> = { filter(value: V, stringValue: string): boolean; isActive(): boolean };

const useClasses = makeStyles((theme) => ({
  active: {
    background: theme.palette.primary.main,
  },
}));

export function FilterComponent<T, V>(): JSX.Element | null {
  const state = useTableContext<T>();
  const column = useColumnContext<T, V>();
  const classes = useClasses();
  const isActive = state.useState((state) => state.filters.get(column.id)?.isActive(), [column.id]);
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

  if (!column.filterComponent) return null;

  return (
    <>
      <IconButton
        size="small"
        color="inherit"
        onClick={(e) => setAnchor(e.currentTarget)}
        className={isActive ? classes.active : undefined}
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
        {column.filterComponent}
      </Popover>
    </>
  );
}
