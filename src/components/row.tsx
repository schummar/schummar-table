import React, { memo, useEffect, useRef } from 'react';
import { c, getAncestors } from '../misc/helpers';
import { ColumnContext, useTableContext } from '../table';
import { Id, InternalColumn } from '../types';
import { Cell } from './cell';
import { ExpandComponent } from './expandComponent';
import { InsertLine } from './inserLine';
import { SelectComponent } from './selectComponent';
import { useCommonClasses } from './useCommonClasses';

export function calcClassName<T>(classes: InternalColumn<any, any>['classes'] | undefined, item: T, index: number): string {
  return c(
    classes?.cell instanceof Function ? classes.cell(item, index) : classes?.cell,
    classes?.evenCell === undefined ? undefined : { [classes.evenCell]: index % 2 === 0 },
    classes?.oddCell === undefined ? undefined : { [classes.oddCell]: index % 2 === 1 },
  );
}

export const Row = memo(function Row<T>({ itemId, rowIndex }: { itemId: Id; rowIndex: number }): JSX.Element | null {
  const commonClasses = useCommonClasses();
  const state = useTableContext<T>();
  const divRef = useRef<HTMLDivElement>(null);
  const insertLine = state.useState('insertLine');

  const { className, indent, hasChildren, hasDeferredChildren, columnIds, enableSelection, rowAction } = state.useState(
    (state) => {
      const item = state.activeItemsById.get(itemId);
      const index = !item ? -1 : state.activeItems.indexOf(item);

      return {
        className: calcClassName(state.props.classes, item, index),
        indent: item ? getAncestors(state.activeItemsById, item).size : 0,
        hasChildren: !!item?.children.length,
        hasDeferredChildren: item && state.props.hasDeferredChildren?.(item),
        columnIds: state.activeColumns.map((column) => column.id),
        enableSelection: state.props.enableSelection,
        rowAction: state.props.rowAction instanceof Function ? (item ? state.props.rowAction(item, index) : null) : state.props.rowAction,
      };
    },
    [itemId],
  );

  useEffect(() => {
    const div = divRef.current;
    if (!div) return;

    const o = new ResizeObserver(() => {
      if (!document.contains(div)) return;
      state.update((state) => {
        state.rowHeights.set(itemId, div.offsetHeight);
      });
    });
    o.observe(div);

    return () => o.disconnect();
  }, [divRef.current]);

  state.getState().props.debug?.('render row', itemId);

  return (
    <>
      <div className={c(commonClasses.cellFill, className)} ref={divRef} />

      <div className={c(commonClasses.cell, commonClasses.firstCell, className)}>
        <div style={{ width: indent * 20 }} />

        {enableSelection && <SelectComponent itemId={itemId} />}

        {(hasChildren || hasDeferredChildren) && <ExpandComponent itemId={itemId} />}

        {rowAction}
      </div>

      {columnIds.map((columnId, index) => (
        <ColumnContext.Provider key={columnId} value={columnId}>
          {insertLine === index && <InsertLine />}

          <Cell itemId={itemId} rowIndex={rowIndex} />
        </ColumnContext.Provider>
      ))}

      {insertLine === columnIds.length && <InsertLine />}

      <div className={c(commonClasses.cellFill, className)} />
    </>
  );
});
