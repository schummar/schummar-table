import type { ReactNode } from 'react';
import { memo, useLayoutEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { calcClassNames, calcCss } from '../misc/calcClassNames';
import { cx } from '../misc/helpers';
import { useColumnContext, useTableContext } from '../misc/tableContext';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';
import type { Id } from '../types';

const defaultWrapCell = (content: ReactNode) => {
  if (typeof content === 'string') {
    return (
      <span css={defaultClasses.text} title={content}>
        {content}
      </span>
    );
  }
  return content;
};

export const Cell = memo(function Cell<T>({ itemId, rowIndex }: { itemId: Id; rowIndex: number }) {
  const table = useTableContext<T>();
  const columnId = useColumnContext();

  const column = table.useState((state) => {
    const col = state.activeColumns.find((column) => column.id === columnId);
    return (
      col && {
        value: col.value,
        renderCell: col.renderCell,
      }
    );
  });
  const wrapCell = table.useState((state) => state.props.wrapCell) ?? defaultWrapCell;
  const item = table.useState((state) => state.activeItemsById.get(itemId));
  const columnStyleOverride = table.useState((state) => state.columnStyleOverride.get(columnId), {
    throttle: 16,
  });

  useLayoutEffect(() => table.getState().props.debugRender?.('render cell', itemId, columnId));
  const className = useTheme((t) => cx(...calcClassNames(t.classes, item, rowIndex)));
  const styles = useTheme((t) => calcCss(t.styles, item, rowIndex));

  if (!column || !item) return null;

  const content = column.renderCell(column.value(item.value), item.value);

  return (
    <div className={className} css={[defaultClasses.cell, styles]} style={columnStyleOverride}>
      {wrapCell(content, column.value(item.value), item.value, rowIndex)}
    </div>
  );
});
