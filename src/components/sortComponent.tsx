import { Badge, makeStyles } from '@material-ui/core';
import { ArrowDownward, ArrowUpward } from '@material-ui/icons';
import React, { ReactNode } from 'react';
import { useColumnContext, useTableContext } from '../table';

const useClasses = makeStyles({
  sortView: {
    userSelect: 'none',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) max-content',
    alignItems: 'center',
    cursor: 'pointer',

    '& > div': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  },

  empty: {
    width: 20,
  },
});

export function SortComponent<T>({ children }: { children: ReactNode }): JSX.Element {
  const classes = useClasses();
  const state = useTableContext<T>();
  const columnId = useColumnContext();
  const { direction, index } = state.useState((state) => {
    const index = state.sort.findIndex((s) => s.columnId === columnId) ?? -1;
    return {
      direction: state.sort[index]?.direction,
      index: index >= 0 ? index + 1 : undefined,
    };
  });

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
    <div className={classes.sortView} onClick={toggle}>
      <div>{children}</div>

      <Badge badgeContent={index}>
        {direction === 'asc' ? (
          <ArrowUpward fontSize="small" />
        ) : direction === 'desc' ? (
          <ArrowDownward fontSize="small" />
        ) : (
          <div className={classes.empty} />
        )}
      </Badge>
    </div>
  );
}
