import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTableTheme } from '../hooks/useTheme';
import { getAncestors, getDescendants } from '../misc/helpers';
import type {
  Id,
  TableActions,
  TableContextValue,
  TableProps,
  TableState,
  TableStructure,
} from '../types';
import { isPersisted, usePersistence, type PersistedData } from './persistence';
import { useColumns } from './useColumns';
import { useExpanded } from './useExpanded';
import { useFilters } from './useFilters';
import { useActiveItems, useItems } from './useItems';
import { useSelection } from './useSelection';
import { useSort } from './useSort';
import { useTableProps } from './useTableProps';

function withEntry<K, V>(map: Map<K, V>, key: K, value: V | undefined) {
  const result = new Map(map);
  if (value === undefined) result.delete(key);
  else result.set(key, value);
  return result;
}

export function useTable<T>(raw: TableProps<T>, onReset: () => void) {
  const { props, displaySize } = useTableProps(raw);
  const theme = useTableTheme(props);
  const columns = useColumns(props, displaySize);
  const sort = useSort(props, columns.activeColumns);
  const { items, itemsById } = useItems(props, sort.criteria);
  const filters = useFilters(columns.activeColumns, items);
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
    filters: filters.filters,
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
      new Map([
        ...filters.pendingValues.current,
        ...[...filters.filterValues].filter(([columnId]) => {
          const filter = filters.filters.get(columnId);
          return filter?.persist ?? filter?.value === undefined;
        }),
      ]),
    );

    return data;
  }, [
    persist?.storage,
    persist?.id,
    String(persist?.include),
    String(persist?.exclude),
    sort.sort,
    selection.selection,
    expanded.expanded,
    columns.hiddenColumns,
    columns.columnWidths,
    filters.filterValues,
    filters.filters,
    props.sort !== undefined,
    props.selection !== undefined,
    props.expanded !== undefined,
    props.hiddenColumns !== undefined,
  ]);

  const latest = useRef({ state, sort, selection, expanded, columns, filters, onReset });
  useLayoutEffect(() => {
    latest.current = { state, sort, selection, expanded, columns, filters, onReset };
  });

  function restore(data: PersistedData) {
    const { state, sort, selection, expanded, columns, filters } = latest.current;
    const { props } = state;

    if (data.sort && props.sort === undefined) sort.setSort(data.sort);
    if (data.selection && props.selection === undefined) selection.setSelection(data.selection);
    if (data.expanded && props.expanded === undefined) expanded.setExpanded(data.expanded);
    if (data.hiddenColumns && props.hiddenColumns === undefined) {
      columns.setHiddenColumns(data.hiddenColumns);
    }
    if (data.columnWidths) columns.setColumnWidths(data.columnWidths);

    for (const [columnId, value] of (data.filterValues as Map<Id, unknown> | undefined) ?? []) {
      const filter = filters.registry.current.get(columnId);
      if (!filter) {
        filters.pendingValues.current.set(columnId, value);
      } else if (filter.persist ?? filter.value === undefined) {
        filters.setInternalValues((values) => withEntry(values, columnId, value));
        filter.onChange?.(value);
      }
    }
  }

  const [isHydrated, clearStorage] = usePersistence(persist, persistData, restore, props.debug);
  const clearStorageRef = useRef(clearStorage);
  clearStorageRef.current = clearStorage;

  const lastSelectedId = useRef<Id | undefined>(undefined);

  // `latest` only catches up after the next render.
  function patchState(patch: Partial<TableState<T>>) {
    latest.current = { ...latest.current, state: { ...latest.current.state, ...patch } };
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

      registerFilter(columnId, filter) {
        const { filters } = get();
        filters.registry.current.set(columnId, filter);
        filters.setFilters(new Map(filters.registry.current));

        const pending = filters.pendingValues.current.get(columnId);
        if (pending !== undefined) {
          filters.pendingValues.current.delete(columnId);
        }

        if (pending !== undefined && (filter.persist ?? filter.value === undefined)) {
          filters.setInternalValues((values) => withEntry(values, columnId, pending));
          filter.onChange?.(pending);
        } else if (filter.defaultValue !== undefined && filter.value === undefined) {
          filters.setInternalValues((values) =>
            values.has(columnId) ? values : withEntry(values, columnId, filter.defaultValue),
          );
        }

        return () => {
          if (filters.registry.current.get(columnId) !== filter) return;
          filters.registry.current.delete(columnId);
          filters.setFilters(new Map(filters.registry.current));
          // A filter that is no longer rendered (its column got hidden) stops filtering for good.
          filters.setInternalValues((values) => withEntry(values, columnId, undefined));
          filters.setControlledValues((values) => withEntry(values, columnId, undefined));
        };
      },

      setFilterValue(columnId, value) {
        const { filters } = get();
        const filter = filters.registry.current.get(columnId);
        if (!filter) return;

        filter.onChange?.(value);
        if (filter.value === undefined) {
          filters.setInternalValues((values) => withEntry(values, columnId, value));
        }
      },

      syncControlledFilterValue(columnId, value) {
        get().filters.setControlledValues((values) =>
          values.get(columnId) === value ? values : withEntry(values, columnId, value),
        );
      },

      clearFilters() {
        const { state, filters } = get();
        filters.setInternalValues((values) => {
          const next = new Map(values);
          for (const column of state.activeColumns) next.delete(column.id);
          return next;
        });
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
      filters: state.filters,
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
      state.filters,
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
  };
}
