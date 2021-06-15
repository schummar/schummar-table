import { Badge, styled } from '@material-ui/core';
import { ArrowDownward, ArrowUpward } from '@material-ui/icons';
import React, { ReactNode } from 'react';
import { useColumnContext } from './table';

const SortView = styled('div')({
  userSelect: 'none',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) max-content',
  alignItems: 'center',
  cursor: 'pointer',

  '& > div': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});

const Empty = styled('div')({
  width: 20,
});

export function SortComponent<T, V>({ children }: { children: ReactNode }): JSX.Element {
  const { state, column } = useColumnContext<T, V>();

  const { direction, index } = (() => {
    const sort = state.useState((state) => state.sort);
    const index = sort?.findIndex((s) => s.columnId === column.id) ?? -1;

    return {
      direction: sort?.[index]?.direction,
      index: (sort?.length ?? 0) > 1 && index >= 0 ? index + 1 : undefined,
    };
  })();

  function toggle(e: React.MouseEvent) {
    state.update((state) => {
      const sort = state.sort.find((x) => x.columnId === column.id);
      const direction: 'asc' | 'desc' = sort?.direction === 'asc' ? 'desc' : 'asc';
      const update = { columnId: column.id, direction };
      if (e.getModifierState('Control')) state.sort = state.sort.filter((x) => x.columnId !== column.id).concat(update);
      else state.sort = [update];
    });
  }

  return (
    <SortView onClick={toggle}>
      <div>{children}</div>

      <Badge badgeContent={index}>
        {/* <IconButton size="small"> */}
        {direction === 'asc' ? <ArrowUpward fontSize="small" /> : direction === 'desc' ? <ArrowDownward fontSize="small" /> : <Empty />}
        {/* </IconButton> */}
      </Badge>
    </SortView>
  );
}
