import { useEffect } from 'react';
import type { Store } from 'schummar-state/react';
import { getAncestors, orderBy } from '../misc/helpers';
import type { Id, InternalTableState } from '../types';

export function normalizeExpanded<T>(table: Store<InternalTableState<T>>): void {
  useEffect(
    () =>
      table.addReaction(
        (state) => [state.props.expandOnlyOne, state.expanded, state.itemsById] as const,
        ([expandOnlyOne, , itemsById], state) => {
          let expanded = state.expanded;
          let hasChanged = false;

          const allAncestors = [...expanded].map((id) => {
            const item = itemsById.get(id);
            return {
              id,
              ancestors: item ? getAncestors(itemsById, item) : new Set<Id>(),
            };
          });

          // If only one branch may be expanded, check if there are more and close if necessary
          if (expandOnlyOne) {
            const withMostAncestors = orderBy(allAncestors, [(x) => x.ancestors.size], ['desc'])[0];

            if (
              [...expanded].some(
                (id) => id !== withMostAncestors?.id && !withMostAncestors?.ancestors.has(id),
              )
            ) {
              expanded = withMostAncestors?.ancestors ?? new Set();
              state.expanded = expanded;

              state.props.onExpandedChange?.(expanded);
              return;
            }
          }

          for (const { ancestors } of allAncestors) {
            for (const ancestor of ancestors ?? []) {
              if (!expanded.has(ancestor)) {
                expanded.add(ancestor);
                hasChanged = true;
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
