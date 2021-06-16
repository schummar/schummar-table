import { Store } from 'schummar-state/react';
import { InternalTableProps, InternalTableState } from './types';

export function filterColumns<T>(props: InternalTableProps<T>, state: Store<InternalTableState>): InternalTableProps<T> {
  const activeColumns = state.useState(
    (state) =>
      props.columns.filter((column) => {
        console.log(column.id, state.visible);
        return state.visible.get(column.id) ?? true;
      }),
    [props.columns],
  );

  return { ...props, activeColumns };
}
