import React, { memo, useEffect, useRef } from 'react';
import { cx, getAncestors } from '../misc/helpers';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';
import { Id, InternalColumn } from '../types';
import { Cell } from './cell';
import { ExpandControl } from './expandControl';
import { SelectComponent } from './selectComponent';
import { ColumnContext, useTableContext } from './table';

export function calcClassNames<T>(classes: InternalColumn<any, any>['classes'] | undefined, item: T, index: number) {
  return [
    classes?.cell instanceof Function ? classes.cell(item, index) : classes?.cell,
    index % 2 === 0 && classes?.evenCell,
    index % 2 === 1 && classes?.oddCell,
  ];
}

export const Row = memo(function Row<T>({ itemId, rowIndex }: { itemId: Id; rowIndex: number }): JSX.Element | null {
  const table = useTableContext<T>();
  const divRef = useRef<HTMLDivElement>(null);

  const { className, indent, hasChildren, hasDeferredChildren, columnIds, enableSelection, rowAction } = table.useState((state) => {
    const item = state.activeItemsById.get(itemId);
    const index = !item ? -1 : state.activeItems.indexOf(item);

    return {
      className: cx(...calcClassNames(state.props.classes, item, index)),
      indent: item ? getAncestors(state.activeItemsById, item).size : 0,
      hasChildren: !!item?.children.length,
      hasDeferredChildren: item && state.props.hasDeferredChildren?.(item),
      columnIds: state.activeColumns.map((column) => column.id),
      enableSelection: state.props.enableSelection,
      rowAction: state.props.rowAction instanceof Function ? (item ? state.props.rowAction(item, index) : null) : state.props.rowAction,
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
  }, [divRef.current]);

  table.getState().props.debugRender?.('render row', itemId);

  return (
    <>
      <div className={className} css={[defaultClasses.cellFill]} ref={divRef} />

      <div className={className} css={[defaultClasses.cell, defaultClasses.firstCell]}>
        <div css={{ width: indent * 20 }} />

        {enableSelection && <SelectComponent itemId={itemId} />}

        {(hasChildren || hasDeferredChildren) && <ExpandControl itemId={itemId} hasDeferredChildren={hasDeferredChildren} />}

        {rowAction}
      </div>

      {columnIds.map((columnId) => (
        <ColumnContext.Provider key={columnId} value={columnId}>
          <Cell itemId={itemId} rowIndex={rowIndex} />
        </ColumnContext.Provider>
      ))}

      <div className={className} css={[defaultClasses.cellFill]} />
    </>
  );
});
