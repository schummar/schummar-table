import { useEffect } from 'react';
import { Store } from 'schummar-state/react';
import { TreeNode } from './helpers';
import { InternalTableProps, InternalTableState } from './types';

export function syncSelections<T>({ selectSyncChildren, id, itemsTree }: InternalTableProps<T>, store: Store<InternalTableState>): void {
  useEffect(() => {
    if (!selectSyncChildren) return;

    return store.addReaction(
      (state) => state.selection,
      (selection, state) => {
        const newSelection = new Set(selection);
        const traverse = (tree: TreeNode<T>[], force?: boolean): void => {
          for (const { item, children } of tree) {
            if (force) newSelection.add(id(item));
            traverse(children, force || newSelection.has(id(item)));
          }
        };
        traverse(itemsTree);

        if (newSelection.size !== selection.size) {
          state.selection = newSelection;
        }
      },
      { runNow: true },
    );
  }, [selectSyncChildren, id, itemsTree, store]);
}
