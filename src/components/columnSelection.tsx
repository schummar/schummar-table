import { useContext, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { TableResetContext, useTableContext } from '../misc/tableContext';
import { useCssVariables } from '../theme/useCssVariables';
import type { InternalColumn } from '../types';
import { FormControlLabel } from './formControlLabel';

export function ColumnSelection<T>(): JSX.Element {
  const IconButton = useTheme((t) => t.components.IconButton);
  const Popover = useTheme((t) => t.components.Popover);
  const Checkbox = useTheme((t) => t.components.Checkbox);
  const Button = useTheme((t) => t.components.Button);
  const Settings = useTheme((t) => t.icons.Settings);
  const selectColumns = useTheme((t) => t.text.selectColumns);
  const resetAll = useTheme((t) => t.text.resetAll);
  const classes = useTheme((t) => t.classes);
  const cssVariables = useCssVariables();

  const table = useTableContext<T>();
  const reset = useContext(TableResetContext);
  const columns = table.useState('props.columns');
  const hiddenColumns = table.useState('hiddenColumns');

  const [anchorElement, setAnchorElement] = useState<Element | null>(null);

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
      <IconButton onClick={(event) => setAnchorElement(anchorElement ? null : event.currentTarget)}>
        <Settings />
      </IconButton>

      <Popover
        anchorEl={anchorElement}
        open={!!anchorElement}
        onClose={() => setAnchorElement(null)}
        css={cssVariables}
        className={classes?.popover}
        backdropClassName={classes?.popoverBackdrop}
      >
        <div css={{ padding: `calc(var(--spacing) * 2)`, display: 'grid' }}>
          <div css={{ marginBottom: 'var(--spacing)' }}>{selectColumns}</div>

          {columns.map((column) => (
            <FormControlLabel
              key={column.id}
              control={
                <Checkbox
                  checked={!hiddenColumns.has(column.id)}
                  onChange={() => toggle(column)}
                  disabled={column.cannotHide}
                />
              }
              label={column.header}
            ></FormControlLabel>
          ))}

          <Button variant="outlined" onClick={reset}>
            {resetAll}
          </Button>
        </div>
      </Popover>
    </>
  );
}
