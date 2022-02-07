import React from 'react';
import { getAncestors, getDescendants } from '../misc/helpers';
import { Id } from '../types';
import { useTableContext } from './table';

export function SelectComponent<T>({ itemId }: { itemId?: Id }): JSX.Element {
  const state = useTableContext<T>();
  const isSelected = state.useState(
    (state) => {
      const itemIds = itemId ? [itemId] : [...state.activeItemsById.keys()];
      return state.activeItemsById.size > 0 && itemIds.every((itemId) => state.selection.has(itemId));
    },
    [itemId],
  );
  const Checkbox = state.useState((state) => state.theme.components.Checkbox);

  function toggle(e: React.ChangeEvent) {
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

    onSelectionChange?.(newSelection);

    if (!controlledSelection) {
      state.update((state) => {
        state.selection = newSelection;
      });
    }

    state.update((state) => {
      state.lastSelectedId = itemId;
    });
  }

  return (
    <Checkbox
      css={{
        justifySelf: 'start',
        color: 'inherit',
      }}
      checked={isSelected}
      onChange={toggle}
    />
  );
}
