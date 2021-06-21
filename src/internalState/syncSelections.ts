import { useEffect } from 'react';
import { Store } from 'schummar-state/react';
import { InternalTableState, TableItem } from '../types';

export function syncSelections<T>(state: Store<InternalTableState<T>>): void {
  useEffect(
    () =>
      state.addReaction(
        (state) => [state.props.onSelectionChange, state.selection, state.activeItems] as const,
        ([onSelectionChange, selection, activeItems], state) => {
          if (!state.props.selectSyncChildren) return;

          const newSelection = new Set(selection);
          const traverse = (items: TableItem<T>[], force?: boolean): void => {
            for (const item of items) {
              if (force) newSelection.add(item.id);
              traverse(item.children, force || newSelection.has(item.id));
            }
          };
          traverse(activeItems.filter((item) => item.parentId === undefined));

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
