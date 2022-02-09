import React, { useState } from 'react';
import { useTheme } from '..';
import { useCssVariables } from '../theme/useCssVariables';
import { InternalColumn } from '../types';
import { FormControlLabel } from './formControlLabel';
import { useTableContext } from './table';

export function ColumnSelection<T>(): JSX.Element {
  const {
    components: { IconButton, Popover, Checkbox },
    icons: { Settings },
    text,
  } = useTheme();
  const cssVariables = useCssVariables();

  const table = useTableContext<T>();
  const columns = table.useState('props.columns');
  const hiddenColumns = table.useState('hiddenColumns');

  const [anchorEl, setAnchorEl] = useState<Element | null>(null);

  const toggle = (column: InternalColumn<T, unknown>) => {
    const {
      props: { hiddenColumns: controlledHiddenColumns, onHiddenColumnsChange },
    } = table.getState();

    const newValue = new Set(hiddenColumns);
    if (hiddenColumns.has(column.id)) newValue.delete(column.id);
    else newValue.add(column.id);

    if (!controlledHiddenColumns) {
      table.update((state) => {
        state.hiddenColumns = newValue;
      });
    }

    onHiddenColumnsChange?.(newValue);
  };

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(anchorEl ? null : e.currentTarget)}>
        <Settings />
      </IconButton>

      <Popover anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)} css={cssVariables}>
        <div css={{ padding: `calc(var(--spacing) * 2)`, display: 'grid', gap: 'var(--spacing)' }}>
          <div css={{ marginBottom: 'var(--spacing)' }}>{text.selectColumns}</div>

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
