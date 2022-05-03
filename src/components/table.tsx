import { Button } from '@material-ui/core';
import React, { createContext, memo, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { Store } from 'schummar-state/react';
import { useTheme } from '..';
import { TableMemoContextProvider } from '../hooks/useTableMemo';
import { useTableStateStorage } from '../internalState/tableStateStorage';
import { useTableState } from '../internalState/useTableState';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';
import { useCssVariables } from '../theme/useCssVariables';
import { Id, InternalTableState, TableProps } from '../types';
import { ColumnFooter } from './columnFooter';
import { ColumnHeader, ColumnHeaderContext } from './columnHeader';
import { ColumnSelection } from './columnSelection';
import { Export } from './export';
import { ResizeHandleView } from './resizeHandle';
import { Row } from './row';
import { SelectComponent } from './selectComponent';
import { Virtualized } from './virtualized';

export const TableContext = createContext<Store<InternalTableState<any>> | null>(null);
export const ColumnContext = createContext<Id | null>(null);
export function useTableContext<T>(): Store<InternalTableState<T>> {
  const value = useContext(TableContext);
  if (!value) throw Error('No table context available');
  return value as Store<InternalTableState<T>>;
}
export function useColumnContext(): Id {
  const value = useContext(ColumnContext);
  if (value === null) throw Error('No column context available');
  return value;
}

export function Table<T>(props: TableProps<T>): JSX.Element {
  const table = useTableState(props);

  useLayoutEffect(() => table.getState().props.debugRender?.('render table'));

  return (
    <TableContext.Provider value={table}>
      <TableMemoContextProvider>
        <TableLoadingState />
      </TableMemoContextProvider>
    </TableContext.Provider>
  );
}

function TableLoadingState() {
  const loadingText = useTheme((t) => t.text.loading);
  const isHydrated = useTableStateStorage();
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
  const fullWidth = table.useState('props.fullWidth');
  const activeColumns = table.useState((state) =>
    state.activeColumns.map((column) => ({
      id: column.id,
      width: column.width,
      classes: column.classes,
    })),
  );
  const hasActiveFilters = table.useState((state) => {
    const firstFilter = state.activeColumns.find((column) => {
      const filter = state.filters.get(column.id);
      const filterValue = state.filterValues.get(column.id);
      return filter !== undefined && filterValue !== undefined && filter.isActive(filterValue);
    });
    return !!firstFilter;
  });
  const columnWidths = table.useState('columnWidths', { throttle: 16 });
  const hasFooter = table.useState((state) => state.activeColumns.some((column) => column.footer));

  const classes = useTheme((theme) => theme.classes);
  const stickyHeader = table.useState('props.stickyHeader');
  const stickyFooter = table.useState('props.stickyFooter');

  const enableSelection = table.useState('props.enableSelection');
  const enableColumnSelection = table.useState('props.enableColumnSelection');
  const enableExport = table.useState((state) => !!state.props.enableExport.copy || !!state.props.enableExport.download);
  const cssVariables = useCssVariables();

  useLayoutEffect(() => table.getState().props.debugRender?.('render table inner'));

  return (
    <Virtualized
      className={classes?.table}
      css={[
        cssVariables,
        defaultClasses.table,
        {
          gridTemplateColumns: [
            //
            fullWidth === 'right' || fullWidth === true ? 'auto' : '0',
            'max-content',
            ...activeColumns.map((column) => columnWidths.get(column.id) ?? column.width ?? 'max-content'),
            fullWidth === 'left' || fullWidth === true ? 'auto' : '0',
          ].join(' '),
        },
        hidden && { visibility: 'hidden' },
      ]}
      header={
        <>
          <div
            className={classes?.headerCell}
            css={[defaultClasses.headerFill, stickyHeader && defaultClasses.sticky, stickyHeader instanceof Object && stickyHeader]}
          />

          <div
            className={classes?.headerCell}
            css={[defaultClasses.headerCell, stickyHeader && defaultClasses.sticky, stickyHeader instanceof Object && stickyHeader]}
          >
            {enableSelection && <SelectComponent />}

            {enableColumnSelection && <ColumnSelection />}

            {enableExport && <Export />}
            <ResizeHandleView />
          </div>

          <ColumnHeaderContext.Provider>
            {activeColumns.map((column) => (
              <ColumnContext.Provider key={column.id} value={column.id}>
                <ColumnHeader />
              </ColumnContext.Provider>
            ))}
          </ColumnHeaderContext.Provider>

          <div
            className={classes?.headerCell}
            css={[defaultClasses.headerFill, stickyHeader && defaultClasses.sticky, stickyHeader instanceof Object && stickyHeader]}
          />
        </>
      }
      footer={
        <>
          {hasFooter && (
            <>
              <div
                className={classes?.footerCell}
                css={[
                  defaultClasses.footerFill,
                  stickyFooter && defaultClasses.stickyBottom,
                  stickyFooter instanceof Object && stickyFooter,
                ]}
              />
              <div
                className={classes?.footerCell}
                css={[
                  defaultClasses.footerFill,
                  stickyFooter && defaultClasses.stickyBottom,
                  stickyFooter instanceof Object && stickyFooter,
                ]}
              />

              {activeColumns.map((column) => (
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
                ]}
              />
            </>
          )}
          {hasActiveFilters && (
            <Button
              css={[
                defaultClasses.clearFilterButton,
                stickyFooter && defaultClasses.stickyBottom,
                stickyFooter instanceof Object && stickyFooter,
              ]}
              onClick={() => {
                table.update((state) => {
                  state.activeColumns.forEach((column) => {
                    state.filterValues.delete(column.id);
                  });
                });
              }}
            >
              Clear all filters
            </Button>
          )}
        </>
      }
    >
      {(itemIds, startIndex) => itemIds.map((itemId, index) => <Row key={itemId} itemId={itemId} rowIndex={startIndex + index} />)}
    </Virtualized>
  );
});
