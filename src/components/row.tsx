import { CircularProgress } from '@material-ui/core';
import React, { memo } from 'react';
import { c } from '../misc/helpers';
import { ColumnContext, useTableContext } from '../table';
import { Id, InternalColumn } from '../types';
import { Cell } from './cell';
import { ExpandComponent } from './expandComponent';
import { SelectComponent } from './selectComponent';
import { useCommonClasses } from './useCommonClasses';

export const calcClassName = (classes: InternalColumn<any, any>['classes'] | undefined, index: number): string =>
  c(
    classes?.cell,
    classes?.evenCell === undefined ? undefined : { [classes.evenCell]: index % 2 === 0 },
    classes?.oddCell === undefined ? undefined : { [classes.oddCell]: index % 2 === 1 },
  );

export const Row = memo(function Row<T>({ itemId, indent = 0 }: { itemId: Id; indent?: number }): JSX.Element | null {
  const commonClasses = useCommonClasses();
  const state = useTableContext<T>();
  const { hasDeferredChildren, activeColumns, isExpanded, children, hasChildren, className } = state.useState(
    (state) => {
      const item = state.activeItemsById.get(itemId);
      const index = !item ? -1 : state.activeItems.indexOf(item);

      return {
        hasDeferredChildren: item && state.props.hasDeferredChildren?.(item),
        activeColumns: state.activeColumns,
        isExpanded: state.expanded.has(itemId),
        children: state.expanded.has(itemId) ? [...(state.activeItemsByParentId.get(itemId) ?? [])].map((child) => child.id) : [],
        hasChildren: state.items.some((i) => i.parentId === itemId),
        className: calcClassName(state.props.classes, index),
      };
    },
    [itemId],
  );

  state.getState().props.debug?.('render row', itemId);

  return (
    <>
      <div className={c(commonClasses.cellFill, className)} />

      <div className={c(commonClasses.cell, className)}>
        <div style={{ width: indent * 20 }} />

        <SelectComponent itemId={itemId} />

        {(hasChildren || hasDeferredChildren) && <ExpandComponent itemId={itemId} />}
      </div>

      {activeColumns.map((column) => (
        <ColumnContext.Provider key={column.id} value={column}>
          <Cell itemId={itemId} />
        </ColumnContext.Provider>
      ))}

      <div className={c(commonClasses.cellFill, className)} />

      {isExpanded && children.map((childId) => <Row key={childId} itemId={childId} indent={indent + 1} />)}

      {isExpanded && !hasChildren && (
        <>
          <div className={commonClasses.deferredPlaceholder}>
            <CircularProgress size={20} />
          </div>
        </>
      )}
    </>
  );
});
