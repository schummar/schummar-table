import React from 'react';
import { useTheme } from '..';
import { getAncestors } from '../misc/helpers';
import { Id } from '../types';
import { useTableContext } from './table';

export function ExpandControl<T>({ itemId, hasDeferredChildren }: { itemId: Id; hasDeferredChildren?: boolean }): JSX.Element {
  const {
    components: { IconButton, Spinner },
    icons: { ChevronRight },
  } = useTheme();

  const table = useTableContext<T>();
  const isExpanded = table.useState((state) => state.expanded.has(itemId));
  const hasChildren = table.useState((state) => !!state.activeItemsById.get(itemId)?.children.length);

  function toggle() {
    const {
      props: { expanded: controlledExpanded, expandOnlyOne, onExpandedChange },
      expanded,
      activeItemsById,
    } = table.getState();

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
      table.update((state) => {
        state.expanded = newExpanded;
      });
    }
  }

  if (isExpanded && hasDeferredChildren && !hasChildren) {
    return <Spinner css={{ margin: '0 var(--spacing)' }} />;
  }

  return (
    <IconButton onClick={toggle}>
      <span
        css={{
          display: 'inline-flex',
          transition: 'all 300ms',
          transform: isExpanded ? 'rotate3d(0, 0, 1, 90deg)' : 'rotate3d(0, 0, 1, 0deg)',
        }}
      >
        <ChevronRight />
      </span>
    </IconButton>
  );
}
