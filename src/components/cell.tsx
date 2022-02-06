import React, { memo } from 'react';
import { Id, useColumnContext, useTableContext } from '..';
import { defaultClasses } from '../theme/defaultClasses';
import { calcClassNames } from './row';

export const Cell = memo(function Cell<T>({ itemId, rowIndex }: { itemId: Id; rowIndex: number }) {
  const state = useTableContext<T>();
  const columnId = useColumnContext();

  const column = state.useState((state) => state.activeColumns.find((column) => column.id === columnId), [columnId]);
  const item = state.useState((state) => state.activeItemsById.get(itemId), [itemId]);
  const classes = state.useState('props.classes');
  let wrapCell = state.useState('props.wrapCell');
  if (!column || !item) return null;
  state.getState().props.debug?.('render cell', itemId, columnId);

  const classNames = [...calcClassNames(classes, item, rowIndex), ...calcClassNames(column?.classes, item, rowIndex)];
  const content = column.renderCell(column.value(item), item);

  if (!wrapCell && typeof content === 'string') {
    wrapCell = (content) => (
      <div css={[defaultClasses.cell, classNames]}>
        <span css={defaultClasses.text}>{content}</span>
      </div>
    );
  } else if (!wrapCell) {
    wrapCell = (content) => <div css={[defaultClasses.cell, classNames]}>{content}</div>;
  }

  return <>{wrapCell(content, item)}</>;
});
