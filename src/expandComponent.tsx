import { IconButton } from '@material-ui/core';
import { ChevronRight } from '@material-ui/icons';
import React from 'react';
import { getAncestors } from './helpers';
import { useTableContext } from './table';
import { WithIds } from './types';

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

export function ExpandComponent<T>({ item }: { item: WithIds<T> }): JSX.Element {
  const {
    state,
    props: { expanded, onExpandedChange, expandOnlyOne, activeItemsById },
  } = useTableContext<T>();
  const isExpanded = useIsExpanded(item);

  function toggle() {
    const newExpanded = new Set(state.getState().expanded);
    if (expandOnlyOne) newExpanded.clear();
    if (isExpanded) newExpanded.delete(item.id);
    else {
      newExpanded.add(item.id);

      for (const ancestor of getAncestors(activeItemsById, item)) {
        newExpanded.add(ancestor.id);
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
