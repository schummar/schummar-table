import { useEffect } from 'react';
import { Store } from 'schummar-state/react';
import { InternalTableState } from '../types';

export function syncSelections<T>(state: Store<InternalTableState<T>>): void {
  useEffect(
    () =>
      state.addReaction(
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
            state.props.onSelectionChange?.(newSelection);
          }
        },
        { runNow: true },
      ),
    [state],
  );
}
