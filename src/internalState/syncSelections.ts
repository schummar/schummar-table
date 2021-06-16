import { useEffect } from 'react';
import { Store } from 'schummar-state/react';
import { Id, InternalTableState } from '../types';

export function syncSelections<T>(state: Store<InternalTableState<T>>): void {
  useEffect(
    () =>
      state.addReaction(
        (state) => [state.props.onSelectionChange, state.selection, state.activeItemsByParentId] as const,
        ([onSelectionChange, selection, activeItemsByParentId], state) => {
          if (!state.props.selectSyncChildren) return;

          const newSelection = new Set(selection);
          const traverse = (parentId?: Id, force?: boolean): void => {
            for (const item of activeItemsByParentId.get(parentId) ?? []) {
              if (force) newSelection.add(item.id);
              traverse(item.id, force || newSelection.has(item.id));
            }
          };
          traverse();

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
