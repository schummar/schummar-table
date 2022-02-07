import React, { createContext, memo, useContext } from 'react';
import { Store } from 'schummar-state/react';
import { useTableStateStorage } from '../internalState/tableStateStorage';
import { useTableState } from '../internalState/useTableState';
import { defaultClasses } from '../theme/defaultClasses';
import { Id, InternalTableState, TableProps } from '../types';
import { ColumnHeader, ColumnHeaderContext } from './columnHeader';
import { ColumnSelection } from './columnSelection';
import { Export } from './export';
import { FilterComponent } from './filterComponent';
import { InsertLine } from './inserLine';
import { ResizeHandle } from './resizeHandle';
import { Row } from './row';
import { SelectComponent } from './selectComponent';
import { SortComponent } from './sortComponent';
import { Virtualized } from './virtualized';
import { useCssVariables } from '../theme/useCssVariables';

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
  const state = useTableState(props);
  state.getState().props.debug?.('render table');

  return (
    <TableContext.Provider value={state}>
      <TableInner />
    </TableContext.Provider>
  );
}

const TableInner = memo(function TableInner<T>(): JSX.Element {
  useTableStateStorage();
  const state = useTableContext<T>();
  const fullWidth = state.useState('props.fullWidth');
  const activeColumns = state.useState((state) =>
    state.activeColumns.map((column) => ({
      id: column.id,
      width: column.width,
      css: column.css,
      header: column.header,
    })),
  );
  const columnWidths = state.useState('columnWidths', { throttle: 16 });
  const insertLine = state.useState('insertLine');
  const defaultWidth = state.useState('props.defaultWidth');
  const css = state.useState('props.css');
  const stickyHeader = state.useState('props.stickyHeader');
  const enableSelection = state.useState('props.enableSelection');
  const enableColumnSelection = state.useState('props.enableColumnSelection');
  const enableExport = state.useState((state) => !!state.props.enableExport.copy || !!state.props.enableExport.download);
  const cssVariables = useCssVariables();

  state.getState().props.debug?.('render table inner');

  return (
    <Virtualized
      css={[
        cssVariables,
        defaultClasses.table,
        css?.table,
        {
          gridTemplateColumns: [
            //
            fullWidth === 'right' || fullWidth === true ? 'auto' : '0',
            'max-content',
            ...activeColumns.flatMap((column, index) => [
              insertLine === index && '0',
              columnWidths.get(column.id) ?? column.width ?? defaultWidth ?? 'max-content',
            ]),
            insertLine === activeColumns.length && '0',
            fullWidth === 'left' || fullWidth === true ? 'auto' : '0',
          ]
            .filter(Boolean)
            .join(' '),
        },
      ]}
      header={
        <>
          <div css={[defaultClasses.headerFill, stickyHeader && defaultClasses.sticky, css?.headerCell]} />

          <div css={[defaultClasses.headerCell, stickyHeader && defaultClasses.sticky, css?.headerCell]}>
            {enableSelection && <SelectComponent />}

            {enableColumnSelection && <ColumnSelection />}

            {enableExport && <Export />}
          </div>

          <ColumnHeaderContext.Provider>
            {activeColumns.map((column, index) => (
              <ColumnContext.Provider key={column.id} value={column.id}>
                {insertLine === index && <InsertLine />}

                <ColumnHeader
                  css={[defaultClasses.headerCell, stickyHeader && defaultClasses.sticky, css?.headerCell, column.css?.headerCell]}
                  key={column.id}
                >
                  <SortComponent>{column.header}</SortComponent>
                  <FilterComponent />
                  <div css={{ flex: 1 }} />
                  <ResizeHandle />
                </ColumnHeader>
              </ColumnContext.Provider>
            ))}

            {insertLine === activeColumns.length && <InsertLine />}
          </ColumnHeaderContext.Provider>

          <div css={[defaultClasses.headerFill, stickyHeader && defaultClasses.sticky, css?.headerCell]} />
        </>
      }
    >
      {(itemIds, startIndex) => itemIds.map((itemId, index) => <Row key={itemId} itemId={itemId} rowIndex={startIndex + index} />)}
    </Virtualized>
  );
});
