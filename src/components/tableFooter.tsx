import { memo } from 'react';
import { useTheme } from '../hooks/useTheme';
import { ColumnContext, useTableStructure } from '../state/context';
import { filteredColumns, isActiveFilter } from '../state/useFilters';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';
import ClearFiltersButton from './clearFiltersButton';
import { ColumnFooter } from './columnFooter';

// Memoized so that rendering the rows (e.g. on selection) leaves it alone.
export const TableFooter = memo(function TableFooter() {
  const { props, visibleColumns, activeColumns, filterValues } = useTableStructure();
  const classes = useTheme((t) => t.classes?.footerCell);
  const styles = useTheme((t) => t.styles?.footerCell);
  const { stickyFooter, enableClearFiltersButton } = props;

  const hasActiveFilters = filteredColumns(props, visibleColumns).some((column) =>
    isActiveFilter(column.filter, filterValues.get(column.id)),
  );
  const hasFooter = activeColumns.some((column) => column.footer);

  return (
    <>
      {enableClearFiltersButton && hasActiveFilters && <ClearFiltersButton />}

      {hasFooter && (
        <div
          css={[
            { gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'subgrid' },
            stickyFooter && defaultClasses.stickyBottom,
            stickyFooter instanceof Object && stickyFooter,
          ]}
        >
          <div className={classes} css={[defaultClasses.footerFill, styles]} />
          <div className={classes} css={[defaultClasses.footerFill, styles]} />

          {visibleColumns.map((column) => (
            <ColumnContext.Provider key={column.id} value={column.id}>
              <ColumnFooter />
            </ColumnContext.Provider>
          ))}

          <div className={classes} css={[defaultClasses.footerFill, styles]} />
        </div>
      )}
    </>
  );
});
