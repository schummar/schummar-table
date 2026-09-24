import { memo, useLayoutEffect, type ReactElement, type ReactNode, type RefCallback } from 'react';
import { ColumnContext } from '../state/context';
import type { Id, InternalColumn, TableProps, WrapRowProps } from '../types';
import { Cell } from './cell';
import { useReveal } from './cellScheduler';
import { Details } from './details';
import { ExpandControl } from './expandControl';
import type { RowStyles } from './rowStyles';
import { SelectComponent } from './selectComponent';

/** Everything rows need from the table props. Changing it renders every row. */
export interface RowConfig<T> {
  styles: RowStyles<T>;
  /** Columns whose cells render progressively. */
  deferredColumns: Set<Id>;
  placeholderHeight: number;
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
  measureRef?: RefCallback<HTMLElement>;
}

const defaultWrapRow = (props: WrapRowProps) => <div {...props} />;

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
  const { styles, columns, enableSelection, rowAction, rowDetails, hasDeferredChildren } = config;
  const wrapRow = config.wrapRow ?? defaultWrapRow;

  useLayoutEffect(() => {
    config.debugRender('render row', id);
  });

  const fillClassName = styles.fillCell(value, rowIndex);
  const revealed = useReveal(config.deferredColumns.size > 0, rowIndex);
  const deferred = hasDeferredChildren?.(value) ?? false;
  const action = rowAction instanceof Function ? rowAction(value, rowIndex) : rowAction;
  const hasDetails = rowDetails instanceof Function ? !!rowDetails(value, rowIndex) : !!rowDetails;

  const children: ReactNode = (
    <>
      <div className={fillClassName} />

      <div className={styles.firstCell(value, rowIndex)}>
        {depth > 0 && <div style={{ width: depth * 20 }} />}

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
          <Cell
            column={column}
            placeholder={!revealed && config.deferredColumns.has(column.id)}
            value={value}
            rowIndex={rowIndex}
            config={config}
          />
        </ColumnContext.Provider>
      ))}

      <div className={fillClassName} />

      {expanded && hasDetails && <Details value={value} rowIndex={rowIndex} config={config} />}
    </>
  );

  return wrapRow(
    {
      ref: measureRef ?? null,
      'data-index': rowIndex,
      className: styles.row(value, rowIndex),
      children,
    },
    value,
    rowIndex,
  ) as ReactElement;
}) as <T>(props: RowProps<T>) => ReactElement;
