import { Checkbox, FormControlLabel, IconButton, makeStyles, Popover } from '@material-ui/core';
import React, { useState } from 'react';
import { SettingsIcon } from '../misc/icons';
import { useTableContext } from '../table';
import { InternalColumn } from '../types';

const useClasses = makeStyles((theme) => ({
  list: {
    padding: theme.spacing(2),
    display: 'grid',
  },
}));

export function ColumnSelection<T>(): JSX.Element {
  const classes = useClasses();
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const state = useTableContext<T>();
  const columns = state.useState('props.columns');
  const hiddenColumns = state.useState('hiddenColumns');

  const toggle = (column: InternalColumn<T, unknown>) => {
    const {
      props: { hiddenColumns: controlledHiddenColumns, onHiddenColumnsChange },
    } = state.getState();

    const newValue = new Set(hiddenColumns);
    if (hiddenColumns.has(column.id)) newValue.delete(column.id);
    else newValue.add(column.id);

    if (!controlledHiddenColumns) {
      state.update((state) => {
        state.hiddenColumns = newValue;
      });
    }

    onHiddenColumnsChange?.(newValue);
  };

  return (
    <>
      <IconButton color="inherit" size="small" onClick={(e) => setAnchor(e.currentTarget)}>
        <SettingsIcon />
      </IconButton>

      <Popover
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorEl={anchor}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <div className={classes.list}>
          {columns.map((column) => (
            <FormControlLabel
              key={column.id}
              control={<Checkbox checked={!hiddenColumns.has(column.id)} onChange={() => toggle(column)} disabled={column.cannotHide} />}
              label={column.header}
            />
          ))}
        </div>
      </Popover>
    </>
  );
}
