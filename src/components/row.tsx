import { CircularProgress } from '@material-ui/core';
import React, { memo } from 'react';
import { c } from '../misc/helpers';
import { ColumnContext, useTableContext } from '../table';
import { Id, InternalColumn } from '../types';
import { CellFill, CellView, DeferredPlaceholder } from './elements';
import { ExpandComponent } from './expandComponent';
import { SelectComponent } from './selectComponent';

const calcClassName = (classes: InternalColumn<any, any>['classes'] | undefined, index: number): string =>
  c(
    classes?.cell,
    classes?.evenCell === undefined ? undefined : { [classes.evenCell]: index % 2 === 0 },
    classes?.oddCell === undefined ? undefined : { [classes.oddCell]: index % 2 === 1 },
  );

export const Row = memo(function Row<T>({ id, indent = 0 }: { id: Id; indent?: number }): JSX.Element | null {
  const state = useTableContext<T>();
  const item = state.useState((state) => state.activeItemsById.get(id), [id]);
  const hasDeferredChildren = state.useState((state) => item && state.props.hasDeferredChildren?.(item), [item]);
  const classes = state.useState('props.classes');
  const activeColumns = state.useState('activeColumns');
  const activeItemsByParentId = state.useState('activeItemsByParentId');
  const items = state.useState('items');
  const activeItems = state.useState('activeItems');
  const isExpanded = state.useState((state) => state.expanded.has(id), [id]);
  const children = [...(activeItemsByParentId.get(id) ?? [])];
  const hasChildren = items.some((i) => i.parentId === id);

  if (!item) return null;
  const index = activeItems.indexOf(item);
  const className = calcClassName(classes, index);

  console.log('render row', activeColumns);

  return (
    <>
      <CellFill className={className} />

      <CellView className={className}>
        <div style={{ width: indent * 20 }} />

        <SelectComponent item={item} />

        {(hasChildren || hasDeferredChildren) && <ExpandComponent item={item} />}
      </CellView>

      {activeColumns.map((column) => (
        <ColumnContext.Provider key={column.id} value={column}>
          <CellView className={c(className, calcClassName(column.classes, index))}>{column.renderCell(column.value(item), item)}</CellView>
        </ColumnContext.Provider>
      ))}

      <CellFill className={className} />

      {isExpanded && children.map((child) => <Row key={child.id} id={child.id} indent={indent + 1} />)}

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
