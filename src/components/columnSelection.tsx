import { useState, type ReactElement } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useTableStructure } from '../state/context';
import { useCssVariables } from '../theme/useCssVariables';
import type { InternalColumn } from '../types';
import { FormControlLabel } from './formControlLabel';

export function ColumnSelection<T>(): ReactElement {
  const IconButton = useTheme((t) => t.components.IconButton);
  const Popover = useTheme((t) => t.components.Popover);
  const Checkbox = useTheme((t) => t.components.Checkbox);
  const Button = useTheme((t) => t.components.Button);
  const Settings = useTheme((t) => t.icons.Settings);
  const selectColumns = useTheme((t) => t.text.selectColumns);
  const resetAll = useTheme((t) => t.text.resetAll);
  const showAll = useTheme((t) => t.text.showAllColumns);
  const hideAll = useTheme((t) => t.text.hideAllColumns);
  const classes = useTheme((t) => t.classes);
  const cssVariables = useCssVariables();

  const { columns, hiddenColumns, actions } = useTableStructure<T>();

  const [anchorElement, setAnchorElement] = useState<Element | null>(null);

  const toggle = (column?: InternalColumn<T, unknown>, state?: boolean) => {
    const newValue = new Set(hiddenColumns);

    for (const columnId of column ? [column.id] : columns.map((column) => column.id)) {
      if (state ?? hiddenColumns.has(columnId)) {
        newValue.delete(columnId);
      } else {
        newValue.add(columnId);
      }
    }

    actions.setHiddenColumns(newValue);
  };

  const allVisible = columns.every((column) => !hiddenColumns.has(column.id));

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

          <div css={{ margin: '0.5em 0', display: 'flex', gap: '0.5em' }}>
            <Button variant="outlined" onClick={() => toggle(undefined, !allVisible)}>
              {allVisible ? hideAll : showAll}
            </Button>

            <Button variant="outlined" onClick={() => actions.resetTable()}>
              {resetAll}
            </Button>
          </div>

          {columns.map((column) => (
            <FormControlLabel
              key={column.id}
              control={
                <Checkbox
                  checked={!(column.hidden ?? hiddenColumns.has(column.id))}
                  onChange={() => toggle(column)}
                  disabled={column.hidden !== undefined}
                />
              }
              label={column.header}
            ></FormControlLabel>
          ))}
        </div>
      </Popover>
    </>
  );
}
