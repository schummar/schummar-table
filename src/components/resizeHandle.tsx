import { makeStyles } from '@material-ui/core';
import React from 'react';
import { useColumnContext, useTableContext } from '..';

const useClasses = makeStyles((theme) => ({
  resizeHandle: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 6,
    height: '100%',
    background: theme.palette.grey[400],
    zIndex: 1,
    opacity: 0,
    transition: 'opactiy 300ms',
    cursor: 'col-resize',

    '&:hover, &:active': {
      opacity: 1,
    },
  },
}));

export function ResizeHandle() {
  const classes = useClasses();
  const columnId = useColumnContext();
  const tableState = useTableContext();

  function onPointerDown(e: React.PointerEvent) {
    e.stopPropagation();

    const div = e.target as HTMLDivElement;
    div.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    e.stopPropagation();

    const div = e.target as HTMLDivElement;
    if (!div.hasPointerCapture(e.pointerId)) return;

    const parent = div.parentElement as HTMLDivElement;
    const width = Math.max(e.clientX - parent.getBoundingClientRect().left, 50);

    tableState.update((state) => {
      state.columnWidths.set(columnId, `${width}px`);
    });
  }

  function onPointerUp(e: React.PointerEvent) {
    e.stopPropagation();

    const div = e.target as HTMLDivElement;
    div.releasePointerCapture(e.pointerId);
  }

  function onDoubleClick(e: React.MouseEvent) {
    tableState.update((state) => {
      if (e.getModifierState('Control')) {
        state.columnWidths.delete(columnId);
      } else {
        state.columnWidths.set(columnId, 'max-content');
      }
    });
  }

  return (
    <div
      className={classes.resizeHandle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClick}
    />
  );
}
