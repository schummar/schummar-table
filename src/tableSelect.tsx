import { Checkbox, styled } from '@material-ui/core';
import React from 'react';
import { InternalTableProps } from './internalTypes';
import { TableScope } from './table';

const JustifiedCheckbox = styled(Checkbox)({
  justifySelf: 'start',
});

export function Select<T>({
  selection,
  onSelectionChange,
  items,
  indent = 0,
}: InternalTableProps<T> & { items: T[]; indent?: number }): JSX.Element {
  const store = TableScope.useStore();
  const allSelected = store.useState(
    (state) => {
      const s = selection ?? state.selection;
      return items.every((item) => s.has(item));
    },
    [items, selection],
  );

  function toggle() {
    const newSelection = new Set(selection ?? store.getState().selection);
    for (const item of items) {
      if (allSelected) newSelection.delete(item);
      else newSelection.add(item);
    }

    if (!selection) {
      store.update((state) => {
        state.selection = newSelection;
      });
    }

    if (onSelectionChange) {
      onSelectionChange(newSelection);
    }
  }

  return <JustifiedCheckbox checked={allSelected} onChange={toggle} style={{ marginLeft: indent * 20 }} />;
}
