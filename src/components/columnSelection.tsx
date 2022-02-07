import React, { useState } from 'react';
import { useCssVariables } from '../theme/useCssVariables';
import { InternalColumn } from '../types';
import { FormControlLabel } from './formControlLabel';
import { useTableContext } from './table';

export function ColumnSelection<T>(): JSX.Element {
  const state = useTableContext<T>();
  const columns = state.useState('props.columns');
  const hiddenColumns = state.useState('hiddenColumns');
  const IconButton = state.useState((state) => state.theme.components.IconButton);
  const Popover = state.useState((state) => state.theme.components.Popover);
  const Checkbox = state.useState((state) => state.theme.components.Checkbox);
  const SettingsIcon = state.useState((state) => state.theme.icons.Settings);
  const selectColumnsText = state.useState((state) => state.theme.text.selectColumns);
  const cssVariables = useCssVariables();

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
      <IconButton onClick={(e) => setAnchorEl(anchorEl ? null : e.currentTarget)}>
        <SettingsIcon />
      </IconButton>

      <Popover anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)} css={cssVariables}>
        <div css={{ padding: `calc(var(--spacing) * 2)`, display: 'grid', gap: 'var(--spacing)' }}>
          <div css={{ marginBottom: 'var(--spacing)' }}>{selectColumnsText}</div>

          {columns.map((column) => (
            <FormControlLabel
              key={column.id}
              control={<Checkbox checked={!hiddenColumns.has(column.id)} onChange={() => toggle(column)} disabled={column.cannotHide} />}
              label={column.header}
            ></FormControlLabel>
          ))}
        </div>
      </Popover>
    </>
  );
}
