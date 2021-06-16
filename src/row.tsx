import { CircularProgress } from '@material-ui/core';
import React from 'react';
import { CellFill, CellView, DeferredPlaceholder } from './elements';
import { ExpandComponent, useIsExpanded } from './expandComponent';
import { SelectComponent } from './selectComponent';
import { ColumnContext, useTableContext } from './table';
import { WithIds } from './types';

export function Row<T>({ item, indent = 0 }: { item: WithIds<T>; indent?: number }): JSX.Element {
  const {
    state,
    props,
    props: { hasDeferredChildren, columns, classes, activeItemsByParentId },
  } = useTableContext<T>();
  const isExpanded = useIsExpanded(item);
  const children = [...(activeItemsByParentId.get(item.id) ?? [])];
  const hasChildren = children.length > 0 || hasDeferredChildren?.(item);

  return (
    <>
      <CellFill />

      <CellView style={{ marginLeft: indent * 20 }}>
        <SelectComponent item={item} />

        {hasChildren && <ExpandComponent item={item} />}
      </CellView>

      {columns.map((column) => (
        <ColumnContext.Provider key={column.id} value={{ state, props, column }}>
          <CellView className={classes?.cell}>{column.renderCell(column.value(item), item)}</CellView>
        </ColumnContext.Provider>
      ))}

      <CellFill />

      {hasChildren && isExpanded && children.map((child) => <Row key={child.id} item={child} indent={indent + 1} />)}

      {hasChildren && isExpanded && children.length === 0 && (
        <>
          <DeferredPlaceholder>
            <CircularProgress size={20} />
          </DeferredPlaceholder>
        </>
      )}
    </>
  );
}
