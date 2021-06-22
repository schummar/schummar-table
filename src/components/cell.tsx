import React, { memo } from 'react';
import { Id, useColumnContext, useTableContext } from '..';
import { c } from '../misc/helpers';
import { calcClassName } from './row';
import { useCommonClasses } from './useCommonClasses';

export const Cell = memo(function Cell<T>({ itemId }: { itemId: Id }) {
  const commonClasses = useCommonClasses();
  const state = useTableContext<T>();
  const columnId = useColumnContext();
  const { className, content } = state.useState(
    (state) => {
      const item = state.activeItemsById.get(itemId);
      const column = state.activeColumns.find((column) => column.id === columnId);

      const index = item ? state.activeItems.indexOf(item) : -1;
      return {
        className: c(calcClassName(state.props.classes, index), calcClassName(column?.classes, index)),
        content: item && column && column.renderCell(column.value(item), item),
      };
    },
    [itemId, columnId],
  );

  state.getState().props.debug?.('render cell', itemId, columnId);

  return <div className={c(commonClasses.cell, className)}>{content}</div>;
});
