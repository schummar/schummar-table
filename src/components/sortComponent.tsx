import React, { ReactNode } from 'react';
import { useTheme } from '..';
import { useColumnContext, useTableContext } from './table';

export function SortComponent<T>({ children }: { children: ReactNode }): JSX.Element {
  const table = useTableContext<T>();
  const columnId = useColumnContext();
  const {
    components: { Badge },
    icons: { ArrowUpward },
  } = useTheme();

  const { direction, index } = table.useState((state) => {
    const index = state.sort.findIndex((s) => s.columnId === columnId) ?? -1;
    return {
      direction: state.sort[index]?.direction,
      index: index >= 0 && state.sort.length > 1 ? index + 1 : undefined,
    };
  });

  function toggle(e: React.MouseEvent, off?: boolean) {
    const {
      props: { sort: controlledSort, onSortChange },
    } = table.getState();

    const newDirection = direction === 'asc' ? 'desc' : 'asc';
    const newSort = (e.getModifierState('Control') ? table.getState().sort.filter((s) => s.columnId !== columnId) : []).concat(
      off
        ? []
        : {
            columnId,
            direction: newDirection,
          },
    );

    onSortChange?.(newSort);

    if (!controlledSort) {
      table.update((state) => {
        state.sort = newSort;
      });
    }

    e.preventDefault();
    return false;
  }

  return (
    <div
      css={{
        userSelect: 'none',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) max-content',
        alignItems: 'center',
        cursor: 'pointer',

        '& > div': {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
      }}
      onClick={(e) => toggle(e)}
      onContextMenu={(e) => toggle(e, true)}
    >
      <div>{children}</div>

      <Badge badgeContent={index}>
        <span
          css={[
            { transition: 'all 300ms', fontSize: '0.8em' },
            !direction && { opacity: 0 },
            direction === 'desc' && { transform: 'rotate3d(0, 0, 1, 180deg)' },
          ]}
        >
          <ArrowUpward />
        </span>
      </Badge>
    </div>
  );
}
