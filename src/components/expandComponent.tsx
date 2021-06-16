import { IconButton } from '@material-ui/core';
import { ChevronRight } from '@material-ui/icons';
import React from 'react';
import { getAncestors } from '../misc/helpers';
import { useTableContext } from '../table';
import { WithIds } from '../types';

export function ExpandComponent<T>({ item }: { item: WithIds<T> }): JSX.Element {
  const state = useTableContext<T>();
  const isControlled = state.useState((state) => !!state.props.expanded);
  const isExpanded = state.useState((state) => state.expanded.has(item.id), [item.id]);
  const onExpandedChange = state.useState('props.onExpandedChange');
  const expandOnlyOne = state.useState('props.expandOnlyOne');
  const activeItemsById = state.useState('activeItemsById');

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

    if (!isControlled) {
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
