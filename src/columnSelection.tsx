import { Checkbox, FormControlLabel, IconButton, Popover, styled } from '@material-ui/core';
import { Settings } from '@material-ui/icons';
import React, { useState } from 'react';
import { useTableContext } from './table';
import { InternalColumn } from './types';

const List = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'grid',
}));

export function ColumnSelection<T>(): JSX.Element {
  const {
    state,
    props: { columns, activeColumns },
  } = useTableContext<T>();
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

  const toggle = (column: InternalColumn<T, unknown>) => {
    const newValue = !activeColumns.includes(column);

    if (column.visible === undefined) {
      state.update((state) => {
        state.visible.set(column.id, newValue);
      });
    }

    column.onVisibleChange?.(newValue);
  };

  return (
    <>
      <IconButton color="inherit" onClick={(e) => setAnchor(e.currentTarget)}>
        <Settings />
      </IconButton>

      <Popover
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorEl={anchor}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <List>
          {columns.map((column) => (
            <FormControlLabel
              key={column.id}
              control={<Checkbox checked={activeColumns.includes(column)} onChange={() => toggle(column)} />}
              label={column.header}
            />
          ))}
        </List>
      </Popover>
    </>
  );
}
