import { CircularProgress } from '@material-ui/core';
import React from 'react';
import type { InternalTableProps } from './internalTypes';
import { CellFill, CellView, DeferredPlaceholder } from './tableElements';
import { Expand, useIsExpanded } from './tableExpand';
import { Select } from './tableSelect';

export function Row<T>(props: InternalTableProps<T> & { item: T; indent?: number }): JSX.Element {
  const { item, indent = 0, getChildren, childrenHook, columns = [] } = props;
  const isExpanded = useIsExpanded(props);
  const getResult = getChildren?.(item);
  const hookResult = childrenHook?.(item, isExpanded);
  const hasChildren = getResult ? getResult.length > 0 : hookResult?.hasChildren;
  const children = getResult ?? hookResult?.children;

  return (
    <>
      <CellFill />

      <CellView>
        <Select {...props} items={[]} indent={indent} />

        {hasChildren && <Expand {...props} />}
      </CellView>

      {columns.map((column) => (
        <CellView key={column.id} style={column.style}>
          {column.renderCell(column.value(item), item)}
        </CellView>
      ))}

      <CellFill />

      {hasChildren && isExpanded && children?.map((child, index) => <Row key={index} {...props} {...child} indent={indent + 1} />)}
      {hasChildren && open && !children && (
        <>
          <DeferredPlaceholder>
            <CircularProgress size={20} />
          </DeferredPlaceholder>
        </>
      )}
    </>
  );
}
