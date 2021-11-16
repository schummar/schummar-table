import React, { memo } from 'react';
import { Id, useColumnContext, useTableContext } from '..';
import { c } from '../misc/helpers';
import { calcClassName } from './row';
import { useCommonClasses } from './useCommonClasses';

export const Cell = memo(function Cell<T>({ itemId, rowIndex }: { itemId: Id; rowIndex: number }) {
  const commonClasses = useCommonClasses();
  const state = useTableContext<T>();
  const columnId = useColumnContext();

  const column = state.useState((state) => state.activeColumns.find((column) => column.id === columnId), [columnId]);
  const item = state.useState((state) => state.activeItemsById.get(itemId), [itemId]);
  const classes = state.useState('props.classes');
  const wrapCell = state.useState('props.wrapCell');

  if (!column || !item) return null;
  state.getState().props.debug?.('render cell', itemId, columnId);

  const className = c(calcClassName(classes, rowIndex), calcClassName(column?.classes, rowIndex));
  const content = column.renderCell(column.value(item), item);

  if (wrapCell) return <>{wrapCell(content, item)}</>;

  return <div className={c(commonClasses.cell, className)}>{content}</div>;
});
