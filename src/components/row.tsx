import { ClassNames } from '@emotion/react';
import { memo, useLayoutEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { calcClassNames, calcCss } from '../misc/calcClassNames';
import { cx, getAncestors } from '../misc/helpers';
import { ColumnContext, useTableContext } from '../misc/tableContext';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';
import type { Id } from '../types';
import { Cell } from './cell';
import { Details } from './details';
import { ExpandControl } from './expandControl';
import { SelectComponent } from './selectComponent';

export const Row = memo(function Row<T>({
  itemId,
  rowIndex,
}: {
  itemId: Id;
  rowIndex: number;
}): JSX.Element | null {
  const table = useTableContext<T>();
  const divRef = useRef<HTMLDivElement>(null);
  const detailsDivRef = useRef<HTMLDivElement>(null);

  const classes = useTheme((t) => t.classes);
  const styles = useTheme((t) => t.styles);

  const item = table.useState((state) => state.activeItemsById.get(itemId));
  const wrapRow = table.useState((state) => state.props.wrapRow) ?? ((props) => <div {...props} />);
  const rowClassName =
    classes?.row instanceof Function ? classes.row(item?.value, rowIndex) : classes?.row;
  const rowStyles =
    styles?.row instanceof Function ? styles.row(item?.value, rowIndex) : styles?.row;
  const subgrid = table.useState((state) => state.props.subgrid);

  const {
    cellClassName,
    css_,
    indent,
    hasChildren,
    hasDeferredChildren,
    columnIds,
    enableSelection,
    rowAction,
    hasDetails,
  } = table.useState((state) => {
    const item = state.activeItemsById.get(itemId);

    return {
      cellClassName: cx(...calcClassNames(classes, item?.value, rowIndex)),
      css_: calcCss<T>(styles, item?.value, rowIndex),
      indent: item ? getAncestors(state.activeItemsById, item).size : 0,
      hasChildren: !!item?.children.length,
      hasDeferredChildren: item && state.props.hasDeferredChildren?.(item.value),
      columnIds: state.visibleColumns.map((column) => column.id),
      enableSelection: state.props.enableSelection,
      rowAction:
        state.props.rowAction instanceof Function
          ? item
            ? state.props.rowAction(item.value, rowIndex)
            : null
          : state.props.rowAction,
      hasDetails:
        state.props.rowDetails instanceof Function
          ? item
            ? !!state.props.rowDetails(item.value, rowIndex)
            : null
          : !!state.props.rowDetails,
    };
  });

  useLayoutEffect(() => {
    function update() {
      table.update((state) => {
        if (!divRef.current) {
          return;
        }

        const h1 = divRef.current.offsetHeight;
        const h2 =
          detailsDivRef.current && document.contains(detailsDivRef.current)
            ? detailsDivRef.current.offsetHeight
            : 0;

        state.rowHeights.set(itemId, h1 + h2);
      });
    }

    update();

    const handles = [divRef.current, detailsDivRef.current]
      .filter((x): x is HTMLDivElement => !!x)
      .map((div) => {
        const o = new ResizeObserver(update);
        o.observe(div);
        return () => o.disconnect();
      });

    return () => {
      handles.forEach((h) => h());
    };
  }, [table, itemId, divRef.current, detailsDivRef.current]);

  useLayoutEffect(() => table.getState().props.debugRender?.('render row', itemId));

  if (!item) {
    return null;
  }

  return (
    <ClassNames>
      {({ css }) => (
        <>
          {wrapRow(
            {
              className: css([
                subgrid
                  ? {
                      gridColumn: `1 / -1`,
                      display: 'grid',
                      gridTemplateColumns: 'subgrid',
                    }
                  : {
                      display: 'contents',
                    },
                rowClassName,
                rowStyles,
              ]),

              children: (
                <>
                  <div
                    className={cellClassName}
                    css={[defaultClasses.cellFill, css_]}
                    ref={divRef}
                  />

                  <div
                    className={cellClassName}
                    css={[defaultClasses.cell, defaultClasses.firstCell, css_]}
                  >
                    {indent > 0 && <div css={{ width: indent * 20 }} />}

                    {enableSelection && <SelectComponent itemId={itemId} />}

                    {(hasChildren || hasDeferredChildren || hasDetails) && (
                      <ExpandControl itemId={itemId} hasDeferredChildren={hasDeferredChildren} />
                    )}

                    {rowAction}
                  </div>

                  {columnIds.map((columnId) => (
                    <ColumnContext.Provider key={columnId} value={columnId}>
                      <Cell itemId={itemId} rowIndex={rowIndex} />
                    </ColumnContext.Provider>
                  ))}

                  <div className={cellClassName} css={[defaultClasses.cellFill, css_]} />

                  <Details ref={detailsDivRef} itemId={itemId} rowIndex={rowIndex} />
                </>
              ),
            },
            item.value,
            rowIndex,
          )}
        </>
      )}
    </ClassNames>
  );
});
