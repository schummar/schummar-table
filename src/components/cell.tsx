import React, { memo } from 'react';
import { Id, useColumnContext, useTableContext, useTheme } from '..';
import { cx } from '../misc/helpers';
import { defaultClasses } from '../theme/defaultClasses';
import { calcClassNames } from './row';

export const Cell = memo(function Cell<T>({ itemId, rowIndex }: { itemId: Id; rowIndex: number }) {
  const table = useTableContext<T>();
  const columnId = useColumnContext();
  const { classes } = useTheme();

  const column = table.useState((state) => state.activeColumns.find((column) => column.id === columnId));
  const item = table.useState((state) => state.activeItemsById.get(itemId));
  const columnStyleOverride = table.useState((state) => state.columnStyleOverride.get(columnId), { throttle: 16 });

  if (!column || !item) return null;
  table.getState().props.debugRender?.('render cell', itemId, columnId);

  const classNames = [...calcClassNames(classes, item, rowIndex), ...calcClassNames(column?.classes, item, rowIndex)];
  const content = column.renderCell(column.value(item), item);

  return (
    <div className={cx(...classNames)} css={[defaultClasses.cell, classNames, columnStyleOverride]}>
      {typeof content === 'string' ? <span css={defaultClasses.text}>{content}</span> : content}
    </div>
  );
});
