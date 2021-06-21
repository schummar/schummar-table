import { Checkbox, makeStyles } from '@material-ui/core';
import React from 'react';
import { getAncestors, getDescendants } from '../misc/helpers';
import { useTableContext } from '../table';
import { Id } from '../types';

const useClasses = makeStyles({
  justifiedCheckbox: {
    justifySelf: 'start',
    color: 'inherit',
  },
});

export function SelectComponent<T>({ itemId }: { itemId?: Id }): JSX.Element {
  const classes = useClasses();
  const state = useTableContext<T>();
  const isSelected = state.useState(
    (state) => {
      const itemIds = itemId ? [itemId] : [...state.activeItemsById.keys()];
      return state.activeItemsById.size > 0 && itemIds.every((itemId) => state.selection.has(itemId));
    },
    [itemId],
  );

  function toggle(e: React.ChangeEvent<HTMLInputElement>) {
    const mouseEvent = e.nativeEvent as MouseEvent;

    const {
      activeItems,
      activeItemsById,
      lastSelectedId,
      selection,
      props: { selectSyncChildren, selection: controlledSelection, onSelectionChange },
    } = state.getState();

    let range;
    if (mouseEvent.shiftKey && itemId) {
      const a = lastSelectedId ? activeItems.findIndex((i) => lastSelectedId === i.id) : 0;
      const b = activeItems.findIndex((item) => item.id === itemId);
      range = activeItems.slice(Math.min(a, b), Math.max(a, b) + 1);
    } else {
      const item = itemId ? activeItemsById.get(itemId) : undefined;
      range = item ? [item] : activeItems;
    }

    const newSelection = new Set(selection);
    for (const item of range) {
      if (isSelected) newSelection.delete(item.id);
      else newSelection.add(item.id);
    }

    if (selectSyncChildren && isSelected) {
      for (const ancestor of getAncestors(activeItemsById, ...range)) {
        newSelection.delete(ancestor);
      }
      for (const descendant of getDescendants(...range)) {
        newSelection.delete(descendant);
      }
    }

    if (!controlledSelection) {
      state.update((state) => {
        state.selection = newSelection;
      });
    }

    onSelectionChange?.(newSelection);

    state.update((state) => {
      state.lastSelectedId = itemId;
    });
  }

  return <Checkbox className={classes.justifiedCheckbox} checked={isSelected} onChange={toggle} />;
}
