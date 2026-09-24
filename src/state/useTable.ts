import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTableTheme } from '../hooks/useTheme';
import { getAncestors, getDescendants } from '../misc/helpers';
import type {
  Id,
  InternalColumn,
  TableActions,
  TableContextValue,
  TableProps,
  TableState,
  TableStructure,
} from '../types';
import {
  isFilterValuePersisted,
  isPersisted,
  usePersistence,
  type PersistedData,
} from './persistence';
import { useColumns } from './useColumns';
import { useExpanded } from './useExpanded';
import { useFilters } from './useFilters';
import { useActiveItems, useItems } from './useItems';
import { useSelection } from './useSelection';
import { useSort } from './useSort';
import { useTableProps } from './useTableProps';

const isControlledFilter = (columns: InternalColumn<any, unknown>[], columnId: Id) =>
  columns.find((column) => column.id === columnId)?.filter?.value !== undefined;

function withEntry<K, V>(map: Map<K, V>, key: K, value: V | undefined) {
  const result = new Map(map);
  if (value === undefined) result.delete(key);
  else result.set(key, value);
  return result;
}

/** `isReset`: whether this state replaces one that got reset. */
export function useTable<T>(raw: TableProps<T>, onReset: () => void, isReset = false) {
  const { props, displaySize } = useTableProps(raw);
  const theme = useTableTheme(props);
  const columns = useColumns(props, displaySize);
  const sort = useSort(props, columns.activeColumns);
  const { items, itemsById } = useItems(props, sort.criteria);
  const filters = useFilters(props, columns.visibleColumns, items);
  const expanded = useExpanded(props, itemsById, filters.matching);
  const { activeItems, activeItemsById } = useActiveItems(
    items,
    filters.matching,
    expanded.expanded,
  );
  const selection = useSelection(props, activeItems, activeItemsById);

  const state: TableState<T> = {
    props,
    displaySize,
    sort: sort.sort,
    selection: selection.selection,
    expanded: expanded.expanded,
    hiddenColumns: columns.hiddenColumns,
    columnWidths: columns.columnWidths,
    filterValues: filters.filterValues,
    columns: columns.columns,
    activeColumns: columns.activeColumns,
    visibleColumns: columns.visibleColumns,
    items,
    itemsById,
    activeItems,
    activeItemsById,
  };

  const { persist } = props;
  const persistData = useMemo(() => {
    const data: PersistedData = {};
    if (!persist) return data;

    const add = (key: keyof PersistedData, value: unknown, isControlled = false) => {
      if (!isControlled && isPersisted(persist, key)) data[key] = value;
    };

    add('sort', sort.sort, props.sort !== undefined);
    add('selection', selection.selection, props.selection !== undefined);
    add('expanded', expanded.expanded, props.expanded !== undefined);
    add('hiddenColumns', columns.hiddenColumns, props.hiddenColumns !== undefined);
    add('columnWidths', columns.columnWidths);
    add(
      'filterValues',
      new Map(
        [...filters.stored].filter(
          ([columnId]) =>
            isFilterValuePersisted(persist, columnId) &&
            !isControlledFilter(props.columns, columnId),
        ),
      ),
      props.filterValues !== undefined,
    );

    return data;
  }, [
    persist?.storage,
    persist?.id,
    JSON.stringify(persist?.include),
    JSON.stringify(persist?.exclude),
    sort.sort,
    selection.selection,
    expanded.expanded,
    columns.hiddenColumns,
    columns.columnWidths,
    filters.stored,
    props.columns,
    props.sort !== undefined,
    props.selection !== undefined,
    props.expanded !== undefined,
    props.hiddenColumns !== undefined,
    props.filterValues !== undefined,
  ]);

  const latest = useRef({ state, sort, selection, expanded, columns, filters, onReset });
  useLayoutEffect(() => {
    latest.current = { state, sort, selection, expanded, columns, filters, onReset };
  });

  function restore(data: PersistedData) {
    const { state, sort, selection, expanded, columns } = latest.current;
    const { props } = state;

    if (data.sort && props.sort === undefined) sort.setSort(data.sort);
    if (data.selection && props.selection === undefined) selection.setSelection(data.selection);
    if (data.expanded && props.expanded === undefined) expanded.setExpanded(data.expanded);
    if (data.hiddenColumns && props.hiddenColumns === undefined) {
      columns.setHiddenColumns(data.hiddenColumns);
    }
    if (data.columnWidths) columns.setColumnWidths(data.columnWidths);

    const filterValues = data.filterValues as Map<Id, unknown> | undefined;
    if (filterValues && props.filterValues === undefined) {
      const next = new Map(state.filterValues);
      for (const [columnId, value] of filterValues) {
        if (
          props.persist &&
          isFilterValuePersisted(props.persist, columnId) &&
          !isControlledFilter(props.columns, columnId)
        ) {
          next.set(columnId, value);
        }
      }
      commitFilterValues(next);
    }
  }

  useEffect(() => {
    if (!isReset) return;
    if (props.filterValues === undefined) props.onFilterValuesChange?.(filters.filterValues);

    for (const { id, filter } of props.columns) {
      filter?.onChange?.(filters.stored.has(id) ? filters.stored.get(id) : filter.defaultValue);
    }
  }, []);

  const [isHydrated, clearStorage] = usePersistence(persist, persistData, restore, props.debug);
  const clearStorageRef = useRef(clearStorage);
  clearStorageRef.current = clearStorage;

  const lastSelectedId = useRef<Id | undefined>(undefined);

  // `latest` only catches up after the next render.
  function patchState(patch: Partial<TableState<T>>) {
    latest.current = { ...latest.current, state: { ...latest.current.state, ...patch } };
  }

  /** Sets filter values and notifies the `onChange` of each filter whose value changed. */
  function commitFilterValues(next: Map<Id, unknown>) {
    const { state, filters } = latest.current;
    const previous = state.filterValues;
    filters.setFilterValues(next);
    patchState({ filterValues: next });

    for (const { id, filter } of state.props.columns) {
      const value = next.get(id);
      if (filter?.onChange && !Object.is(value, previous.get(id))) filter.onChange(value);
    }
  }

  const [actions] = useState((): TableActions<T> => {
    const get = () => latest.current;

    return {
      getState: () => get().state,

      setSort: (sort) => get().sort.setSort(sort),

      setSelection: (selection) => get().selection.setSelection(selection),

      toggleSelection(itemId, { range: isRange } = {}) {
        const { state, selection } = get();
        const { activeItems, activeItemsById, props } = state;
        const current = state.selection;

        const isSelected =
          itemId !== undefined
            ? current.has(itemId)
            : activeItems.length > 0 && activeItems.every((item) => current.has(item.id));

        let range;
        if (isRange && itemId !== undefined) {
          const b = activeItems.findIndex((item) => item.id === itemId);
          const last = lastSelectedId.current;
          const a = last !== undefined ? activeItems.findIndex((item) => item.id === last) : 0;
          range = activeItems.slice(Math.min(a < 0 ? b : a, b), Math.max(a, b) + 1);
        } else {
          const item = itemId !== undefined ? activeItemsById.get(itemId) : undefined;
          range = item ? [item] : activeItems;
        }

        const next = new Set(current);
        for (const item of range) {
          if (isSelected) next.delete(item.id);
          else next.add(item.id);
        }

        if (props.selectSyncChildren && isSelected) {
          for (const id of getAncestors(activeItemsById, ...range)) next.delete(id);
          for (const id of getDescendants(...range)) next.delete(id);
        }

        lastSelectedId.current = itemId;
        selection.setSelection(next);
        // A second action before the next render must build on this one.
        patchState({ selection: next });
      },

      setExpanded: (value) => get().expanded.setExpanded(value),

      toggleExpanded(itemId) {
        const { state, expanded } = get();
        const { activeItemsById, props } = state;
        const item = activeItemsById.get(itemId);
        const isExpanded = state.expanded.has(itemId);
        const next = new Set(state.expanded);

        if (props.expandOnlyOne) {
          next.clear();
          for (const id of item ? getAncestors(activeItemsById, item) : []) next.add(id);
        }

        if (isExpanded) {
          next.delete(itemId);
          for (const id of item ? getDescendants(item) : []) next.delete(id);
        } else {
          next.add(itemId);
        }

        expanded.setExpanded(next);
        patchState({ expanded: next });
      },

      setHiddenColumns: (hiddenColumns) => get().columns.setHiddenColumns(hiddenColumns),

      setColumnWidth(columnId, width) {
        get().columns.setColumnWidths((widths) => withEntry(widths, columnId, width));
      },

      setFilterValues: (filterValues) => commitFilterValues(filterValues),

      setFilterValue(columnId, value) {
        const next = new Map(get().state.filterValues);
        next.set(columnId, value);
        commitFilterValues(next);
      },

      clearFilters() {
        const { state } = get();
        const next = new Map(state.filterValues);
        for (const column of state.props.columns) {
          if (column.filter) next.set(column.id, undefined);
        }
        commitFilterValues(next);
        state.props.onReset?.('filters');
      },

      async resetTable() {
        await clearStorageRef.current();
        get().onReset();
      },
    };
  });
  const { sort: sortValue, hiddenColumns, columnWidths, filterValues } = state;
  const { columns: allColumns, activeColumns, visibleColumns } = state;
  const structure = useMemo(
    (): TableStructure<T> => ({
      props,
      displaySize,
      sort: sortValue,
      hiddenColumns,
      columnWidths,
      filterValues,
      columns: allColumns,
      activeColumns,
      visibleColumns,
      items,
      itemsById,
      actions,
    }),
    [
      props,
      displaySize,
      sortValue,
      hiddenColumns,
      columnWidths,
      filterValues,
      allColumns,
      activeColumns,
      visibleColumns,
      items,
      itemsById,
      actions,
    ],
  );

  const context = useMemo(
    (): TableContextValue<T> => ({
      ...structure,
      selection: state.selection,
      expanded: state.expanded,
      activeItems,
      activeItemsById,
    }),
    [structure, state.selection, state.expanded, activeItems, activeItemsById],
  );

  return {
    context,
    structure,
    actions,
    theme,
    isHydrated,
    setSortInternal: sort.setSortInternal,
    setSelectionInternal: selection.setSelectionInternal,
    setExpandedInternal: expanded.setExpandedInternal,
    setHiddenColumnsInternal: columns.setHiddenColumnsInternal,
    setFilterValuesInternal: filters.setFilterValuesInternal,
  };
}
