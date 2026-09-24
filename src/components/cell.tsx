import type { ReactElement, ReactNode } from 'react';
import { memo, useLayoutEffect } from 'react';
import type { InternalColumn } from '../types';
import type { RowConfig } from './row';

function wrapText(content: ReactNode, className: string) {
  if (typeof content === 'string') {
    return (
      <span className={className} title={content}>
        {content}
      </span>
    );
  }
  return content;
}

export const Cell = memo(function Cell<T>({
  column,
  value,
  rowIndex,
  config,
}: {
  column: InternalColumn<T, unknown>;
  value: T;
  rowIndex: number;
  config: RowConfig<T>;
}) {
  const { styles, wrapCell } = config;

  useLayoutEffect(() => {
    config.debugRender('render cell', column.id);
  });

  const columnValue = column.value(value);
  const content = column.renderCell(columnValue, value);

  return (
    <div className={styles.cells.get(column.id)!(value, rowIndex)}>
      {wrapCell ? wrapCell(content, columnValue, value, rowIndex) : wrapText(content, styles.text)}
    </div>
  );
}) as <T>(props: {
  column: InternalColumn<T, unknown>;
  value: T;
  rowIndex: number;
  config: RowConfig<T>;
}) => ReactElement;
