import { useEffect } from 'react';
import { Store } from 'schummar-state/react';
import { InternalTableState } from '../types';

export function syncSelections<T>(state: Store<InternalTableState<T>>): void {
  useEffect(
    () =>
      state.addReaction(
        (state) => [state.props.onSelectionChange, state.selection, state.activeItems] as const,
        ([onSelectionChange, selection, activeItems], state) => {
          if (!state.props.selectSyncChildren) return;

          const newSelection = new Set(selection);
          for (const item of activeItems) {
            if (item.parentId !== undefined && newSelection.has(item.parentId)) {
              newSelection.add(item.id);
            }
          }

          if (newSelection.size !== selection.size) {
            state.selection = newSelection;
            onSelectionChange?.(newSelection);
          }
        },
        { runNow: true },
      ),
    [state],
  );
}
