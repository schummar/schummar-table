import { useEffect } from 'react';
import type { Store } from 'schummar-state/react';
import { orderBy } from '../misc/helpers';
import type { InternalTableState } from '../types';

export function filterColumns<T>(state: Store<InternalTableState<T>>): void {
  useEffect(
    () =>
      state.addReaction(
        (state) =>
          [
            state.props.columns,
            state.hiddenColumns,
            state.columnOrder,
            state.displaySize,
            state.displaySizePx,
          ] as const,
        ([columns, hiddenColumns, columnOrder, displaySize], draft) => {
          draft.activeColumns = orderBy(
            columns.filter((column) => !(column.hidden ?? hiddenColumns.has(column.id))),
            [(column) => columnOrder.indexOf(column.id)],
          );

          draft.visibleColumns = draft.activeColumns.filter(
            (column) =>
              displaySize === undefined ||
              column.displaySize === undefined ||
              column.displaySize.includes(displaySize),
          );
        },
        { runNow: true },
      ),
    [state],
  );
}
