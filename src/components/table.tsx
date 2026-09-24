import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type Ref,
} from 'react';
import { ThemeContext, useTheme } from '../hooks/useTheme';
import {
  SelectionContext,
  TableActionsContext,
  TableContext,
  TableStructureContext,
  useTableContext,
} from '../state/context';
import { useTable } from '../state/useTable';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';
import { useCssVariables } from '../theme/useCssVariables';
import type { TableContextValue, TableProps, TableRef, TableStructure, TableTheme } from '../types';
import { columnWidthVariable } from './resizeHandle';
import { Row, type RowConfig } from './row';
import { TableFooter } from './tableFooter';
import { TableHeader } from './tableHeader';
import { VirtualRows } from './virtualized';

export function Table<T>({ ref, ...props }: TableProps<T> & { ref?: Ref<TableRef> }): ReactElement {
  const [resetKey, setResetKey] = useState(0);
  const latestProps = useRef(props);
  latestProps.current = props;

  const onReset = useCallback(() => {
    const props = latestProps.current;
    setResetKey((key) => key + 1);

    if (props.sort === undefined) props.onSortChange?.(props.defaultSort ?? []);
    if (props.expanded === undefined) props.onExpandedChange?.(props.defaultExpanded ?? new Set());
    if (props.selection === undefined) {
      props.onSelectionChange?.(props.defaultSelection ?? new Set());
    }
    if (props.hiddenColumns === undefined) {
      props.onHiddenColumnsChange?.(props.defaultHiddenColumns ?? new Set());
    }
    props.onReset?.('table');
  }, []);

  return <TableWithState key={resetKey} props={props} tableRef={ref} onReset={onReset} />;
}

function TableWithState<T>({
  props: rawProps,
  tableRef,
  onReset,
}: {
  props: TableProps<T>;
  tableRef?: Ref<TableRef>;
  onReset: () => void;
}): ReactElement {
  const table = useTable(rawProps, onReset);
  const { state, actions, theme, isHydrated } = table;

  useImperativeHandle(
    tableRef,
    () => ({
      getSort: () => actions.getState().sort,
      setSort: table.setSortInternal,
      getSelection: () => actions.getState().selection,
      setSelection: table.setSelectionInternal,
      getExpanded: () => actions.getState().expanded,
      setExpanded: table.setExpandedInternal,
      getHiddenColumns: () => actions.getState().hiddenColumns,
      setHiddenColumns: table.setHiddenColumnsInternal,
    }),
    [actions],
  );

  const context: TableContextValue<T> = { ...state, actions };
  const { props, displaySize, sort, hiddenColumns, columnWidths, filters, filterValues } = state;
  const { columns, activeColumns, visibleColumns, items, itemsById } = state;
  const structure = useMemo(
    (): TableStructure<T> => ({
      props,
      displaySize,
      sort,
      hiddenColumns,
      columnWidths,
      filters,
      filterValues,
      columns,
      activeColumns,
      visibleColumns,
      items,
      itemsById,
      actions,
    }),
    [
      props,
      displaySize,
      sort,
      hiddenColumns,
      columnWidths,
      filters,
      filterValues,
      columns,
      activeColumns,
      visibleColumns,
      items,
      itemsById,
      actions,
    ],
  );

  return (
    <ThemeContext.Provider value={theme}>
      <TableActionsContext.Provider value={actions}>
        <TableStructureContext.Provider value={structure}>
          <TableContext.Provider value={context}>
            <TableLoadingState isHydrated={isHydrated} />
            <SelectionContext.Provider value={state.selection}>
              <TableGrid hidden={!isHydrated} />
            </SelectionContext.Provider>
          </TableContext.Provider>
        </TableStructureContext.Provider>
      </TableActionsContext.Provider>
    </ThemeContext.Provider>
  );
}

function TableLoadingState({ isHydrated }: { isHydrated: boolean }) {
  const [showLoading, setShowLoading] = useState(false);
  const loadingText = useTheme((t) => t.text.loading);

  useEffect(() => {
    const handle = setTimeout(() => setShowLoading(true), 500);
    return () => clearTimeout(handle);
  }, []);

  return !isHydrated && showLoading ? <div>{loadingText}</div> : null;
}

function TableGrid<T>({ hidden }: { hidden: boolean }) {
  const state = useTableContext<T>();
  const theme = useTheme((t: TableTheme<T>) => t);
  const { props, visibleColumns, columnWidths, activeItems, expanded } = state;
  const cssVariables = useCssVariables();
  const tableRef = useRef<HTMLDivElement>(null);

  const debugRenderRef = useRef(props.debugRender);
  debugRenderRef.current = props.debugRender;
  const debugRender = useCallback((...output: any) => debugRenderRef.current?.(...output), []);

  useLayoutEffect(() => {
    debugRender('render table');
  });

  const { enableSelection, rowAction, rowDetails, wrapRow, wrapCell, hasDeferredChildren } = props;
  const config = useMemo(
    (): RowConfig<T> => ({
      theme,
      columns: visibleColumns,
      enableSelection,
      rowAction,
      rowDetails,
      wrapRow,
      wrapCell,
      hasDeferredChildren,
      debugRender,
    }),
    [
      theme,
      visibleColumns,
      enableSelection,
      rowAction,
      rowDetails,
      wrapRow,
      wrapCell,
      hasDeferredChildren,
      debugRender,
    ],
  );

  const renderRow = (index: number, measureRef?: Ref<HTMLDivElement>) => {
    const item = activeItems[index]!;
    return (
      <Row
        key={item.id}
        id={item.id}
        value={item.value}
        rowIndex={index}
        depth={item.depth}
        hasChildren={item.children.length > 0}
        expanded={expanded.has(item.id)}
        config={config}
        measureRef={measureRef}
      />
    );
  };

  const getKey = useCallback((index: number) => activeItems[index]!.id, [activeItems]);
  const { fullWidth, virtual } = props;

  return (
    <div
      ref={tableRef}
      data-schummar-table=""
      className={theme.classes?.table}
      css={[
        cssVariables,
        defaultClasses.table,
        theme.styles?.table,
        hidden && { visibility: 'hidden' },
      ]}
      style={{
        gridTemplateColumns: [
          fullWidth === 'right' || fullWidth === true ? 'auto' : '0',
          'max-content',
          ...visibleColumns.map(
            (column, index) =>
              `var(${columnWidthVariable(index)}, ${columnWidths.get(column.id) ?? column.width ?? 'max-content'})`,
          ),
          fullWidth === 'left' || fullWidth === true ? 'auto' : '0',
        ].join(' '),
      }}
    >
      <TableHeader />

      {virtual ? (
        <VirtualRows
          tableRef={tableRef}
          count={activeItems.length}
          getKey={getKey}
          options={virtual === true ? {} : virtual}
          renderRow={renderRow}
        />
      ) : (
        activeItems.map((_, index) => renderRow(index))
      )}

      <TableFooter />
    </div>
  );
}
