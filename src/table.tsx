import { IconButton, styled, Theme } from '@material-ui/core';
import { ChevronRight } from '@material-ui/icons';
import { Draft } from 'immer';
import React, { createContext, CSSProperties, Fragment, ReactNode, useEffect, useMemo, useState } from 'react';
import { Store, StoreScope } from 'schummar-state/react';
import * as _ from './helpers';
import { Filter, FilterComponent } from './tableFilter';
import { DefaultFilter } from './tableFilterDefault';
import { AllSelect, GroupSelect, RowSelect } from './tableSelect';
import { Sort } from './tableSort';

export type Column<T = unknown, V = unknown> = {
  id?: string;
  header?: ReactNode;
  value: (item: T) => V;
  stringValue?: (value: V) => string;
  sortBy?: (value: V) => unknown;
  renderValue?: (value: V) => ReactNode;
  renderCell?: (value: V, item: T) => ReactNode;
  renderGoupCell?: (rows: { value: V; item: T }[]) => ReactNode;

  filter?: boolean;
  filterOptions?: V[];
  defaultFilter?: Filter<V>;
  width?: string;
  style?: CSSProperties;
};

export type InternalColumn<T = unknown, V = unknown> = Omit<Column<T, V>, 'id'> & { id: string | number } & Required<
    Omit<Column<T, V>, 'id' | 'width' | 'style'>
  >;

export type TableProps<T = unknown> = {
  data?: T[];
  columns?: Column<T, any>[];
  defaultWidth?: string;
  defaultSort?: { id: string | number; direction: 'asc' | 'desc' }[];
  selection?: Set<T>;
  onSelectionChange?: (selection: Set<T>) => void;
  groupBy?: (item: T) => unknown;
  fullWidth?: boolean;
  text?: {
    deselectAll?: string;
  };
};

export type InternalTableProps<T = unknown> = Omit<TableProps<T>, 'columns'> & { columns: InternalColumn<T, unknown>[] };

export type TableState<T> = {
  sort?: { id: string | number; direction: 'asc' | 'desc' }[];
  filters: Map<string | number, Filter<unknown>>;
  selection: Set<T>;
  expandedGroups: Set<unknown>;
};

export const TableScope = new StoreScope<TableState<any>>({
  filters: new Map(),
  selection: new Set(),
  expandedGroups: new Set(),
});

const TableView = styled('div')(({ theme }) => ({
  display: 'grid',
}));

const CellView = styled('div')(({ theme }) => ({
  padding: `${theme.spacing(0.5)}px ${theme.spacing()}px`,
  display: 'grid',
  gridAutoFlow: 'column',
  alignItems: 'center',
  borderBottom: `1px solid ${theme.palette.grey[200]}`,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));
const CellFill = styled(CellView)(({ theme }) => ({
  padding: 0,
}));

const HeaderCellView = styled(CellView)(({ theme }) => ({
  gridTemplateColumns: 'minmax(0, 1fr) max-content',
  background: theme.palette.grey[300],
  fontWeight: 'bold',
  borderBottom: `none`,

  '&:not(:first-child)': {
    borderLeft: `1px solid ${theme.palette.background.default}`,
  },
}));
const HeaderFill = styled(HeaderCellView)(({ theme }) => ({
  padding: 0,
}));

const ToggleOpen = styled(({ open, ...props }) => <ChevronRight {...props} />)(({ theme, open }: { theme: Theme; open?: boolean }) => ({
  transform: open ? 'rotate3d(0, 0, 1, 90deg)' : 'none',
  transition: 'all 500ms',
}));

const Connection = styled('div')(({ theme }) => ({
  width: 6,
  height: '100%',
  background: theme.palette.action.disabled,
  margin: `-10px 21px`,
}));

export function Table<T>(props: TableProps<T>) {
  const { data = [], columns: _columns = [], defaultWidth = 'auto', defaultSort = [], groupBy, fullWidth } = props;

  const state = useMemo(
    () =>
      new Store<TableState<T>>({
        filters: new Map(),
        selection: new Set(),
        expandedGroups: new Set(),
      }),
    [],
  );

  const columns = _columns.map(function <V>(
    {
      id,
      header = null,
      value,
      stringValue = (v) => String(v ?? ''),
      sortBy = (v) => (typeof v === 'number' || v instanceof Date ? v : stringValue(v)),
      renderValue = stringValue,
      renderCell = renderValue,
      renderGoupCell = (rows) => renderCell(rows[0]!.value, rows[0]!.item),
      filter = false,
      filterOptions = _.orderBy(_.uniq(data.map(value).filter((x) => x !== undefined))),
      defaultFilter = new DefaultFilter<V>(),
      width,
      style,
    }: Column<T, V>,
    index: number,
  ): InternalColumn<T, V> {
    return {
      id: id ?? index,
      header,
      value,
      stringValue,
      sortBy,
      renderValue,
      renderCell,
      renderGoupCell,
      filter,
      filterOptions,
      defaultFilter,
      width,
      style,
    };
  });

  const items = (() => {
    const filters = state.useState((state) => state.filters);
    const sort = state.useState((state) => state.sort);

    const filtered = columns.reduce((data, column) => {
      if (!column.filter) return data;
      const filter = filters.get(column.id) ?? column.defaultFilter;
      return data.filter((item) => filter.filter(column.value(item)));
    }, data);

    const selectors = _.flatMap(sort ?? defaultSort ?? [], (sort) => {
      const column = columns.find((column) => column.id === sort.id);
      if (column) return [{ selector: (item: T) => column.sortBy(column.value(item)), direction: sort.direction }];
      return [];
    }).filter(Boolean);

    const sorted = _.orderBy(
      filtered,
      selectors.map((x) => x.selector),
      selectors.map((x) => x.direction),
    );

    return sorted;
  })();

  useEffect(() => {
    const columnIds = new Set(columns.map((column) => column.id));
    const itemSet = new Set(items);
    const newSelection = new Set(state.getState().selection);
    for (const item of newSelection) {
      if (!itemSet.has(item)) newSelection.delete(item);
    }

    state.update((state) => {
      state.sort = state.sort?.filter((s) => columnIds.has(s.id));

      for (const [id] of state.filters.entries()) {
        if (!columnIds.has(id)) state.filters.delete(id);
      }

      state.selection = newSelection as Draft<Set<T>>;
    });
  }, [state, items, columns]);

  const grouped = groupBy ? Object.values(_.groupBy(items, groupBy)) : items.map((item) => [item]);

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
          <AllSelect {...props} columns={columns} />
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

        {grouped.map((items, index) => (
          <Group key={index} {...props} columns={columns} items={items} />
        ))}
      </TableView>
    </TableScope.Provider>
  );
}

function Group<T>(props: InternalTableProps<T> & { items: T[] }) {
  const { items, columns = [] } = props;
  const [open, setOpen] = useState(false);

  return (
    <>
      {items.length > 1 && (
        <>
          <CellFill />

          <CellView>
            <IconButton onClick={() => setOpen((open) => !open)}>
              <ToggleOpen open={open} />
            </IconButton>
            <GroupSelect {...props} />
          </CellView>

          {columns.map((column) => (
            <CellView key={column.id} style={column.style}>
              {column.renderGoupCell(items.map((item) => ({ value: column.value(item), item })))}
            </CellView>
          ))}

          <CellFill />
        </>
      )}

      {(items.length === 1 || open) &&
        items.map((item, index) => (
          <Fragment key={index}>
            <CellFill />

            <CellView>
              {items.length > 1 && <Connection />}
              <RowSelect {...props} item={item} />
            </CellView>

            {columns.map((column) => (
              <CellView key={column.id} style={column.style}>
                {column.renderCell(column.value(item), item)}
              </CellView>
            ))}

            <CellFill />
          </Fragment>
        ))}
    </>
  );
}
