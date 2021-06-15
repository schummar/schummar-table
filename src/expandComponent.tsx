import { IconButton } from '@material-ui/core';
import { ChevronRight } from '@material-ui/icons';
import React from 'react';
import { useTableContext } from './table';

export function useIsExpanded<T>(item: T): boolean {
  const {
    state,
    props: { id },
  } = useTableContext<T>();
  const _id = id(item);
  return state.useState(
    (state) => {
      return state.expanded.has(_id);
    },
    [_id],
  );
}

export function ExpandComponent<T>({ item }: { item: T }): JSX.Element {
  const {
    state,
    props: { expanded, onExpandedChange, expandOnlyOne, id, itemsFiltered, parentId },
  } = useTableContext<T>();
  const isExpanded = useIsExpanded(item);
  const _id = id(item);

  function toggle() {
    const newExpanded = new Set(state.getState().expanded);
    if (expandOnlyOne) newExpanded.clear();
    if (isExpanded) newExpanded.delete(_id);
    else {
      newExpanded.add(_id);

      let i = item,
        parent;
      while ((parent = itemsFiltered.find((p) => id(p) === parentId?.(i)))) {
        newExpanded.add(id(parent));
        i = parent;
      }
    }

    if (!expanded) {
      state.update((state) => {
        state.expanded = newExpanded;
      });
    }

    onExpandedChange?.(newExpanded, item, isExpanded ? 'closed' : 'expanded');
  }

  return (
    <IconButton onClick={toggle}>
      <ChevronRight
        style={{
          transition: 'all 500ms',
          transform: isExpanded ? 'rotate3d(0, 0, 1, 90deg)' : 'none',
        }}
      />
    </IconButton>
  );
}
