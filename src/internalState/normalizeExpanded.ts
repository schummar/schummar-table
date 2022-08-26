import { useEffect } from 'react';
import { Store } from 'schummar-state/react';
import { getAncestors } from '../misc/helpers';
import { InternalTableState } from '../types';

export function normalizeExpanded<T>(table: Store<InternalTableState<T>>): void {
  useEffect(
    () =>
      table.addReaction(
        (state) => [state.props.expandOnlyOne, state.expanded, state.itemsById] as const,
        ([expandOnlyOne, , itemsById], state) => {
          let expanded = state.expanded;
          let last, lastItem;
          let hasChanged = false;

          // If only one branch may be expanded, check if there are more and close if necessary
          if (expandOnlyOne && (last = [...expanded][expanded.size - 1]) && (lastItem = itemsById.get(last))) {
            const ancestors = getAncestors(itemsById, lastItem);
            if ([...expanded].slice(0, -1).some((id) => !ancestors.has(id))) {
              expanded = state.expanded = new Set([...ancestors].concat(last));
              hasChanged = true;
            }
          } else {
            for (const id of expanded) {
              const item = itemsById.get(id);
              const ancestors = item && getAncestors(itemsById, item);
              for (const ancestor of ancestors ?? []) {
                if (!expanded.has(ancestor)) {
                  expanded.add(ancestor);
                  hasChanged = true;
                }
              }
            }
          }

          if (hasChanged) {
            state.props.onExpandedChange?.(new Set(expanded));
          }
        },
        { runNow: true },
      ),
    [table],
  );
}
