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
  placeholder,
  value,
  rowIndex,
  config,
}: {
  column: InternalColumn<T, unknown>;
  /** A deferred cell whose row hasn't been revealed yet. */
  placeholder: boolean;
  value: T;
  rowIndex: number;
  config: RowConfig<T>;
}) {
  const { styles, wrapCell } = config;
  const className = styles.cells.get(column.id)!(value, rowIndex);

  useLayoutEffect(() => {
    config.debugRender(placeholder ? 'defer cell' : 'render cell', column.id);
  });

  if (placeholder) {
    return (
      <div
        className={className}
        data-deferred=""
        style={{ boxSizing: 'border-box', minHeight: config.placeholderHeight }}
      />
    );
  }

  const columnValue = column.value(value);
  const content = column.renderCell(columnValue, value);

  return (
    <div className={className}>
      {wrapCell ? wrapCell(content, columnValue, value, rowIndex) : wrapText(content, styles.text)}
    </div>
  );
}) as <T>(props: {
  column: InternalColumn<T, unknown>;
  placeholder: boolean;
  value: T;
  rowIndex: number;
  config: RowConfig<T>;
}) => ReactElement;
