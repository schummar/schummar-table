import React, { createContext, useContext, useMemo } from 'react';
import { Store } from 'schummar-state/react';
import { calcItems } from './calcItems';
import { calcProps } from './calcProps';
import { cleanupState } from './cleanupState';
import { ColumnSelection } from './columnSelection';
import { HeaderCellView, HeaderFill, TableView } from './elements';
import { filterColumns } from './filterColumns';
import { Filter, FilterComponent } from './filterComponent';
import { c } from './helpers';
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
  const { defaultWidth = 'auto', defaultSelection, defaultExpanded, defaultSort, fullWidth, classes } = props;

  const state = useMemo(
    () =>
      new Store<InternalTableState>({
        sort: defaultSort ?? [],
        selection: defaultSelection ?? new Set(),
        expanded: defaultExpanded ?? new Set(),
        filters: (() => {
          const filters = new Map<Id, Filter<unknown>>();
          for (const column of props.columns)
            if (column.defaultFilter) {
              filters.set(column.id, column.defaultFilter);
            }
          return filters;
        })(),
        visible: (() => {
          const visible = new Map<Id, boolean>();
          for (const column of props.columns)
            if (column.defaultVisible !== undefined) {
              visible.set(column.id, column.defaultVisible);
            }
          return visible;
        })(),
      }),
    [],
  );

  state.update((state) => {
    if (props.sort) state.sort = props.sort;
    if (props.selection) state.selection = props.selection;
    if (props.expanded) state.expanded = props.expanded;
    for (const column of props.columns) {
      if (column.filter) state.filters.set(column.id, column.filter);
      if (column.visible !== undefined) state.visible.set(column.id, column.visible);
    }
  });

  props = filterColumns(props, state);
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
            ...props.activeColumns.map((column) => column.width ?? defaultWidth),
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

        {props.activeColumns.map((column) => (
          <ColumnContext.Provider key={column.id} value={{ props, state, column }}>
            <HeaderCellView key={column.id} className={c(classes?.headerCell, column.classes?.headerCell)}>
              <SortComponent>{column.header}</SortComponent>
              <FilterComponent />
            </HeaderCellView>
          </ColumnContext.Provider>
        ))}

        <HeaderFill className={classes?.headerCell} />

        {[...(props.activeItemsByParentId.get(undefined)?.values() ?? [])].map((item) => (
          <Row key={item.id} item={item} />
        ))}
      </TableView>
    </TableContext.Provider>
  );
}
