import { CircularProgress } from '@material-ui/core';
import React, { memo } from 'react';
import { c } from '../misc/helpers';
import { ColumnContext, useTableContext } from '../table';
import { Id, InternalColumn } from '../types';
import { Cell } from './cell';
import { CellFill, CellView, DeferredPlaceholder } from './elements';
import { ExpandComponent } from './expandComponent';
import { SelectComponent } from './selectComponent';

export const calcClassName = (classes: InternalColumn<any, any>['classes'] | undefined, index: number): string =>
  c(
    classes?.cell,
    classes?.evenCell === undefined ? undefined : { [classes.evenCell]: index % 2 === 0 },
    classes?.oddCell === undefined ? undefined : { [classes.oddCell]: index % 2 === 1 },
  );

export const Row = memo(function Row<T>({ itemId, indent = 0 }: { itemId: Id; indent?: number }): JSX.Element | null {
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
      <CellFill className={className} />

      <CellView className={className}>
        <div style={{ width: indent * 20 }} />

        <SelectComponent itemId={itemId} />

        {(hasChildren || hasDeferredChildren) && <ExpandComponent itemId={itemId} />}
      </CellView>

      {activeColumns.map((column) => (
        <ColumnContext.Provider key={column.id} value={column}>
          <Cell itemId={itemId} />
        </ColumnContext.Provider>
      ))}

      <CellFill className={className} />

      {isExpanded && children.map((childId) => <Row key={childId} itemId={childId} indent={indent + 1} />)}

      {isExpanded && !hasChildren && (
        <>
          <DeferredPlaceholder>
            <CircularProgress size={20} />
          </DeferredPlaceholder>
        </>
      )}
    </>
  );
});
