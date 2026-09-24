import { css } from '@emotion/react';
import { memo, useContext } from 'react';
import type React from 'react';
import { useTheme } from '../hooks/useTheme';
import { SelectionContext, useTableActions, useTableContext } from '../state/context';
import { useUserClassName } from '../theme/emotion';
import type { Id } from '../types';

// In the app cache, like a user override, so it beats the theme Checkbox's own colour.
const checkboxCss = css({ justifySelf: 'start', color: '#c9cfda' });

export const SelectComponent = memo(function SelectComponent({ itemId }: { itemId: Id }) {
  const selected = useContext(SelectionContext).has(itemId);
  const Checkbox = useTheme((t) => t.components.Checkbox);
  const overrideClass = useUserClassName();
  const actions = useTableActions();

  return (
    <Checkbox
      className={overrideClass(checkboxCss)}
      checked={selected}
      onChange={(event: React.ChangeEvent) =>
        actions.toggleSelection(itemId, { range: (event.nativeEvent as MouseEvent).shiftKey })
      }
    />
  );
});

export function SelectAll() {
  const Checkbox = useTheme((t) => t.components.Checkbox);
  const overrideClass = useUserClassName();
  const { activeItems, selection, actions } = useTableContext();
  const selected = activeItems.length > 0 && activeItems.every((item) => selection.has(item.id));

  return (
    <Checkbox
      className={overrideClass(checkboxCss)}
      checked={selected}
      onChange={() => actions.toggleSelection(undefined)}
    />
  );
}
