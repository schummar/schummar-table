import { useCallback, useLayoutEffect, useMemo, useRef, type Ref } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useTableContext } from '../state/context';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';
import { useCssVariables } from '../theme/useCssVariables';
import type { TableTheme } from '../types';
import { columnWidthVariable } from './resizeHandle';
import { CellSchedulerContext, useCellScheduler } from './cellScheduler';
import { Row, type RowConfig } from './row';
import { useRowStyles } from './rowStyles';
import { TableFooter } from './tableFooter';
import { TableHeader } from './tableHeader';
import { VirtualRows } from './virtualized';

export function TableGrid<T>({ hidden }: { hidden: boolean }) {
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
  const styles = useRowStyles(theme, visibleColumns);
  const scheduler = useCellScheduler();
  const virtualOptions = props.virtual instanceof Object ? props.virtual : undefined;
  const deferCells = virtualOptions?.deferCells;
  const placeholderHeight = virtualOptions?.rowHeight ?? virtualOptions?.estimatedRowHeight ?? 40;
  const deferredColumns = useMemo(
    () =>
      new Set(
        visibleColumns.filter((column) => column.deferred ?? deferCells).map((column) => column.id),
      ),
    [visibleColumns, deferCells],
  );
  const config = useMemo(
    (): RowConfig<T> => ({
      styles,
      deferredColumns,
      placeholderHeight,
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
      styles,
      deferredColumns,
      placeholderHeight,
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
    <CellSchedulerContext.Provider value={scheduler}>
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
    </CellSchedulerContext.Provider>
  );
}
