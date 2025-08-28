import type { MouseEvent } from 'react';
import { useTheme } from '../hooks/useTheme';
import { getAncestors, getDescendants } from '../misc/helpers';
import { useTableContext } from '../misc/tableContext';
import type { Id } from '../types';

export function ExpandControl<T>({
  itemId,
  hasDeferredChildren,
}: {
  itemId: Id;
  hasDeferredChildren?: boolean;
}): JSX.Element {
  const IconButton = useTheme((t) => t.components.IconButton);
  const Spinner = useTheme((t) => t.components.Spinner);
  const ChevronRight = useTheme((t) => t.icons.ChevronRight);

  const table = useTableContext<T>();
  const isExpanded = table.useState((state) => state.expanded.has(itemId));
  const hasChildren = table.useState(
    (state) => !!state.activeItemsById.get(itemId)?.children.length,
  );

  function toggle(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const {
      props: { expanded: controlledExpanded, expandOnlyOne, onExpandedChange },
      expanded,
      activeItemsById,
    } = table.getState();

    const newExpanded = new Set(expanded);

    if (expandOnlyOne) {
      newExpanded.clear();

      const item = activeItemsById.get(itemId);
      for (const ancestor of item ? getAncestors(activeItemsById, item) : []) {
        newExpanded.add(ancestor);
      }
    }

    if (isExpanded) {
      newExpanded.delete(itemId);

      const item = activeItemsById.get(itemId);
      for (const descendant of item ? getDescendants(item) : []) {
        newExpanded.delete(descendant);
      }
    } else {
      newExpanded.add(itemId);
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
