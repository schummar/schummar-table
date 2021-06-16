import { Checkbox, FormControlLabel, IconButton, Popover, styled } from '@material-ui/core';
import { Settings } from '@material-ui/icons';
import React, { useState } from 'react';
import { useTableContext } from '../table';
import { InternalColumn } from '../types';

const List = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'grid',
}));

export function ColumnSelection<T>(): JSX.Element {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const state = useTableContext<T>();
  const columns = state.useState('props.columns');
  const isHidden = state.useState('isHidden');

  const toggle = (column: InternalColumn<T, unknown>) => {
    const newValue = !isHidden.get(column.id);

    if (column.isHidden === undefined) {
      state.update((state) => {
        state.isHidden.set(column.id, newValue);
      });
    }

    column.onIsHiddenChange?.(newValue);
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
              control={<Checkbox checked={!isHidden.get(column.id)} onChange={() => toggle(column)} />}
              label={column.header}
            />
          ))}
        </List>
      </Popover>
    </>
  );
}
