import type { MouseEvent, ReactElement } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useTableActions } from '../state/context';
import type { Id } from '../types';

export function ExpandControl({
  itemId,
  expanded,
  hasChildren,
  hasDeferredChildren,
}: {
  itemId: Id;
  expanded: boolean;
  hasChildren: boolean;
  hasDeferredChildren?: boolean;
}): ReactElement {
  const IconButton = useTheme((t) => t.components.IconButton);
  const Spinner = useTheme((t) => t.components.Spinner);
  const ChevronRight = useTheme((t) => t.icons.ChevronRight);
  const actions = useTableActions();

  function toggle(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    actions.toggleExpanded(itemId);
  }

  if (expanded && hasDeferredChildren && !hasChildren) {
    return <Spinner css={{ margin: '0 var(--spacing)' }} />;
  }

  return (
    <IconButton onClick={toggle}>
      <span
        css={{
          display: 'inline-flex',
          transition: 'all 300ms',
          transform: expanded ? 'rotate3d(0, 0, 1, 90deg)' : 'rotate3d(0, 0, 1, 0deg)',
        }}
      >
        <ChevronRight />
      </span>
    </IconButton>
  );
}
