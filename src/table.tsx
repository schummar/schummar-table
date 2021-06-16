import React, { createContext, useContext, useMemo } from 'react';
import { Store } from 'schummar-state/react';
import { calcItems } from './calcItems';
import { calcProps } from './calcProps';
import { cleanupState } from './cleanupState';
import { HeaderCellView, HeaderFill, TableView } from './elements';
import { Filter, FilterComponent } from './filterComponent';
import { Row } from './row';
import { SelectComponent } from './selectComponent';
import { SortComponent } from './sortComponent';
import { syncSelections } from './syncSelections';
import { Id, InternalColumn, InternalTableProps, InternalTableState, TableProps } from './types';

export type TableContext<T> = {
  props: InternalTableProps<T>;
  state: Store<InternalTableState>;
};
export type ColumnContext<T, V> = TableContext<T> & {
  column: InternalColumn<T, V>;
};
export const TableContext = createContext<TableContext<any> | null>(null);
export const ColumnContext = createContext<ColumnContext<any, any> | null>(null);
export function useTableContext<T>(): TableContext<T> {
  const value = useContext(TableContext);
  if (!value) throw Error('No table context available');
  return value as TableContext<T>;
}
export function useColumnContext<T, V>(): ColumnContext<T, V> {
  const value = useContext(ColumnContext);
  if (!value) throw Error('No column context available');
  return value as ColumnContext<T, V>;
}

export function Table<T>(_props: TableProps<T>): JSX.Element {
  let props = calcProps(_props);
  const { columns, defaultWidth = 'auto', defaultSelection, defaultExpanded, defaultSort, fullWidth } = props;

  const state = useMemo(
    () =>
      new Store<InternalTableState>({
        sort: defaultSort ?? [],
        selection: defaultSelection ?? new Set(),
        expanded: defaultExpanded ?? new Set(),
        filters: (() => {
          const filters = new Map<Id, Filter<unknown>>();
          for (const column of columns) if (column.defaultFilter) filters.set(column.id, column.defaultFilter);
          return filters;
        })(),
      }),
    [],
  );

  state.update((state) => {
    if (props.sort) state.sort = props.sort;
    if (props.selection) state.selection = props.selection;
    if (props.expanded) state.expanded = props.expanded;
    for (const column of columns) if (column.filter) state.filters.set(column.id, column.filter);
  });

  props = calcItems(props, state);

  cleanupState(props, state);
  syncSelections(props, state);

  return (
    <TableContext.Provider value={{ props, state }}>
      <TableView
        style={{
          gridTemplateColumns: [
            //
            fullWidth ? 'auto' : '0',
            'max-content',
            ...columns.map((column) => column.width ?? defaultWidth),
            fullWidth ? 'auto' : '0',
          ].join(' '),
        }}
      >
        <HeaderFill />

        <HeaderCellView>
          <SelectComponent />
        </HeaderCellView>

        {columns.map((column) => (
          <ColumnContext.Provider key={column.id} value={{ props, state, column }}>
            <HeaderCellView key={column.id}>
              <SortComponent>{column.header}</SortComponent>
              <FilterComponent />
            </HeaderCellView>
          </ColumnContext.Provider>
        ))}

        <HeaderFill />

        {[...(props.activeItemsByParentId.get(undefined)?.values() ?? [])].map((item) => (
          <Row key={item.id} item={item} />
        ))}
      </TableView>
    </TableContext.Provider>
  );
}
