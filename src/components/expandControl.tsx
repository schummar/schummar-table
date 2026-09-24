import { css } from '@emotion/react';
import type { MouseEvent, ReactElement } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useTableActions } from '../state/context';
import { useLibraryClassName } from '../theme/emotion';
import type { Id } from '../types';

const spinnerCss = css({ margin: '0 var(--spacing)' });

const chevronCss = css({
  display: 'inline-flex',
  transition: 'all 300ms',
  transform: 'rotate3d(0, 0, 1, 0deg)',
});

const expandedChevronCss = css({ transform: 'rotate3d(0, 0, 1, 90deg)' });

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
  const libraryClass = useLibraryClassName();

  function toggle(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    actions.toggleExpanded(itemId);
  }

  if (expanded && hasDeferredChildren && !hasChildren) {
    return <Spinner className={libraryClass(spinnerCss)} />;
  }

  return (
    <IconButton onClick={toggle}>
      <span className={libraryClass(chevronCss, expanded && expandedChevronCss)}>
        <ChevronRight />
      </span>
    </IconButton>
  );
}
