import { IconButton } from '@material-ui/core';
import { ChevronRight } from '@material-ui/icons';
import React from 'react';
import { InternalTableProps } from './internalTypes';
import { TableScope } from './table';

export function useIsExpanded<T>({ expanded, id, item }: InternalTableProps<T> & { item: T }): boolean {
  const _id = id(item);
  return TableScope.useState(
    (state) => {
      const e = expanded ?? state.expanded;
      return e.has(_id);
    },
    [expanded, _id],
  );
}

export function Expand<T>(props: InternalTableProps<T> & { item: T }): JSX.Element {
  const { expanded, onExpandedChange, expandOnlyOne, id, item } = props;
  const isExpanded = useIsExpanded(props);
  const _id = id(item);
  const store = TableScope.useStore();

  function toggle() {
    const newExpanded = new Set(expanded ?? store.getState().expanded);
    if (expandOnlyOne) newExpanded.clear();
    if (isExpanded) newExpanded.delete(_id);
    else newExpanded.add(_id);

    if (!expanded) {
      store.update((state) => {
        state.expanded = newExpanded;
      });
    }

    onExpandedChange?.(newExpanded);
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
