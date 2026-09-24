import type { ReactElement } from 'react';
import { columnTheme, useTheme } from '../hooks/useTheme';
import { useColumnContext, useTableStructure } from '../state/context';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';
import { FilterControl } from './filterControl';
import { ResizeHandle } from './resizeHandle';
import { SortComponent } from './sortComponent';

export function ColumnHeader(): ReactElement {
  const columnId = useColumnContext();
  const { activeColumns } = useTableStructure();
  const column = activeColumns.find((column) => column.id === columnId);
  const { classes, styles } = useTheme((theme) => columnTheme(theme, column));

  return (
    <div
      data-column-header=""
      className={classes?.headerCell}
      css={[
        defaultClasses.headerCell,
        { position: 'relative', userSelect: 'none' },
        styles?.headerCell,
      ]}
    >
      <SortComponent>{column?.header}</SortComponent>
      <div css={{ flex: 1 }} />
      <FilterControl />
      <ResizeHandle />
    </div>
  );
}
