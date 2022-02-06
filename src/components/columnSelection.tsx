import React, { useState } from 'react';
import { InternalColumn } from '../types';
import { useTableContext } from './table';

export function ColumnSelection<T>(): JSX.Element {
  const state = useTableContext<T>();
  const columns = state.useState('props.columns');
  const hiddenColumns = state.useState('hiddenColumns');
  const IconButton = state.useState((state) => state.theme.components.IconButton);
  const Popover = state.useState((state) => state.theme.components.Popover);
  const Checkbox = state.useState((state) => state.theme.components.Checkbox);
  const settingsIcon = state.useState((state) => state.theme.icons.settingsIcon);

  const [anchorEl, setAnchorEl] = useState<Element | null>(null);

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
      <IconButton onClick={(e) => setAnchorEl(anchorEl ? null : e.currentTarget)}>{settingsIcon}</IconButton>

      <Popover anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        <div css={{ padding: `calc(var(--spacing) * 2)`, display: 'grid' }}>
          {columns.map((column) => (
            <div key={column.id}>
              <Checkbox checked={!hiddenColumns.has(column.id)} onChange={() => toggle(column)} disabled={column.cannotHide} />
              <span>{column.header}</span>
            </div>
          ))}
        </div>
      </Popover>
    </>
  );
}
