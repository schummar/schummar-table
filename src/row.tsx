import { CircularProgress } from '@material-ui/core';
import React from 'react';
import { CellFill, CellView, DeferredPlaceholder } from './elements';
import { ExpandComponent, useIsExpanded } from './expandComponent';
import { c } from './helpers';
import { SelectComponent } from './selectComponent';
import { ColumnContext, useTableContext } from './table';
import { InternalColumn, WithIds } from './types';

const calcClassName = (classes: InternalColumn<any, any>['classes'] | undefined, index: number): string =>
  c(
    classes?.cell,
    classes?.evenCell === undefined ? undefined : { [classes.evenCell]: index % 2 === 0 },
    classes?.oddCell === undefined ? undefined : { [classes.oddCell]: index % 2 === 1 },
  );

export function Row<T>({ item, indent = 0 }: { item: WithIds<T>; indent?: number }): JSX.Element {
  const {
    state,
    props,
    props: { hasDeferredChildren, activeColumns, classes, activeItemsByParentId, items, activeItems },
  } = useTableContext<T>();
  const isExpanded = useIsExpanded(item);
  const children = [...(activeItemsByParentId.get(item.id) ?? [])];
  const hasChildren = items.some((i) => i.parentId === item.id);
  const index = activeItems.indexOf(item);
  const className = calcClassName(classes, index);

  return (
    <>
      <CellFill className={className} />

      <CellView className={className}>
        <div style={{ width: indent * 20 }} />

        <SelectComponent item={item} />

        {(hasChildren || hasDeferredChildren?.(item)) && <ExpandComponent item={item} />}
      </CellView>

      {activeColumns.map((column) => (
        <ColumnContext.Provider key={column.id} value={{ state, props, column }}>
          <CellView className={c(className, calcClassName(column.classes, index))}>{column.renderCell(column.value(item), item)}</CellView>
        </ColumnContext.Provider>
      ))}

      <CellFill className={className} />

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
