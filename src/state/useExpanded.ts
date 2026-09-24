import { useMemo } from 'react';
import { getAncestors } from '../misc/helpers';
import type { Id, InternalTableProps, TableItem } from '../types';
import { useControllableState, useNormalized } from './useControllableState';

export function useExpanded<T>(
  props: InternalTableProps<T>,
  itemsById: Map<Id, TableItem<T>>,
  matching: Set<Id> | undefined,
) {
  const [value, setExpanded, setExpandedInternal] = useControllableState(
    props.expanded,
    () => props.defaultExpanded ?? new Set<Id>(),
    props.onExpandedChange,
  );

  const normalized = useMemo(() => {
    let result = value;
    const add = (id: Id) => {
      if (result.has(id)) return;
      if (result === value) result = new Set(value);
      result.add(id);
    };

    if (props.expandOnlyOne && value.size > 1) {
      // Keep the deepest expanded item and its ancestors, collapse every other branch.
      const deepest = [...value]
        .map((id) => itemsById.get(id))
        .filter((item) => item !== undefined)
        .sort((a, b) => b.depth - a.depth)[0];
      const branch = deepest ? getAncestors(itemsById, deepest).add(deepest.id) : new Set<Id>();
      if ([...value].some((id) => !branch.has(id))) return branch;
    }

    for (const id of value) {
      const item = itemsById.get(id);
      if (item) getAncestors(itemsById, item).forEach(add);
    }

    if (props.items !== undefined) {
      for (const id of value) {
        if (!itemsById.has(id)) {
          if (result === value) result = new Set(value);
          result.delete(id);
        }
      }
    }

    // Parents of matching items, so matches nested in collapsed branches become visible.
    if (props.revealFiltered && matching) {
      for (const id of matching) {
        const parentId = itemsById.get(id)?.parentId;
        if (parentId !== undefined && parentId !== null) add(parentId);
      }
    }

    return result;
  }, [value, itemsById, matching, props.items, props.expandOnlyOne, props.revealFiltered]);

  const expanded = useNormalized(value, normalized, setExpanded);

  return { expanded, setExpanded, setExpandedInternal };
}
