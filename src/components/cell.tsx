import React, { memo } from 'react';
import { Id, useColumnContext, useTableContext, useTheme } from '..';
import { defaultClasses } from '../theme/defaultClasses';
import { calcClassNames } from './row';

export const Cell = memo(function Cell<T>({ itemId, rowIndex }: { itemId: Id; rowIndex: number }) {
  const table = useTableContext<T>();
  const columnId = useColumnContext();
  const { css } = useTheme();

  const column = table.useState((state) => state.activeColumns.find((column) => column.id === columnId));
  const item = table.useState((state) => state.activeItemsById.get(itemId));
  const columnStyleOverride = table.useState((state) => state.columnStyleOverride.get(columnId), { throttle: 16 });

  if (!column || !item) return null;
  table.getState().props.debugRender?.('render cell', itemId, columnId);

  const classNames = [...calcClassNames(css, item, rowIndex), ...calcClassNames(column?.css, item, rowIndex)];
  const content = column.renderCell(column.value(item), item);

  return (
    <div css={[defaultClasses.cell, classNames, columnStyleOverride]}>
      {typeof content === 'string' ? <span css={defaultClasses.text}>{content}</span> : content}
    </div>
  );
});
