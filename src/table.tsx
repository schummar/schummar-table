import { Draft } from 'immer';
import React, { useEffect, useMemo } from 'react';
import { Store, StoreScope } from 'schummar-state/react';
import { calcProps } from './calcProps';
import type { InternalTableState } from './internalTypes';
import { HeaderCellView, HeaderFill, TableView } from './tableElements';
import { FilterComponent } from './tableFilter';
import { Row } from './tableRow';
import { Select } from './tableSelect';
import { Sort } from './tableSort';
import { TableProps } from './types';

export const TableScope = new StoreScope<InternalTableState>({
  filters: new Map(),
  selection: new Set(),
  expanded: new Set(),
});

export function Table<T>(_props: TableProps<T>): JSX.Element {
  const props = calcProps(_props);
  const { data = [], id, columns, defaultWidth = 'auto', defaultSort = [], fullWidth } = props;

  const state = useMemo(
    () =>
      new Store<InternalTableState>({
        selection: new Set(),
        expanded: new Set(),
        filters: new Map(),
      }),
    [],
  );

  state.update((state) => {
    if (props.selection) state.selection = props.selection;
    if (props.expanded) state.expanded = props.expanded;
    for (const column of columns) if (column.filter) state.filters.set(column.id, column.filter);
  });

  useEffect(() => {
    const columnIds = new Set(columns.map((column) => column.id));
    const itemSet = new Set(items);

    const newSelection = new Set(state.getState().selection);
    for (const item of newSelection) {
      if (!itemSet.has(item)) newSelection.delete(item);
    }

    const newExpanded = new Set(state.getState().expanded);
    for (const item of newExpanded) {
      if (!itemSet.has(item)) newExpanded.delete(item);
    }

    state.update((state) => {
      state.sort = state.sort?.filter((s) => columnIds.has(s.column));

      for (const [id] of state.filters.entries()) {
        if (!columnIds.has(id)) state.filters.delete(id);
      }

      state.selection = newSelection as Draft<Set<T>>;
    });
  }, [state, items, columns]);

  return (
    <TableScope.Provider store={state}>
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
          <Select {...props} items={data} />
        </HeaderCellView>

        {columns.map((column) => (
          <HeaderCellView key={column.id} style={column.style}>
            <Sort {...props} columns={columns} column={column}>
              {column.header}
            </Sort>
            <FilterComponent {...props} columns={columns} column={column} />
          </HeaderCellView>
        ))}

        <HeaderFill />

        {items.map((item) => (
          <Row key={id(item)} {...props} columns={columns} item={item} />
        ))}
      </TableView>
    </TableScope.Provider>
  );
}
