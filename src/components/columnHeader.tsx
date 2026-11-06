import type { ReactElement } from 'react';
import { columnTheme, useTheme } from '../hooks/useTheme';
import { useColumnContext, useTableStructure } from '../state/context';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';
import { useColumnDrag } from './columnDrag';
import { FilterControl } from './filterControl';
import { HiddenColumnFilters } from './hiddenColumnFilters';
import { ResizeHandle } from './resizeHandle';
import { SortComponent } from './sortComponent';

export function ColumnHeader(): ReactElement {
  const columnId = useColumnContext();
  const { props, activeColumns, visibleColumns } = useTableStructure();
  const column = activeColumns.find((column) => column.id === columnId);
  const { classes, styles } = useTheme((theme) => columnTheme(theme, column));
  const onPointerDown = useColumnDrag(columnId);

  return (
    <div
      data-column-header=""
      className={classes?.headerCell}
      css={[
        defaultClasses.headerCell,
        { position: 'relative', userSelect: 'none' },
        styles?.headerCell,
      ]}
      onPointerDown={onPointerDown}
    >
      <SortComponent>{column?.header}</SortComponent>
      <div css={{ flex: 1 }} />
      <FilterControl />
      {props.enableHiddenColumnFilters &&
        visibleColumns[visibleColumns.length - 1]?.id === columnId && <HiddenColumnFilters />}
      <ResizeHandle />
    </div>
  );
}
