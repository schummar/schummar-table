import { useEffect } from 'react';
import { Store } from 'schummar-state/react';
import { InternalTableState } from '../types';

export function syncSelections<T>(table: Store<InternalTableState<T>>): void {
  useEffect(
    () =>
      table.addReaction(
        (state) => [state.props.selectSyncChildren, state.selection, state.activeItems] as const,
        ([selectSyncChildren, selection, activeItems], state) => {
          if (!selectSyncChildren) return;

          const newSelection = new Set(selection);
          for (const item of activeItems) {
            if (item.parentId !== undefined && newSelection.has(item.parentId)) {
              newSelection.add(item.id);
            }
          }

          if (newSelection.size !== selection.size) {
            state.selection = newSelection;
            setTimeout(() => {
              table.getState().props.onSelectionChange?.(newSelection);
            });
          }
        },
        { runNow: true },
      ),
    [table],
  );
}
