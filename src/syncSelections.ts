import { useEffect } from 'react';
import { Store } from 'schummar-state/react';
import { Id, InternalTableProps, InternalTableState } from './types';

export function syncSelections<T>(
  { selectSyncChildren, activeItemsByParentId }: InternalTableProps<T>,
  store: Store<InternalTableState>,
): void {
  useEffect(() => {
    if (!selectSyncChildren) return;

    return store.addReaction(
      (state) => state.selection,
      (selection, state) => {
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
        }
      },
      { runNow: true },
    );
  }, [selectSyncChildren, activeItemsByParentId, store]);
}
