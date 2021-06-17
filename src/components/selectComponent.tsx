import { Checkbox, styled } from '@material-ui/core';
import React from 'react';
import { getAncestors, getDescendants } from '../misc/helpers';
import { useTableContext } from '../table';
import { Id } from '../types';

const JustifiedCheckbox = styled(Checkbox)({
  justifySelf: 'start',
  color: 'inherit',
});

export function SelectComponent<T>({ itemId }: { itemId?: Id }): JSX.Element {
  const state = useTableContext<T>();
  const isSelected = state.useState(
    (state) => {
      const itemIds = itemId ? [itemId] : [...state.activeItemsById.keys()];
      return state.activeItemsById.size > 0 && itemIds.every((itemId) => state.selection.has(itemId));
    },
    [itemId],
  );

  state.getState().props.debug?.('render selectComponent', itemId);

  function toggle(e: React.ChangeEvent<HTMLInputElement>) {
    const mouseEvent = e.nativeEvent as MouseEvent;

    const {
      activeItems,
      activeItemsById,
      activeItemsByParentId,
      lastSelectedId,
      selection,
      props: { selectSyncChildren, selection: controlledSelection, onSelectionChange },
    } = state.getState();

    let range: Id[];
    if (mouseEvent.shiftKey && itemId) {
      const a = lastSelectedId ? activeItems.findIndex((i) => lastSelectedId === i.id) : 0;
      const b = activeItems.findIndex((item) => item.id === itemId);
      range = activeItems.slice(Math.min(a, b), Math.max(a, b) + 1).map((item) => item.id);
    } else {
      range = itemId ? [itemId] : [...activeItemsById.keys()];
    }

    const newSelection = new Set(selection);
    for (const itemId of range) {
      if (isSelected) newSelection.delete(itemId);
      else newSelection.add(itemId);
    }

    console.log('sync?', selectSyncChildren, isSelected);
    if (selectSyncChildren && isSelected) {
      console.log('sync', getAncestors(activeItemsById, ...range));
      for (const ancestor of getAncestors(activeItemsById, ...range)) {
        newSelection.delete(ancestor);
      }
      for (const descendant of getDescendants(activeItemsByParentId, ...range)) {
        newSelection.delete(descendant);
      }
    }

    if (!controlledSelection) {
      state.update((state) => {
        state.selection = newSelection;
      });
    }

    onSelectionChange?.(newSelection, range, isSelected ? 'deselected' : 'selected');

    state.update((state) => {
      state.lastSelectedId = itemId;
    });
  }

  return <JustifiedCheckbox checked={isSelected} onChange={toggle} />;
}
