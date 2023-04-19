import { memo, useEffect, useLayoutEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { calcClassNames, calcCss } from '../misc/calcClassNames';
import { cx, getAncestors } from '../misc/helpers';
import { ColumnContext, useTableContext } from '../misc/tableContext';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';
import type { Id } from '../types';
import { Cell } from './cell';
import { ExpandControl } from './expandControl';
import { SelectComponent } from './selectComponent';

export const Row = memo(function Row<T>({
  itemId,
  rowIndex,
}: {
  itemId: Id;
  rowIndex: number;
}): JSX.Element | null {
  const table = useTableContext<T>();
  const divRef = useRef<HTMLDivElement>(null);

  const classes = useTheme((t) => t.classes);
  const styles = useTheme((t) => t.styles);

  const {
    className,
    css_,
    indent,
    hasChildren,
    hasDeferredChildren,
    columnIds,
    enableSelection,
    rowAction,
  } = table.useState((state) => {
    const item = state.activeItemsById.get(itemId);

    return {
      className: cx(...calcClassNames(classes, item?.value, rowIndex)),
      css_: calcCss(styles, item?.value, rowIndex),
      indent: item ? getAncestors(state.activeItemsById, item).size : 0,
      hasChildren: !!item?.children.length,
      hasDeferredChildren: item && state.props.hasDeferredChildren?.(item.value),
      columnIds: state.activeColumns.map((column) => column.id),
      enableSelection: state.props.enableSelection,
      rowAction:
        state.props.rowAction instanceof Function
          ? item
            ? state.props.rowAction(item.value, rowIndex)
            : null
          : state.props.rowAction,
    };
  });

  useEffect(() => {
    const div = divRef.current;
    if (!div) return;

    const o = new ResizeObserver(() => {
      if (!document.contains(div)) return;
      table.update((state) => {
        state.rowHeights.set(itemId, div.offsetHeight);
      });
    });
    o.observe(div);

    return () => o.disconnect();
  }, [table, itemId]);

  useLayoutEffect(() => table.getState().props.debugRender?.('render row', itemId));

  return (
    <div css={{ display: 'contents' }}>
      <div className={className} css={[defaultClasses.cellFill, css_]} ref={divRef} />

      <div className={className} css={[defaultClasses.cell, defaultClasses.firstCell, css_]}>
        <div css={{ width: indent * 20 }} />

        {enableSelection && <SelectComponent itemId={itemId} />}

        {(hasChildren || hasDeferredChildren) && (
          <ExpandControl itemId={itemId} hasDeferredChildren={hasDeferredChildren} />
        )}

        {rowAction}
      </div>

      {columnIds.map((columnId) => (
        <ColumnContext.Provider key={columnId} value={columnId}>
          <Cell itemId={itemId} rowIndex={rowIndex} />
        </ColumnContext.Provider>
      ))}

      <div className={className} css={[defaultClasses.cellFill, css_]} />
    </div>
  );
});
