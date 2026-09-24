import { ClassNames } from '@emotion/react';
import { memo, useLayoutEffect, type ReactElement, type ReactNode, type Ref } from 'react';
import { calcClassNames, calcCss } from '../misc/calcClassNames';
import { cx } from '../misc/helpers';
import { ColumnContext } from '../state/context';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';
import type { Id, InternalColumn, TableProps, TableTheme, WrapRowProps } from '../types';
import { Cell } from './cell';
import { Details } from './details';
import { ExpandControl } from './expandControl';
import { SelectComponent } from './selectComponent';

/** Everything rows need from the table props. Changing it renders every row. */
export interface RowConfig<T> {
  theme: TableTheme<T>;
  columns: InternalColumn<T, unknown>[];
  enableSelection: boolean | undefined;
  rowAction: TableProps<T>['rowAction'];
  rowDetails: TableProps<T>['rowDetails'];
  wrapRow: TableProps<T>['wrapRow'];
  wrapCell: TableProps<T>['wrapCell'];
  hasDeferredChildren: TableProps<T>['hasDeferredChildren'];
  debugRender: (...output: any) => void;
}

interface RowProps<T> {
  id: Id;
  value: T;
  rowIndex: number;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  config: RowConfig<T>;
  measureRef?: Ref<HTMLDivElement>;
}

const defaultWrapRow = (props: WrapRowProps) => <div {...props} />;

const rowCss = {
  gridColumn: '1 / -1',
  display: 'grid',
  gridTemplateColumns: 'subgrid',
} as const;

export const Row = memo(function Row<T>({
  id,
  value,
  rowIndex,
  depth,
  hasChildren,
  expanded,
  config,
  measureRef,
}: RowProps<T>): ReactElement {
  const { theme, columns, enableSelection, rowAction, rowDetails, hasDeferredChildren } = config;
  const { classes, styles } = theme;
  const wrapRow = config.wrapRow ?? defaultWrapRow;

  useLayoutEffect(() => {
    config.debugRender('render row', id);
  });

  const rowClassName =
    classes?.row instanceof Function ? classes.row(value, rowIndex) : classes?.row;
  const rowStyles = styles?.row instanceof Function ? styles.row(value, rowIndex) : styles?.row;
  const cellClassName = cx(...calcClassNames(classes, value, rowIndex));
  const cellCss = calcCss<T>(styles, value, rowIndex);
  const deferred = hasDeferredChildren?.(value) ?? false;
  const action = rowAction instanceof Function ? rowAction(value, rowIndex) : rowAction;
  const hasDetails = rowDetails instanceof Function ? !!rowDetails(value, rowIndex) : !!rowDetails;

  const children: ReactNode = (
    <>
      <div className={cellClassName} css={[defaultClasses.cellFill, cellCss]} />

      <div className={cellClassName} css={[defaultClasses.cell, defaultClasses.firstCell, cellCss]}>
        {depth > 0 && <div css={{ width: depth * 20 }} />}

        {enableSelection && <SelectComponent itemId={id} />}

        {(hasChildren || deferred || hasDetails) && (
          <ExpandControl
            itemId={id}
            expanded={expanded}
            hasChildren={hasChildren}
            hasDeferredChildren={deferred}
          />
        )}

        {action}
      </div>

      {columns.map((column) => (
        <ColumnContext.Provider key={column.id} value={column.id}>
          <Cell column={column} value={value} rowIndex={rowIndex} config={config} />
        </ColumnContext.Provider>
      ))}

      <div className={cellClassName} css={[defaultClasses.cellFill, cellCss]} />

      {expanded && hasDetails && <Details value={value} rowIndex={rowIndex} config={config} />}
    </>
  );

  return (
    <ClassNames>
      {({ css, cx }) =>
        wrapRow(
          {
            ref: measureRef ?? null,
            'data-index': rowIndex,
            className: cx(css([rowCss, rowStyles]), rowClassName),
            children,
          },
          value,
          rowIndex,
        )
      }
    </ClassNames>
  );
}) as <T>(props: RowProps<T>) => ReactElement;
