import type { ReactElement, ReactNode } from 'react';
import { memo, useLayoutEffect } from 'react';
import { columnTheme } from '../hooks/useTheme';
import { calcClassNames, calcCss } from '../misc/calcClassNames';
import { cx } from '../misc/helpers';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';
import type { InternalColumn, TableTheme } from '../types';
import type { RowConfig } from './row';

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
  const { classes, styles } = columnTheme(config.theme as TableTheme<T>, column);
  const wrapCell = config.wrapCell ?? defaultWrapCell;

  useLayoutEffect(() => {
    config.debugRender('render cell', column.id);
  });

  const columnValue = column.value(value);
  const content = column.renderCell(columnValue, value);

  return (
    <div
      className={cx(...calcClassNames(classes, value, rowIndex))}
      css={[defaultClasses.cell, calcCss<T>(styles, value, rowIndex)]}
    >
      {wrapCell(content, columnValue, value, rowIndex)}
    </div>
  );
}) as <T>(props: {
  column: InternalColumn<T, unknown>;
  value: T;
  rowIndex: number;
  config: RowConfig<T>;
}) => ReactElement;
