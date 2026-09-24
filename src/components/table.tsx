import type { ReactElement, Ref } from 'react';
import { ThemeContext } from '../hooks/useTheme';
import {
  SelectionContext,
  TableActionsContext,
  TableContext,
  TableStructureContext,
} from '../state/context';
import { useTable } from '../state/useTable';
import { useTableImperativeHandle } from '../state/useTableImperativeHandle';
import { useTableReset } from '../state/useTableReset';
import type { TableProps, TableRef } from '../types';
import { TableGrid } from './tableGrid';
import { TableLoadingState } from './tableLoadingState';

export function Table<T>({ ref, ...props }: TableProps<T> & { ref?: Ref<TableRef> }): ReactElement {
  const [resetKey, onReset] = useTableReset(props);
  return <TableWithState key={resetKey} props={props} tableRef={ref} onReset={onReset} />;
}

function TableWithState<T>({
  props,
  tableRef,
  onReset,
}: {
  props: TableProps<T>;
  tableRef?: Ref<TableRef>;
  onReset: () => void;
}): ReactElement {
  const table = useTable(props, onReset);
  const { context, structure, actions, theme, isHydrated } = table;
  useTableImperativeHandle(tableRef, table);

  return (
    <ThemeContext.Provider value={theme}>
      <TableActionsContext.Provider value={actions}>
        <TableStructureContext.Provider value={structure}>
          <TableContext.Provider value={context}>
            <TableLoadingState isHydrated={isHydrated} />
            <SelectionContext.Provider value={context.selection}>
              <TableGrid hidden={!isHydrated} />
            </SelectionContext.Provider>
          </TableContext.Provider>
        </TableStructureContext.Provider>
      </TableActionsContext.Provider>
    </ThemeContext.Provider>
  );
}
