import type React from 'react';
import { useEffect, useRef, type HTMLProps } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useColumnContext, useTableStructure } from '../state/context';

export const columnWidthVariable = (index: number) => `--column-width-${index}`;

export function ResizeHandle() {
  const { props, visibleColumns, actions } = useTableStructure();
  const columnId = useColumnContext();
  const enabled = props.enableColumnResize;
  const index = visibleColumns.findIndex((column) => column.id === columnId);
  const table = useRef<HTMLElement | null>(null);
  const hasMoved = useRef(false);

  // The drag width lives in a CSS variable, keyed by visible index, so dragging renders nothing.
  const variable = columnWidthVariable(index);
  useEffect(
    () => () => {
      table.current?.style.removeProperty(variable);
    },
    [variable],
  );

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    table.current = event.currentTarget.closest('[data-schummar-table]');
    hasMoved.current = false;
  }

  function widthAt(event: React.PointerEvent<HTMLDivElement>) {
    const header = event.currentTarget.parentElement!;
    const minWidth = visibleColumns.find((column) => column.id === columnId)?.filter ? 80 : 50;
    return Math.max(event.clientX - header.getBoundingClientRect().left + 5, minWidth);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    event.stopPropagation();
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    hasMoved.current = true;
    table.current?.style.setProperty(variable, `${widthAt(event)}px`);
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    event.stopPropagation();
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    // The committed width renders before the next paint, so dropping the variable doesn't flash.
    table.current?.style.removeProperty(variable);
    if (hasMoved.current) actions.setColumnWidth(columnId, `${widthAt(event)}px`);
  }

  function onDoubleClick(event: React.MouseEvent) {
    actions.setColumnWidth(columnId, event.getModifierState('Control') ? undefined : 'max-content');
  }

  if (!enabled) {
    return null;
  }

  return (
    <ResizeHandleView
      enabled={enabled}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClick}
    />
  );
}

export function ResizeHandleView({
  enabled,
  ...props
}: HTMLProps<HTMLDivElement> & { enabled?: boolean | 'visualOnly' }) {
  const className = useTheme((theme) => theme.classes?.columnDivider);
  const styles = useTheme((theme) => theme.styles?.columnDivider);

  return (
    <div
      className={className}
      css={[
        {
          alignSelf: 'stretch',
          padding: '0 5px',
          cursor: enabled === true ? 'col-resize' : 'initial',
          display: 'flex',
          alignItems: 'center',

          '&:after': {
            content: '""',
            width: 1,
            height: '1.5em',
            background: '#c9cfda',
            transition: 'transform 300ms',
          },

          '@media (pointer: coarse)': {
            pointerEvents: 'none',
          },
        },
        styles,
      ]}
      {...props}
    />
  );
}
