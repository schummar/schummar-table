import { useEffect, useMemo, useRef } from 'react';
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

  const expandOnlyOne = props.expandOnlyOne && !(props.revealFiltered && matching);

  const normalized = useMemo(() => {
    let result = value;
    const add = (id: Id) => {
      if (result.has(id)) return;
      if (result === value) result = new Set(value);
      result.add(id);
    };

    if (expandOnlyOne && value.size > 1) {
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

    return result;
  }, [value, itemsById, props.items, expandOnlyOne]);

  const expanded = useNormalized(value, normalized, setExpanded);

  // Once per filter result rather than in normalization, so revealed rows can be collapsed.
  const latest = useRef({ expanded, itemsById });
  useEffect(() => {
    latest.current = { expanded, itemsById };
  });
  useEffect(() => {
    if (!props.revealFiltered || !matching) return;
    const { expanded, itemsById } = latest.current;
    const next = new Set(expanded);
    for (const id of matching) {
      const parentId = itemsById.get(id)?.parentId;
      if (parentId !== undefined && parentId !== null) next.add(parentId);
    }
    if (next.size > expanded.size) setExpanded(next);
  }, [matching, props.revealFiltered, setExpanded]);

  return { expanded, expandOnlyOne, setExpanded, setExpandedInternal };
}
