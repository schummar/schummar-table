import { useEffect } from 'react';
import { Store } from 'schummar-state/react';
import { InternalTableState } from '../types';

export function filterColumns<T>(state: Store<InternalTableState<T>>): void {
  useEffect(
    () =>
      state.addReaction(
        (state) => [state.props.columns, state.hiddenColumns] as const,
        ([columns, hiddenColumns], draft) => {
          draft.activeColumns = columns.filter((column) => !hiddenColumns.has(column.id));
        },
        { runNow: true },
      ),
    [state],
  );
}
