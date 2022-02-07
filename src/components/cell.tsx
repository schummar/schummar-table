import React, { memo } from 'react';
import { Id, useColumnContext, useTableContext } from '..';
import { defaultClasses } from '../theme/defaultClasses';
import { calcClassNames } from './row';

export const Cell = memo(function Cell<T>({ itemId, rowIndex }: { itemId: Id; rowIndex: number }) {
  const state = useTableContext<T>();
  const columnId = useColumnContext();

  const column = state.useState((state) => state.activeColumns.find((column) => column.id === columnId), [columnId]);
  const item = state.useState((state) => state.activeItemsById.get(itemId), [itemId]);
  const css = state.useState((state) => state.theme.css);
  const columnStyleOverride = state.useState((state) => state.columnStyleOverride.get(columnId), [columnId], { throttle: 16 });

  if (!column || !item) return null;
  state.getState().props.debug?.('render cell', itemId, columnId);

  const classNames = [...calcClassNames(css, item, rowIndex), ...calcClassNames(column?.css, item, rowIndex)];
  const content = column.renderCell(column.value(item), item);

  return (
    <div css={[defaultClasses.cell, classNames, columnStyleOverride]}>
      {typeof content === 'string' ? <span css={defaultClasses.text}>{content}</span> : content}
    </div>
  );
});
