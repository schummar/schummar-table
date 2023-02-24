import type { HTMLProps } from 'react';
import type React from 'react';
import { useColumnContext, useTableContext } from '../misc/tableContext';

export function ResizeHandle() {
  const table = useTableContext();
  const columnId = useColumnContext();
  const enabled = table.useState('props.enableColumnResize');

  function onPointerDown(event: React.PointerEvent) {
    event.stopPropagation();

    const div = event.target as HTMLDivElement;
    div.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent) {
    event.stopPropagation();

    const div = event.target as HTMLDivElement;
    if (!div.hasPointerCapture(event.pointerId)) return;

    const parent = div.parentElement as HTMLDivElement;
    const width = Math.max(event.clientX - parent.getBoundingClientRect().left + 5, 50);

    table.update((state) => {
      state.columnWidths.set(columnId, `${width}px`);
    });
  }

  function onPointerUp(event: React.PointerEvent) {
    event.stopPropagation();

    const div = event.target as HTMLDivElement;
    div.releasePointerCapture(event.pointerId);
  }

  function onDoubleClick(event: React.MouseEvent) {
    table.update((state) => {
      if (event.getModifierState('Control')) {
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

export function ResizeHandleView({
  enabled,
  ...props
}: HTMLProps<HTMLDivElement> & { enabled?: boolean }) {
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
          background: '#c9cfda',
          transition: 'transform 300ms',
        },
      }}
      {...props}
    />
  );
}
