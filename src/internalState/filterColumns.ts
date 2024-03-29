import { useEffect } from 'react';
import type { Store } from 'schummar-state/react';
import { orderBy } from '../misc/helpers';
import type { InternalTableState } from '../types';

export function filterColumns<T>(state: Store<InternalTableState<T>>): void {
  useEffect(
    () =>
      state.addReaction(
        (state) => [state.props.columns, state.hiddenColumns, state.columnOrder] as const,
        ([columns, hiddenColumns, columnOrder], draft) => {
          draft.activeColumns = orderBy(
            columns.filter((column) => !(column.hidden ?? hiddenColumns.has(column.id))),
            [(column) => columnOrder.indexOf(column.id)],
          );
        },
        { runNow: true },
      ),
    [state],
  );
}
