import { useEffect } from 'react';
import { Store } from 'schummar-state/react';
import { InternalTableState } from '../types';

export function filterColumns<T>(state: Store<InternalTableState<T>>): void {
  useEffect(
    () =>
      state.addReaction(
        (state) => [state.props.columns, state.isHidden] as const,
        ([columns, isHidden], draft) => {
          draft.activeColumns = columns.filter((column) => !isHidden.get(column.id));
        },
        { runNow: true },
      ),
    [state],
  );
}
