import React, { createContext, useContext } from 'react';
import { Store } from 'schummar-state/react';
import { ColumnSelection } from './components/columnSelection';
import { HeaderCellView, HeaderFill, TableView } from './components/elements';
import { FilterComponent } from './components/filterComponent';
import { Row } from './components/row';
import { SelectComponent } from './components/selectComponent';
import { SortComponent } from './components/sortComponent';
import { useTableState } from './internalState/useTableState';
import { c } from './misc/helpers';
import { InternalColumn, InternalTableState, TableProps } from './types';

export const TableContext = createContext<Store<InternalTableState<any>> | null>(null);
export const ColumnContext = createContext<InternalColumn<any, any> | null>(null);
export function useTableContext<T>(): Store<InternalTableState<T>> {
  const value = useContext(TableContext);
  if (!value) throw Error('No table context available');
  return value as Store<InternalTableState<T>>;
}
export function useColumnContext<T, V>(): InternalColumn<T, V> {
  const value = useContext(ColumnContext);
  if (!value) throw Error('No column context available');
  return value as InternalColumn<T, V>;
}

export function Table<T>(props: TableProps<T>): JSX.Element {
  const state = useTableState(props);
  const fullWidth = state.useState('props.fullWidth');
  const activeColumns = state.useState('activeColumns');
  const defaultWidth = state.useState('props.defaultWidth');
  const classes = state.useState('props.classes');
  const activeItemsByParentId = state.useState('activeItemsByParentId');

  // console.log('render table');

  return (
    <TableContext.Provider value={state}>
      <TableView
        style={{
          gridTemplateColumns: [
            //
            fullWidth ? 'auto' : '0',
            'max-content',
            ...activeColumns.map((column) => column.width ?? defaultWidth ?? 'auto'),
            fullWidth ? 'auto' : '0',
          ].join(' '),
        }}
        className={classes?.table}
      >
        <HeaderFill className={classes?.headerCell} />

        <HeaderCellView className={classes?.headerCell}>
          <SelectComponent />

          <ColumnSelection />
        </HeaderCellView>

        {activeColumns.map((column) => (
          <ColumnContext.Provider key={column.id} value={column}>
            <HeaderCellView key={column.id} className={c(classes?.headerCell, column.classes?.headerCell)}>
              <SortComponent>{column.header}</SortComponent>
              <FilterComponent />
            </HeaderCellView>
          </ColumnContext.Provider>
        ))}

        <HeaderFill className={classes?.headerCell} />

        {[...(activeItemsByParentId.get(undefined)?.values() ?? [])].map((item) => (
          <Row key={item.id} id={item.id} />
        ))}
      </TableView>
    </TableContext.Provider>
  );
}
