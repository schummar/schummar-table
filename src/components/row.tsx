import React, { memo, useEffect, useRef } from 'react';
import { getAncestors } from '../misc/helpers';
import { defaultClasses } from '../theme/defaultClasses';
import { Id, InternalColumn } from '../types';
import { Cell } from './cell';
import { ExpandComponent } from './expandComponent';
import { SelectComponent } from './selectComponent';
import { ColumnContext, useTableContext } from './table';

export function calcClassNames<T>(css: InternalColumn<any, any>['css'] | undefined, item: T, index: number) {
  return [
    css?.cell instanceof Function ? css.cell(item, index) : css?.cell,
    index % 2 === 0 && css?.evenCell,
    index % 2 === 1 && css?.oddCell,
  ];
}

export const Row = memo(function Row<T>({ itemId, rowIndex }: { itemId: Id; rowIndex: number }): JSX.Element | null {
  const state = useTableContext<T>();
  const divRef = useRef<HTMLDivElement>(null);

  const { className, indent, hasChildren, hasDeferredChildren, columnIds, enableSelection, rowAction } = state.useState(
    (state) => {
      const item = state.activeItemsById.get(itemId);
      const index = !item ? -1 : state.activeItems.indexOf(item);

      return {
        className: calcClassNames(state.props.css, item, index),
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
      <div css={[defaultClasses.cellFill, className]} ref={divRef} />

      <div css={[defaultClasses.cell, defaultClasses.firstCell, className]}>
        <div css={{ width: indent * 20 }} />

        {enableSelection && <SelectComponent itemId={itemId} />}

        {(hasChildren || hasDeferredChildren) && <ExpandComponent itemId={itemId} />}

        {rowAction}
      </div>

      {columnIds.map((columnId) => (
        <ColumnContext.Provider key={columnId} value={columnId}>
          <Cell itemId={itemId} rowIndex={rowIndex} />
        </ColumnContext.Provider>
      ))}

      <div css={[defaultClasses.cellFill, className]} />
    </>
  );
});
