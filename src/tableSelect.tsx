import { Checkbox, styled } from '@material-ui/core';
import React from 'react';
import { InternalTableProps, TableScope } from './table';

const JustifiedCheckbox = styled(Checkbox)({
  justifySelf: 'end',
});

export function AllSelect<T>({ selection: controlledSelection, onSelectionChange, data = [] }: InternalTableProps<T>) {
  const state = TableScope.useStore();
  const internalSelection = state.useState((state) => state.selection);
  const selection = controlledSelection ?? internalSelection;
  const allSelected = data.every((item) => selection.has(item));

  function toggle() {
    if (!controlledSelection) {
      state.update((state) => {
        if (allSelected) state.selection = new Set();
        else state.selection = new Set(data);
      });
    }

    if (onSelectionChange) {
      if (allSelected) onSelectionChange(new Set());
      else onSelectionChange(new Set(data));
    }
  }

  return <JustifiedCheckbox checked={allSelected} onChange={toggle} />;
}

export function GroupSelect<T>({ selection: controlledSelection, onSelectionChange, items }: InternalTableProps<T> & { items: T[] }) {
  const state = TableScope.useStore();
  const internalSelection = state.useState((state) => state.selection);
  const selection = controlledSelection ?? internalSelection;
  const allSelected = items.every((item) => selection.has(item));

  function toggle() {
    if (!controlledSelection) {
      state.update((state) => {
        if (allSelected) state.selection = new Set();
        else state.selection = new Set(items);
      });
    }

    if (onSelectionChange) {
      if (allSelected) onSelectionChange(new Set());
      else onSelectionChange(new Set(items));
    }
  }

  return <JustifiedCheckbox checked={allSelected} onChange={toggle} />;
}

export function RowSelect<T>({ selection: controlledSelection, onSelectionChange, item }: InternalTableProps<T> & { item: T }) {
  const state = TableScope.useStore();
  const internalIsSelected = state.useState((state) => state.selection.has(item), [item]);
  const isSelected = controlledSelection ? controlledSelection.has(item) : internalIsSelected;

  function toggle() {
    state.update((state) => {
      const selection = controlledSelection ?? state.selection;

      if (onSelectionChange) {
        const newSet = new Set(selection);
        if (selection.has(item)) newSet.delete(item);
        else newSet.add(item);
        onSelectionChange(newSet as Set<T>);
      }

      if (!controlledSelection) {
        if (state.selection.has(item)) state.selection.delete(item);
        else state.selection.add(item);
      }
    });
  }

  return <JustifiedCheckbox checked={isSelected} onChange={toggle} />;
}
