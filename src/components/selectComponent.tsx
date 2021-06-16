import { Checkbox, styled } from '@material-ui/core';
import React from 'react';
import { getAncestors, getDescendants } from '../misc/helpers';
import { useTableContext } from '../table';
import { WithIds } from '../types';

const JustifiedCheckbox = styled(Checkbox)({
  justifySelf: 'start',
  color: 'inherit',
});

export function SelectComponent<T>({ item }: { item?: WithIds<T> }): JSX.Element {
  const state = useTableContext<T>();
  const isControlled = state.useState((state) => !!state.props.selection);
  const onSelectionChange = state.useState('props.onSelectionChange');
  const selectSyncChildren = state.useState('props.selectSyncChildren');
  const activeItems = state.useState('activeItems');
  const activeItemsById = state.useState('activeItemsById');
  const activeItemsByParentId = state.useState('activeItemsByParentId');

  const isSelected = state.useState(
    (state) => {
      return activeItems.length > 0 && (item ? [item] : activeItems).every((item) => state.selection.has(item.id));
    },
    [item, activeItems],
  );

  function toggle(e: React.ChangeEvent<HTMLInputElement>) {
    const mouseEvent = e.nativeEvent as MouseEvent;

    let range: WithIds<T>[];
    if (mouseEvent.shiftKey && item) {
      const a = state.getState().lastSelectedId ? activeItems.findIndex((i) => state.getState().lastSelectedId === i.id) : 0;
      const b = activeItems.indexOf(item);
      range = activeItems.slice(Math.min(a, b), Math.max(a, b) + 1);
    } else {
      range = item ? [item] : activeItems;
    }

    const newSelection = new Set(state.getState().selection);
    for (const item of range) {
      if (isSelected) newSelection.delete(item.id);
      else newSelection.add(item.id);
    }

    if (selectSyncChildren && isSelected) {
      for (const ancestor of getAncestors(activeItemsById, ...range)) {
        newSelection.delete(ancestor.id);
      }
      for (const descendant of getDescendants(activeItemsByParentId, ...range)) {
        newSelection.delete(descendant.id);
      }
    }

    if (!isControlled) {
      state.update((state) => {
        state.selection = newSelection;
      });
    }

    onSelectionChange?.(newSelection);

    state.update((state) => {
      state.lastSelectedId = item?.id;
    });
  }

  return <JustifiedCheckbox checked={isSelected} onChange={toggle} />;
}
