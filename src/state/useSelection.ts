import { useMemo } from 'react';
import type { Id, InternalTableProps, TableItem } from '../types';
import { useControllableState, useNormalized } from './useControllableState';

export function useSelection<T>(
  props: InternalTableProps<T>,
  activeItems: TableItem<T>[],
  activeItemsById: Map<Id, TableItem<T>>,
) {
  const [value, setSelection, setSelectionInternal] = useControllableState(
    props.selection,
    () => props.defaultSelection ?? new Set<Id>(),
    props.onSelectionChange,
  );

  const hasItems = props.items !== undefined;

  const normalized = useMemo(() => {
    let result = value;
    const copy = () => (result === value ? (result = new Set(value)) : result);

    if (props.selectSyncChildren) {
      for (const item of activeItems) {
        if (
          item.parentId !== undefined &&
          item.parentId !== null &&
          result.has(item.parentId) &&
          !result.has(item.id)
        ) {
          copy().add(item.id);
        }
      }
    }

    // Selection only covers what is shown: filtered out or collapsed items are deselected.
    if (hasItems) {
      for (const id of result) {
        if (!activeItemsById.has(id)) copy().delete(id);
      }
    }

    return result;
  }, [value, activeItems, activeItemsById, props.selectSyncChildren, hasItems]);

  const selection = useNormalized(value, normalized, setSelection);

  return { selection, setSelection, setSelectionInternal };
}
