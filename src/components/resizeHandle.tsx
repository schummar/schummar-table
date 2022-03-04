import React, { HTMLProps } from 'react';
import { useColumnContext, useTableContext } from '..';

export function ResizeHandle() {
  const table = useTableContext();
  const columnId = useColumnContext();
  const enabled = table.useState('props.enableColumnResize');

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
    const width = Math.max(e.clientX - parent.getBoundingClientRect().left + 5, 50);

    table.update((state) => {
      state.columnWidths.set(columnId, `${width}px`);
    });
  }

  function onPointerUp(e: React.PointerEvent) {
    e.stopPropagation();

    const div = e.target as HTMLDivElement;
    div.releasePointerCapture(e.pointerId);
  }

  function onDoubleClick(e: React.MouseEvent) {
    table.update((state) => {
      if (e.getModifierState('Control')) {
        state.columnWidths.delete(columnId);
      } else {
        state.columnWidths.set(columnId, 'max-content');
      }
    });
  }

  return (
    <ResizeHandleView
      enabled={enabled}
      onPointerDown={enabled ? onPointerDown : undefined}
      onPointerMove={enabled ? onPointerMove : undefined}
      onPointerUp={enabled ? onPointerUp : undefined}
      onDoubleClick={enabled ? onDoubleClick : undefined}
    />
  );
}

export function ResizeHandleView({ enabled, ...props }: HTMLProps<HTMLDivElement> & { enabled?: boolean }) {
  return (
    <div
      css={{
        alignSelf: 'stretch',
        padding: '0 5px',
        cursor: enabled ? 'col-resize' : 'initial',
        display: 'flex',
        alignItems: 'center',

        '&:after': {
          content: '""',
          width: 1,
          height: '1.5em',
          background: 'currentColor',
          transition: 'transform 300ms',
        },
      }}
      {...props}
    />
  );
}
