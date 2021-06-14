import { CircularProgress, IconButton, styled, ThemeProvider } from '@material-ui/core';
import { ChevronRight } from '@material-ui/icons';
import { Draft } from 'immer';
import React, { useEffect, useMemo, useState } from 'react';
import { Store, StoreScope } from 'schummar-state/react';
import { buildTree, flatMap, orderBy, TreeNode, uniq } from './helpers';
import type { InternalColumn, InternalTableProps, InternalTableState } from './internalTypes';
import { FilterComponent } from './tableFilter';
import { DefaultFilter } from './tableFilterDefault';
import { Select } from './tableSelect';
import { Sort } from './tableSort';
import { Column, TableItem, TableProps } from './types';

export const TableScope = new StoreScope<InternalTableState<any>>({
  filters: new Map(),
  selection: new Set(),
  expanded: new Set(),
});

const TableView = styled('div')({
  display: 'grid',
});

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
const CellFill = styled(CellView)({
  padding: 0,
});

const HeaderCellView = styled(CellView)(({ theme }) => ({
  gridTemplateColumns: 'minmax(0, 1fr) max-content',
  background: theme.palette.grey[300],
  fontWeight: 'bold',
  borderBottom: `none`,

  '&:not(:first-child)': {
    borderLeft: `1px solid ${theme.palette.background.default}`,
  },
}));
const HeaderFill = styled(HeaderCellView)({
  padding: 0,
});

const DeferredPlaceholder = styled(CellView)(({ theme }) => ({
  gridColumn: '1 / -1',
  padding: theme.spacing(1),
  display: 'grid',
  justifyContent: 'center',
}));

export function Table<T extends TableItem>(props: TableProps<T>): JSX.Element {
  const { data = [], defaultWidth = 'auto', defaultSort = [], fullWidth } = props;
  let { columns: _columns = [] } = props;

  const state = useMemo(
    () =>
      new Store<InternalTableState<T>>({
        filters: new Map(),
        selection: new Set(),
        expanded: new Set(),
      }),
    [],
  );

  if (_columns instanceof Function) {
    _columns = _columns((value, column) => ({ ...column, value }));
  }
  const columns = _columns.map(function <V>(
    {
      id,
      header = null,
      value,
      stringValue = (v) => String(v ?? ''),
      sortBy = (v) => (typeof v === 'number' || v instanceof Date ? v : stringValue(v)),
      renderValue = stringValue,
      renderCell = renderValue,
      useFilter = false,
      filterOptions = orderBy(uniq(data.map(value).filter((x) => x !== undefined))),
      defaultFilter = new DefaultFilter<V>(),
      filter,
      onFilterChange,
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
      useFilter,
      filterOptions,
      defaultFilter,
      filter,
      onFilterChange,
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

    const selectors = flatMap(sort ?? defaultSort ?? [], (sort) => {
      const column = columns.find((column) => column.id === sort.id);
      if (column) return [{ selector: (item: T) => column.sortBy(column.value(item)), direction: sort.direction }];
      return [];
    }).filter(Boolean);

    const sorted = orderBy(
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

    const newExpanded = new Set(state.getState().expanded);
    for (const item of newExpanded) {
      if (!itemSet.has(item)) newExpanded.delete(item);
    }

    state.update((state) => {
      state.sort = state.sort?.filter((s) => columnIds.has(s.id));

      for (const [id] of state.filters.entries()) {
        if (!columnIds.has(id)) state.filters.delete(id);
      }

      state.selection = newSelection as Draft<Set<T>>;
    });
  }, [state, items, columns]);

  const tree = buildTree(items);

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
          <Select {...props} columns={columns} items={data} />
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

        {tree.map((node, index) => (
          <Row key={index} {...props} columns={columns} {...node} />
        ))}
      </TableView>
    </TableScope.Provider>
  );
}

function Row<T extends TableItem>(props: InternalTableProps<T> & TreeNode<T> & { indent?: number }) {
  const { item, children, indent = 0, deferredExpansion, columns = [] } = props;
  const canOpen = children.length > 0 || deferredExpansion?.(item);
  const store = TableScope.useStore();
  const open = store.useState(
    (state) => {
      const expanded = props.expanded ?? state.expanded;
      console.log(expanded, item, expanded.has(item));
      return expanded.has(item);
    },
    [props.expanded, item],
  );

  const toggle = () => {
    const newExpanded = new Set(props.expanded ?? store.getState().expanded);
    if (open) newExpanded.delete(item);
    else newExpanded.add(item);

    if (!props.expanded) {
      store.update((state) => {
        state.expanded = newExpanded;
      });
    }

    props.onExpandedChange?.(newExpanded);
  };

  return (
    <>
      <CellFill />

      <CellView>
        <Select {...props} items={[]} indent={indent} />

        {canOpen && (
          <IconButton onClick={toggle}>
            <ChevronRight
              style={{
                transition: 'all 500ms',
                transform: open ? 'rotate3d(0, 0, 1, 90deg)' : 'none',
              }}
            />
          </IconButton>
        )}
      </CellView>

      {columns.map((column) => (
        <CellView key={column.id} style={column.style}>
          {column.renderCell(column.value(item), item)}
        </CellView>
      ))}

      <CellFill />

      {canOpen && open && children.map((child, index) => <Row key={index} {...props} {...child} indent={indent + 1} />)}
      {canOpen && open && children.length === 0 && (
        <>
          <DeferredPlaceholder>
            <CircularProgress size={20} />
          </DeferredPlaceholder>
        </>
      )}
    </>
  );
}
