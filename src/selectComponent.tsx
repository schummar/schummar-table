import { Checkbox, styled } from '@material-ui/core';
import React from 'react';
import { useTableContext } from './table';

const JustifiedCheckbox = styled(Checkbox)({
  justifySelf: 'start',
});

export function SelectComponent<T>({ items }: { items: T[] }): JSX.Element {
  const {
    state,
    props: { onSelectionChange, id, selection },
  } = useTableContext<T>();

  const allSelected = state.useState(
    (state) => {
      return items.every((item) => state.selection.has(id(item)));
    },
    [items, id],
  );

  function toggle() {
    const newSelection = new Set(state.getState().selection);
    for (const item of items) {
      if (allSelected) newSelection.delete(id(item));
      else newSelection.add(id(item));
    }

    if (!selection) {
      state.update((state) => {
        state.selection = newSelection;
      });
    }

    onSelectionChange?.(newSelection);
  }

  return <JustifiedCheckbox checked={allSelected} onChange={toggle} />;
}
