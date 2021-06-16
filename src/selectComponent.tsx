import { Checkbox, styled } from '@material-ui/core';
import React from 'react';
import { getAncestors, getDescendants } from './helpers';
import { useTableContext } from './table';

const JustifiedCheckbox = styled(Checkbox)({
  justifySelf: 'start',
});

export function SelectComponent<T>({ item }: { item?: T }): JSX.Element {
  const {
    state,
    props: { onSelectionChange, id, selection, itemsFiltered, selectSyncChildren, itemsTree, parentId },
  } = useTableContext<T>();

  const isSelected = state.useState(
    (state) => {
      return itemsFiltered.length > 0 && (item ? [item] : itemsFiltered).every((item) => state.selection.has(id(item)));
    },
    [item, itemsFiltered, id],
  );

  function toggle(e: React.ChangeEvent<HTMLInputElement>) {
    const mouseEvent = e.nativeEvent as MouseEvent;

    let range: T[];
    if (mouseEvent.shiftKey && item) {
      const a = state.getState().lastSelectedId ? itemsFiltered.findIndex((i) => state.getState().lastSelectedId === id(i)) : 0;
      const b = itemsFiltered.indexOf(item);
      range = itemsFiltered.slice(Math.min(a, b), Math.max(a, b) + 1);
    } else {
      range = item ? [item] : itemsFiltered;
    }

    const newSelection = new Set(state.getState().selection);
    for (const item of range) {
      if (isSelected) newSelection.delete(id(item));
      else newSelection.add(id(item));
    }

    if (selectSyncChildren && isSelected) {
      const ancestors = getAncestors(range, itemsFiltered, { id, parentId });
      for (const ancestor of ancestors) newSelection.delete(id(ancestor));
      const descendants = getDescendants(range, itemsFiltered, { id, parentId });
      for (const descendant of descendants) newSelection.delete(id(descendant));
    }

    if (!selection) {
      state.update((state) => {
        state.selection = newSelection;
      });
    }

    onSelectionChange?.(newSelection);

    state.update((state) => {
      state.lastSelectedId = item && id(item);
    });
  }

  return <JustifiedCheckbox checked={isSelected} onChange={toggle} />;
}
