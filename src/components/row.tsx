import React, { memo, useEffect, useRef } from 'react';
import { c, getAncestors } from '../misc/helpers';
import { ColumnContext, useTableContext } from '../table';
import { Id, InternalColumn } from '../types';
import { Cell } from './cell';
import { ExpandComponent } from './expandComponent';
import { SelectComponent } from './selectComponent';
import { useCommonClasses } from './useCommonClasses';

export const calcClassName = (classes: InternalColumn<any, any>['classes'] | undefined, index: number): string =>
  c(
    classes?.cell,
    classes?.evenCell === undefined ? undefined : { [classes.evenCell]: index % 2 === 0 },
    classes?.oddCell === undefined ? undefined : { [classes.oddCell]: index % 2 === 1 },
  );

export const Row = memo(function Row<T>({ itemId }: { itemId: Id }): JSX.Element | null {
  const commonClasses = useCommonClasses();
  const state = useTableContext<T>();
  const divRef = useRef<HTMLDivElement>(null);

  const { className, indent, hasChildren, hasDeferredChildren, columnIds } = state.useState(
    (state) => {
      const item = state.activeItemsById.get(itemId);
      const index = !item ? -1 : state.activeItems.indexOf(item);

      return {
        className: calcClassName(state.props.classes, index),
        indent: item ? getAncestors(state.activeItemsById, item).size : 0,
        hasChildren: !!item?.children.length,
        hasDeferredChildren: item && state.props.hasDeferredChildren?.(item),
        columnIds: state.activeColumns.map((column) => column.id),
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

        <SelectComponent itemId={itemId} />

        {(hasChildren || hasDeferredChildren) && <ExpandComponent itemId={itemId} />}
      </div>

      {columnIds.map((columnId) => (
        <ColumnContext.Provider key={columnId} value={columnId}>
          <Cell itemId={itemId} />
        </ColumnContext.Provider>
      ))}

      <div className={c(commonClasses.cellFill, className)} />
    </>
  );
});
