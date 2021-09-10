import React, { memo } from 'react';
import { Id, useColumnContext, useTableContext } from '..';
import { c } from '../misc/helpers';
import { calcClassName } from './row';
import { useCommonClasses } from './useCommonClasses';

export const Cell = memo(function Cell<T>({ itemId }: { itemId: Id }) {
  const commonClasses = useCommonClasses();
  const state = useTableContext<T>();
  const columnId = useColumnContext();

  const content = state.useState(
    (state) => {
      const item = state.activeItemsById.get(itemId);
      const column = state.activeColumns.find((column) => column.id === columnId);
      if (!item || !column) return null;

      const index = item ? state.activeItems.indexOf(item) : -1;
      const className = c(calcClassName(state.props.classes, index), calcClassName(column?.classes, index));
      const wrapCell = state.props.wrapCell ?? ((cell) => <div className={c(commonClasses.cell, className)}>{cell}</div>);

      return wrapCell(column.renderCell(column.value(item), item), item);
    },
    [itemId, columnId, commonClasses],
  );

  state.getState().props.debug?.('render cell', itemId, columnId);

  return <>{content}</>;
});
