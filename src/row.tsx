import { CircularProgress } from '@material-ui/core';
import React from 'react';
import { CellFill, CellView, DeferredPlaceholder } from './elements';
import { ExpandComponent, useIsExpanded } from './expandComponent';
import { SelectComponent } from './selectComponent';
import { ColumnContext, useTableContext } from './table';

export function Row<T>({ item, indent = 0 }: { item: T; indent?: number }): JSX.Element {
  const {
    state,
    props,
    props: { getChildren, childrenHook, columns },
  } = useTableContext<T>();
  const isExpanded = useIsExpanded(item);
  const getResult = getChildren?.(item);
  const hookResult = childrenHook?.(item, isExpanded);
  const hasChildren = getResult ? getResult.length > 0 : hookResult?.hasChildren;
  const children = getResult ?? hookResult?.children;

  return (
    <>
      <CellFill />

      <CellView style={{ paddingLeft: indent * 20 }}>
        <SelectComponent items={[item]} />

        {hasChildren && <ExpandComponent item={item} />}
      </CellView>

      {columns.map((column) => (
        <ColumnContext.Provider key={column.id} value={{ state, props, column }}>
          <CellView style={column.style}>{column.renderCell(column.value(item), item)}</CellView>
        </ColumnContext.Provider>
      ))}

      <CellFill />

      {hasChildren && isExpanded && children?.map((child, index) => <Row key={index} item={child} indent={indent + 1} />)}
      {hasChildren && isExpanded && !children && (
        <>
          <DeferredPlaceholder>
            <CircularProgress size={20} />
          </DeferredPlaceholder>
        </>
      )}
    </>
  );
}
