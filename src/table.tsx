import React, { createContext, memo, useContext } from 'react';
import { Store } from 'schummar-state/react';
import { ColumnSelection } from './components/columnSelection';
import { Export } from './components/export';
import { FilterComponent } from './components/filterComponent';
import { Row } from './components/row';
import { SelectComponent } from './components/selectComponent';
import { SortComponent } from './components/sortComponent';
import { useCommonClasses } from './components/useCommonClasses';
import { Virtualized } from './components/virtualized';
import { useTableState } from './internalState/useTableState';
import { c } from './misc/helpers';
import { Id, InternalTableState, TableProps } from './types';

export const TableContext = createContext<Store<InternalTableState<any>> | null>(null);
export const ColumnContext = createContext<Id | null>(null);
export function useTableContext<T>(): Store<InternalTableState<T>> {
  const value = useContext(TableContext);
  if (!value) throw Error('No table context available');
  return value as Store<InternalTableState<T>>;
}
export function useColumnContext(): Id {
  const value = useContext(ColumnContext);
  if (value === null) throw Error('No column context available');
  return value;
}

let defaultProps: Pick<TableProps<unknown>, 'text' | 'classes'> = {};
export function configureTables(props: typeof defaultProps) {
  defaultProps = props;
}
function mergeProps<T>(props: TableProps<T>): TableProps<T> {
  return {
    ...props,
    text: { ...defaultProps.text, ...props.text },
    classes: { ...defaultProps.classes, ...props.classes },
  };
}

export function Table<T>(props: TableProps<T>): JSX.Element {
  props = mergeProps(props);
  const state = useTableState(props);
  state.getState().props.debug?.('render table');

  return (
    <TableContext.Provider value={state}>
      <TableInner />
    </TableContext.Provider>
  );
}

const TableInner = memo(function TableInner<T>(): JSX.Element {
  const commonClasses = useCommonClasses();
  const state = useTableContext<T>();
  const fullWidth = state.useState('props.fullWidth');
  const activeColumns = state.useState((state) =>
    state.activeColumns.map((column) => ({
      id: column.id,
      width: column.width,
      classes: column.classes,
      header: column.header,
    })),
  );
  const defaultWidth = state.useState('props.defaultWidth');
  const classes = state.useState('props.classes');
  const stickyHeader = state.useState('props.stickyHeader');
  const enableSelection = state.useState('props.enableSelection');
  const enableColumnSelection = state.useState('props.enableColumnSelection');
  const enableExport = state.useState((state) => !!state.props.enableExport.copy || !!state.props.enableExport.download);

  state.getState().props.debug?.('render table inner');

  return (
    <Virtualized
      className={c(commonClasses.table, classes?.table)}
      style={{
        gridTemplateColumns: [
          //
          fullWidth === 'right' || fullWidth === true ? 'auto' : '0',
          'max-content',
          ...activeColumns.map((column) => column.width ?? defaultWidth ?? 'max-content'),
          fullWidth === 'left' || fullWidth === true ? 'auto' : '0',
        ].join(' '),
      }}
      header={
        <>
          <div className={c(commonClasses.headerFill, { [commonClasses.sticky]: !!stickyHeader }, classes?.headerCell)} />

          <div className={c(commonClasses.headerCell, { [commonClasses.sticky]: !!stickyHeader }, classes?.headerCell)}>
            {enableSelection && <SelectComponent />}

            {enableColumnSelection && <ColumnSelection />}

            {enableExport && <Export />}
          </div>

          {activeColumns.map((column) => (
            <ColumnContext.Provider key={column.id} value={column.id}>
              <div
                className={c(
                  commonClasses.headerCell,
                  { [commonClasses.sticky]: !!stickyHeader },
                  classes?.headerCell,
                  column.classes?.headerCell,
                )}
                key={column.id}
              >
                <SortComponent>{column.header}</SortComponent>
                <FilterComponent />
              </div>
            </ColumnContext.Provider>
          ))}

          <div className={c(commonClasses.headerFill, { [commonClasses.sticky]: !!stickyHeader }, classes?.headerCell)} />
        </>
      }
    >
      {(itemIds, startIndex) => itemIds.map((itemId, index) => <Row key={itemId} itemId={itemId} rowIndex={startIndex + index} />)}
    </Virtualized>
  );
});
