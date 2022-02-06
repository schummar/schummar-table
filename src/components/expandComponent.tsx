import React from 'react';
import { getAncestors } from '../misc/helpers';
import { useTableContext } from './table';
import { Id } from '../types';

export function ExpandComponent<T>({ itemId }: { itemId: Id }): JSX.Element {
  const state = useTableContext<T>();
  const isExpanded = state.useState((state) => state.expanded.has(itemId), [itemId]);
  const IconButton = state.useState((state) => state.theme.components.IconButton);
  const ChevronRightIcon = state.useState((state) => state.theme.icons.ChevronRightIcon);

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

      const item = activeItemsById.get(itemId);
      for (const ancestor of item ? getAncestors(activeItemsById, item) : []) {
        newExpanded.add(ancestor);
      }
    }

    onExpandedChange?.(newExpanded);

    if (!controlledExpanded) {
      state.update((state) => {
        state.expanded = newExpanded;
      });
    }
  }

  return (
    <IconButton onClick={toggle}>
      <ChevronRightIcon
        css={{
          transition: 'all 500ms',
          transform: isExpanded ? 'rotate3d(0, 0, 1, 90deg)' : 'none',
        }}
      />
    </IconButton>
  );
}
