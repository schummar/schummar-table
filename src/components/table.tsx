import React, { createContext, memo, useContext, useEffect, useState } from 'react';
import { Store } from 'schummar-state/react';
import { useTheme } from '..';
import { useTableStateStorage } from '../internalState/tableStateStorage';
import { useTableState } from '../internalState/useTableState';
import { cx } from '../misc/helpers';
import { defaultClasses } from '../theme/defaultClasses';
import { useCssVariables } from '../theme/useCssVariables';
import { Id, InternalTableState, TableProps } from '../types';
import { ColumnHeader, ColumnHeaderContext } from './columnHeader';
import { ColumnSelection } from './columnSelection';
import { Export } from './export';
import { FilterControl } from './filterControl';
import { ResizeHandle } from './resizeHandle';
import { Row } from './row';
import { SelectComponent } from './selectComponent';
import { SortComponent } from './sortComponent';
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

  table.getState().props.debugRender?.('render table');

  return (
    <TableContext.Provider value={table}>
      <TableLoadingState />
    </TableContext.Provider>
  );
}

function TableLoadingState() {
  const { text } = useTheme();
  const isHydrated = useTableStateStorage();
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setShowLoading(true), 500);
    return () => clearTimeout(handle);
  });

  return (
    <>
      {!isHydrated && showLoading && <div>{text.loading}</div>}
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
      header: column.header,
    })),
  );
  const columnWidths = table.useState('columnWidths', { throttle: 16 });
  const columnStyleOverride = table.useState('columnStyleOverride', { throttle: 16 });
  const defaultWidth = table.useState('props.defaultWidth');
  const classes = table.useState('props.classes');
  const stickyHeader = table.useState('props.stickyHeader');
  const enableSelection = table.useState('props.enableSelection');
  const enableColumnSelection = table.useState('props.enableColumnSelection');
  const enableExport = table.useState((state) => !!state.props.enableExport.copy || !!state.props.enableExport.download);
  const cssVariables = useCssVariables();

  table.getState().props.debugRender?.('render table inner');

  return (
    <Virtualized
      className={`${classes?.table}`}
      css={[
        cssVariables,
        defaultClasses.table,
        {
          gridTemplateColumns: [
            //
            fullWidth === 'right' || fullWidth === true ? 'auto' : '0',
            'max-content',
            ...activeColumns.map((column) => columnWidths.get(column.id) ?? column.width ?? defaultWidth ?? 'max-content'),
            fullWidth === 'left' || fullWidth === true ? 'auto' : '0',
          ].join(' '),
        },
        hidden && { visibility: 'hidden' },
      ]}
      header={
        <>
          <div className={classes?.headerCell} css={[defaultClasses.headerFill, stickyHeader && defaultClasses.sticky]} />

          <div className={classes?.headerCell} css={[defaultClasses.headerCell, stickyHeader && defaultClasses.sticky]}>
            {enableSelection && <SelectComponent />}

            {enableColumnSelection && <ColumnSelection />}

            {enableExport && <Export />}
          </div>

          <ColumnHeaderContext.Provider>
            {activeColumns.map((column) => (
              <ColumnContext.Provider key={column.id} value={column.id}>
                <ColumnHeader
                  className={cx(classes?.headerCell, column.classes?.headerCell)}
                  css={[defaultClasses.headerCell, columnStyleOverride.get(column.id), stickyHeader && defaultClasses.sticky]}
                  key={column.id}
                >
                  <FilterControl />
                  <SortComponent>{column.header}</SortComponent>
                  <div css={{ flex: 1 }} />
                  <ResizeHandle />
                </ColumnHeader>
              </ColumnContext.Provider>
            ))}
          </ColumnHeaderContext.Provider>

          <div className={classes?.headerCell} css={[defaultClasses.headerFill, stickyHeader && defaultClasses.sticky]} />
        </>
      }
    >
      {(itemIds, startIndex) => itemIds.map((itemId, index) => <Row key={itemId} itemId={itemId} rowIndex={startIndex + index} />)}
    </Virtualized>
  );
});
