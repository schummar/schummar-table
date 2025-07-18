import { memo, useEffect, useLayoutEffect, useState } from 'react';
import { TableMemoContextProvider } from '../hooks/useTableMemo';
import { useTheme } from '../hooks/useTheme';
import { useTableStateStorage } from '../internalState/tableStateStorage';
import { useTableState } from '../internalState/useTableState';
import {
  ColumnContext,
  TableContext,
  TableResetContext,
  useTableContext,
} from '../misc/tableContext';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';
import { useCssVariables } from '../theme/useCssVariables';
import type { TableProps } from '../types';
import ClearFiltersButton from './clearFiltersButton';
import { ColumnFooter } from './columnFooter';
import { ColumnHeader, ColumnHeaderContext } from './columnHeader';
import { ColumnSelection } from './columnSelection';
import { Export } from './export';
import CombinedFilter from './combinedFilter';
import { ResizeHandleView } from './resizeHandle';
import { Row } from './row';
import { SelectComponent } from './selectComponent';
import { Virtualized } from './virtualized';

export function Table<T>(props: TableProps<T>): JSX.Element {
  const [table, resetState] = useTableState(props);
  const [isHydrated, clearStorage] = useTableStateStorage(table);

  async function reset() {
    await clearStorage();
    resetState();
  }

  useLayoutEffect(() => table.getState().props.debugRender?.('render table'));

  return (
    <TableContext.Provider value={table}>
      <TableResetContext.Provider value={reset}>
        <TableMemoContextProvider>
          <TableLoadingState isHydrated={isHydrated} />
        </TableMemoContextProvider>
      </TableResetContext.Provider>
    </TableContext.Provider>
  );
}

function TableLoadingState({ isHydrated }: { isHydrated: boolean }) {
  const loadingText = useTheme((t) => t.text.loading);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setShowLoading(true), 500);
    return () => clearTimeout(handle);
  });

  return (
    <>
      {!isHydrated && showLoading && <div>{loadingText}</div>}
      <TableInner hidden={!isHydrated} />
    </>
  );
}

const TableInner = memo(function TableInner<T>({ hidden }: { hidden: boolean }) {
  const table = useTableContext<T>();
  const fullWidth = table.useState((state) => state.props.fullWidth);

  const visibleColumns = table.useState((state) =>
    state.visibleColumns.map((column) => ({
      id: column.id,
      width: column.width,
      classes: column.classes,
      styles: column.styles,
      footer: column.footer,
    })),
  );

  const hasActiveFilters = table.useState((state) => {
    return state.activeColumns.some((column) => {
      const filter = state.filters.get(column.id);
      const filterValue = state.filterValues.get(column.id);
      return filter !== undefined && filterValue !== undefined && filter.isActive(filterValue);
    });
  });
  const columnWidths = table.useState((state) => state.columnWidths, { throttle: 16 });
  const hasFooter = table.useState((state) => state.activeColumns.some((column) => column.footer));

  const classes = useTheme((theme) => theme.classes);
  const styles = useTheme((theme) => theme.styles);
  const stickyHeader = table.useState((state) => state.props.stickyHeader);
  const stickyFooter = table.useState((state) => state.props.stickyFooter);

  const enableSelection = table.useState((state) => state.props.enableSelection);
  const enableColumnSelection = table.useState((state) =>
    Array.isArray(state.props.enableColumnSelection)
      ? !state.displaySize || state.props.enableColumnSelection.includes(state.displaySize)
      : state.props.enableColumnSelection,
  );
  const enableExport = table.useState((state) =>
    typeof state.props.enableExport === 'object' && !('exporters' in state.props.enableExport)
      ? !state.displaySize || !!state.props.enableExport[state.displaySize]
      : !!state.props.enableExport,
  );
  const cssVariables = useCssVariables();

  const enableClearFiltersButton = table.useState((state) => state.props.enableClearFiltersButton);

  useLayoutEffect(() => table.getState().props.debugRender?.('render table inner'));

  return (
    <Virtualized
      className={classes?.table}
      css={[cssVariables, defaultClasses.table, styles?.table, hidden && { visibility: 'hidden' }]}
      style={{
        gridTemplateColumns: [
          //
          fullWidth === 'right' || fullWidth === true ? 'auto' : '0',
          'max-content',
          ...visibleColumns.map(
            (column) => columnWidths.get(column.id) ?? column.width ?? 'max-content',
          ),
          fullWidth === 'left' || fullWidth === true ? 'auto' : '0',
        ].join(' '),
      }}
      header={
        <>
          <div
            className={classes?.headerCell}
            css={[
              { gridColumn: 1 },
              defaultClasses.headerFill,
              stickyHeader && defaultClasses.sticky,
              stickyHeader instanceof Object && stickyHeader,
              styles?.headerCell,
            ]}
          />

          <div
            className={classes?.headerCell}
            css={[
              { gridColumn: 2 },
              defaultClasses.headerCell,
              stickyHeader && defaultClasses.sticky,
              stickyHeader instanceof Object && stickyHeader,
              styles?.headerCell,
            ]}
          >
            {enableSelection && <SelectComponent />}

            {enableColumnSelection && <ColumnSelection />}

            {enableExport && <Export />}

            {(enableSelection || enableColumnSelection || enableExport) && (
              <>
                <div css={{ flex: 1 }} />
                <ResizeHandleView />
              </>
            )}
          </div>

          <ColumnHeaderContext.Provider>
            {visibleColumns.map((column) => (
              <ColumnContext.Provider key={column.id} value={column.id}>
                <ColumnHeader />
              </ColumnContext.Provider>
            ))}
          </ColumnHeaderContext.Provider>

          <div
            className={classes?.headerCell}
            css={[
              defaultClasses.headerFill,
              stickyHeader && defaultClasses.sticky,
              stickyHeader instanceof Object && stickyHeader,
              styles?.headerCell,
            ]}
          />
        </>
      }
      footer={
        <>
          {enableClearFiltersButton && hasActiveFilters && <ClearFiltersButton />}
          {hasFooter && (
            <>
              <div
                className={classes?.footerCell}
                css={[
                  { gridColumn: 1 },
                  defaultClasses.footerFill,
                  stickyFooter && defaultClasses.stickyBottom,
                  stickyFooter instanceof Object && stickyFooter,
                  styles?.footerCell,
                ]}
              />
              <div
                className={classes?.footerCell}
                css={[
                  defaultClasses.footerFill,
                  stickyFooter && defaultClasses.stickyBottom,
                  stickyFooter instanceof Object && stickyFooter,
                  styles?.footerCell,
                ]}
              />

              {visibleColumns.map((column) => (
                <ColumnContext.Provider key={column.id} value={column.id}>
                  <ColumnFooter />
                </ColumnContext.Provider>
              ))}

              <div
                className={classes?.footerCell}
                css={[
                  defaultClasses.footerFill,
                  stickyFooter && defaultClasses.stickyBottom,
                  stickyFooter instanceof Object && stickyFooter,
                  styles?.footerCell,
                ]}
              />
            </>
          )}
        </>
      }
    >
      {(itemIds, startIndex) =>
        itemIds.map((itemId, index) => (
          <Row key={itemId} itemId={itemId} rowIndex={startIndex + index} />
        ))
      }
    </Virtualized>
  );
});
