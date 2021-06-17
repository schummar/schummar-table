import { IconButton } from '@material-ui/core';
import { ChevronRight } from '@material-ui/icons';
import React from 'react';
import { getAncestors } from '../misc/helpers';
import { useTableContext } from '../table';
import { Id } from '../types';

export function ExpandComponent<T>({ itemId }: { itemId: Id }): JSX.Element {
  const state = useTableContext<T>();
  const isExpanded = state.useState((state) => state.expanded.has(itemId), [itemId]);

  function toggle() {
    const {
      props: { expanded: controlledExpanded, expandOnlyOne, onExpandedChange },
      expanded,
      activeItemsById,
    } = state.getState();

    const newExpanded = new Set(expanded);
    if (expandOnlyOne) newExpanded.clear();
    if (isExpanded) newExpanded.delete(itemId);
    else {
      newExpanded.add(itemId);

      for (const ancestor of getAncestors(activeItemsById, itemId)) {
        newExpanded.add(ancestor);
      }
    }

    if (!controlledExpanded) {
      state.update((state) => {
        state.expanded = newExpanded;
      });
    }

    onExpandedChange?.(newExpanded, itemId, isExpanded ? 'closed' : 'expanded');
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
