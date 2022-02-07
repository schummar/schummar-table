import React, { ReactNode } from 'react';
import { useColumnContext, useTableContext } from './table';

export function SortComponent<T>({ children }: { children: ReactNode }): JSX.Element {
  const state = useTableContext<T>();
  const columnId = useColumnContext();
  const { direction, index } = state.useState((state) => {
    const index = state.sort.findIndex((s) => s.columnId === columnId) ?? -1;
    return {
      direction: state.sort[index]?.direction,
      index: index >= 0 && state.sort.length > 1 ? index + 1 : undefined,
    };
  });
  const Badge = state.useState((state) => state.theme.components.Badge);
  const ArrowUpwardIcon = state.useState((state) => state.theme.icons.ArrowUpward);

  function toggle(e: React.MouseEvent) {
    const {
      props: { sort: controlledSort, onSortChange },
    } = state.getState();

    const newDirection = direction === 'asc' ? 'desc' : 'asc';
    const newSort = (e.getModifierState('Control') ? state.getState().sort.filter((s) => s.columnId !== columnId) : []).concat({
      columnId,
      direction: newDirection,
    });

    onSortChange?.(newSort);

    if (!controlledSort) {
      state.update((state) => {
        state.sort = newSort;
      });
    }
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
      onClick={toggle}
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
          <ArrowUpwardIcon />
        </span>
      </Badge>
    </div>
  );
}
