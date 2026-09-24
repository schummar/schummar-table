import { memo, useContext } from 'react';
import type React from 'react';
import { useTheme } from '../hooks/useTheme';
import { SelectionContext, useTableActions, useTableContext } from '../state/context';
import type { Id } from '../types';

const checkboxCss = { justifySelf: 'start', color: '#c9cfda' } as const;

export const SelectComponent = memo(function SelectComponent({ itemId }: { itemId: Id }) {
  const selected = useContext(SelectionContext).has(itemId);
  const Checkbox = useTheme((t) => t.components.Checkbox);
  const actions = useTableActions();

  return (
    <Checkbox
      css={checkboxCss}
      checked={selected}
      onChange={(event: React.ChangeEvent) =>
        actions.toggleSelection(itemId, { range: (event.nativeEvent as MouseEvent).shiftKey })
      }
    />
  );
});

export function SelectAll() {
  const Checkbox = useTheme((t) => t.components.Checkbox);
  const { activeItems, selection, actions } = useTableContext();
  const selected = activeItems.length > 0 && activeItems.every((item) => selection.has(item.id));

  return (
    <Checkbox
      css={checkboxCss}
      checked={selected}
      onChange={() => actions.toggleSelection(undefined)}
    />
  );
}
