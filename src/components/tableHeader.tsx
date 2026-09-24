import { memo } from 'react';
import { useTheme } from '../hooks/useTheme';
import { ColumnContext, useTableStructure } from '../state/context';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';
import { ColumnHeader } from './columnHeader';
import { ColumnSelection } from './columnSelection';
import { Export } from './export';
import { ResizeHandleView } from './resizeHandle';
import { SelectAll } from './selectComponent';

// Memoized so that rendering the rows (e.g. on selection) leaves it alone.
export const TableHeader = memo(function TableHeader() {
  const { props, visibleColumns } = useTableStructure();
  const classes = useTheme((t) => t.classes?.headerCell);
  const styles = useTheme((t) => t.styles?.headerCell);
  const { stickyHeader, enableSelection, enableColumnSelection, enableExport } = props;

  return (
    <div
      css={[
        { gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'subgrid' },
        stickyHeader && defaultClasses.sticky,
        stickyHeader instanceof Object && stickyHeader,
      ]}
    >
      <div className={classes} css={[defaultClasses.headerFill, styles]} />

      <div className={classes} css={[defaultClasses.headerCell, styles]}>
        {enableSelection && <SelectAll />}
        {enableColumnSelection && <ColumnSelection />}
        {enableExport && <Export />}

        {(enableSelection || enableColumnSelection || enableExport) && (
          <>
            <div css={{ flex: 1 }} />
            <ResizeHandleView />
          </>
        )}
      </div>

      {visibleColumns.map((column) => (
        <ColumnContext.Provider key={column.id} value={column.id}>
          <ColumnHeader />
        </ColumnContext.Provider>
      ))}

      <div className={classes} css={[defaultClasses.headerFill, styles]} />
    </div>
  );
});
