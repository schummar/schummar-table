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
    props: { hasDeferredChildren, columns, classes, activeItemsByParentId, items },
  } = useTableContext<T>();
  const isExpanded = useIsExpanded(item);
  const children = [...(activeItemsByParentId.get(item.id) ?? [])];
  const hasChildren = items.some((i) => i.parentId === item.id);

  return (
    <>
      <CellFill />

      <CellView style={{ marginLeft: indent * 20 }}>
        <SelectComponent item={item} />

        {(hasChildren || hasDeferredChildren?.(item)) && <ExpandComponent item={item} />}
      </CellView>

      {columns.map((column) => (
        <ColumnContext.Provider key={column.id} value={{ state, props, column }}>
          <CellView className={classes?.cell}>{column.renderCell(column.value(item), item)}</CellView>
        </ColumnContext.Provider>
      ))}

      <CellFill />

      {isExpanded && children.map((child) => <Row key={child.id} item={child} indent={indent + 1} />)}

      {isExpanded && !hasChildren && (
        <>
          <DeferredPlaceholder>
            <CircularProgress size={20} />
          </DeferredPlaceholder>
        </>
      )}
    </>
  );
}
