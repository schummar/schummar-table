import { IconButton, makeStyles, Popover } from '@material-ui/core';
import { ArrowDropDown, FilterList } from '@material-ui/icons';
import React, { useState } from 'react';
import { InternalColumn, InternalTableProps, TableScope } from './table';
import { DefaultFilterComponent } from './tableFilterDefault';

export type Filter<V> = { filter(value: V): boolean; isActive(): boolean };

const useClasses = makeStyles((theme) => ({
  active: {
    background: theme.palette.primary.main,
  },
}));

export function FilterComponent<T, V>({ column, ...props }: InternalTableProps<T> & { column: InternalColumn<T, V> }) {
  const classes = useClasses();
  const filter = TableScope.useState((state) => state.filters.get(column.id), [column.id]) ?? column.defaultFilter;

  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

  if (!column.filter) return null;

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)} className={filter?.isActive() ? classes.active : undefined}>
        {filter?.isActive() ? <FilterList /> : <ArrowDropDown />}
      </IconButton>

      <Popover
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorEl={anchor}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <DefaultFilterComponent {...props} column={column} />
      </Popover>
    </>
  );
}
