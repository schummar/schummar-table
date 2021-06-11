import { Badge, styled } from '@material-ui/core';
import { ArrowDownward, ArrowUpward } from '@material-ui/icons';
import React, { ReactNode } from 'react';
import { InternalColumn, InternalTableProps, TableScope } from './table';

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

export function Sort<T>({ column, children, defaultSort }: InternalTableProps<T> & { column: InternalColumn<T>; children: ReactNode }) {
  const state = TableScope.useStore();
  const { direction, index } = (() => {
    const sort = state.useState((state) => state.sort) ?? defaultSort;
    const index = sort?.findIndex((s) => s.id === column.id) ?? -1;

    return {
      direction: sort?.[index]?.direction,
      index: (sort?.length ?? 0) > 1 && index >= 0 ? index + 1 : undefined,
    };
  })();

  function toggle(e: React.MouseEvent) {
    state.update((state) => {
      const sort = (state.sort ?? defaultSort ?? []).find((x) => x.id === column.id);
      const direction: 'asc' | 'desc' = sort?.direction === 'asc' ? 'desc' : 'asc';
      const update = { id: column.id, direction };
      if (e.getModifierState('Control')) state.sort = (state.sort ?? defaultSort ?? []).filter((x) => x.id !== column.id).concat(update);
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
