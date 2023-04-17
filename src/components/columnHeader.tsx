import { castDraft } from 'immer';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { StoreScope } from 'schummar-state/react';
import { useColumnContext, useTableContext } from '../misc/tableContext';
import { useTheme } from '../hooks/useTheme';
import { cx } from '../misc/helpers';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';
import type { Id } from '../types';
import { FilterControl } from './filterControl';
import { ResizeHandle } from './resizeHandle';
import { SortComponent } from './sortComponent';

export const ColumnHeaderContext = new StoreScope({
  items: new Map<Id, HTMLDivElement>(),
});

export function ColumnHeader() {
  const ref = useRef<HTMLDivElement>(null);
  const columnId = useColumnContext();
  const table = useTableContext();
  const enabled = table.useState((state) => state.props.enableColumnReorder);
  const columnStyleOverride = table.useState((state) => state.columnStyleOverride.get(columnId), {
    throttle: 16,
  });
  const stickyHeader = table.useState((state) => state.props.stickyHeader);
  const classes = useTheme((theme) => theme.classes?.headerCell);
  const styles = useTheme((theme) => theme.styles?.headerCell);

  const { header, columnClasses, columnStyles } = table.useState((state) => {
    const column = state.activeColumns.find((column) => column.id === columnId);
    return {
      header: column?.header,
      columnClasses: column?.classes?.headerCell,
      columnStyles: column?.styles?.headerCell,
    };
  });

  const store = ColumnHeaderContext.useStore();
  const draggingStart = useRef<{ mouseX: number; bounds: DOMRect }>();
  const clone = useRef<HTMLDivElement>();

  // Track each headers div in a store
  useEffect(() => {
    const div = ref.current;
    if (!div) return;

    store.update((state) => {
      state.items.set(columnId, castDraft(div));
    });

    return () => {
      store.update((state) => {
        state.items.delete(columnId);
      });
    };
  }, [store, columnId]);

  // Calculate which index the current header would get, given the current offset
  function calcTargetIndex(offsetLeft: number) {
    const cols = table
      .getState()
      .columnOrder.map((id) => ({ id, div: store.getState().items.get(id) }));

    const otherCols = cols.filter((col) => col.id !== columnId);

    const firstOffsetleft = cols.find((col) => col.div)?.div?.offsetLeft ?? 0;

    let sum = 0;
    const targetIndex = otherCols.findIndex((col) => {
      const width = col.div?.offsetWidth ?? 0;
      if (sum + width / 2 > offsetLeft - firstOffsetleft) return true;
      sum += width;
      return false;
    });

    return targetIndex === -1 ? otherCols.length : targetIndex;
  }

  // When starting clicking: Record initial mouse and div's bounds
  function onPointerDown(event: React.PointerEvent) {
    const div = ref.current;
    if (!div) return;
    draggingStart.current = { mouseX: event.clientX, bounds: div.getBoundingClientRect() };
  }

  // When mouse moves while clicked: Calculate transforms
  function onPointerMove(event: React.PointerEvent) {
    table.update((state) => {
      const div = ref.current;
      if (
        !div ||
        draggingStart.current === undefined ||
        Math.abs(event.clientX - draggingStart.current.mouseX) < 5
      )
        return;

      event.stopPropagation();
      div.setPointerCapture(event.pointerId);

      // Create clone of header div to move around with mouse
      if (!clone.current) {
        clone.current = div.cloneNode(true) as HTMLDivElement;
        document.body.append(clone.current);

        for (const [key, value] of Object.entries(getComputedStyle(div))) {
          try {
            clone.current.style[key as any] = value;
          } catch {
            // ignore
          }
        }

        Object.assign(clone.current.style, {
          pointerEvents: 'none',
          position: 'fixed',
          boxShadow:
            '0px 5px 5px -3px rgb(0 0 0 / 20%), 0px 8px 10px 1px rgb(0 0 0 / 14%), 0px 3px 14px 2px rgb(0 0 0 / 12%)',
          left: `${draggingStart.current.bounds.left}px`,
          top: `${draggingStart.current.bounds.top}px`,
        });

        div.style.color = 'rgba(0, 0, 0, 0.2)';
      }

      // Update clone's position each time
      clone.current.style.left = `${
        draggingStart.current.bounds.left + event.clientX - draggingStart.current.mouseX
      }px`;

      // Calculate target index
      const index = state.columnOrder.indexOf(columnId);
      const targetIndex = calcTargetIndex(
        div.offsetLeft + event.clientX - draggingStart.current.mouseX,
      );

      // Apply transforms to each column
      const columns = table.getState().columnOrder.map((id, index) => ({
        id,
        index,
        width: store.getState().items.get(id)?.offsetWidth ?? 0,
      }));

      state.columnOrder.forEach((id, i) => {
        let offset = 0;
        if (i === index) {
          // Current column: Move to target pos
          if (targetIndex > index) {
            offset = columns
              .slice(index + 1, targetIndex + 1)
              .reduce((sum, col) => sum + col.width, 0);
          } else if (targetIndex < index) {
            offset = -columns.slice(targetIndex, index).reduce((sum, col) => sum + col.width, 0);
          }
        } else if (i >= targetIndex && i < index) {
          // Left columns: Move right to make room if needed
          offset = div.offsetWidth;
        } else if (i > index && i <= targetIndex) {
          // Right columns: Move left to make room if needed
          offset = -div.offsetWidth;
        }

        state.columnStyleOverride.set(id, {
          transition: 'transform 500ms',
          transform: `translate3d(${offset}px, 0, 0)`,
          zIndex: i === index ? 1 : undefined,
        });
      });
    });
  }

  // When releasing mouse: Reset draggin state and apply column move
  function onPointerUp(event: React.PointerEvent) {
    table.update((state) => {
      const div = ref.current;
      if (!div || draggingStart.current === undefined) return;

      // Apply column move
      const index = state.columnOrder.indexOf(columnId);
      const targetIndex = calcTargetIndex(
        div.offsetLeft + event.clientX - draggingStart.current.mouseX,
      );

      state.columnOrder.splice(index, 1);
      state.columnOrder.splice(targetIndex, 0, columnId);

      // Cleanup
      clone.current?.remove();
      div.style.color = '';
      state.columnStyleOverride.clear();
      draggingStart.current = undefined;
      clone.current = undefined;
    });
  }

  return (
    <div
      ref={ref}
      className={cx(classes, columnClasses)}
      css={[
        {
          position: 'relative',
          userSelect: 'none',
        },
        defaultClasses.headerCell,
        styles,
        columnStyles,
        stickyHeader && defaultClasses.sticky,
        stickyHeader instanceof Object && stickyHeader,
      ]}
      style={columnStyleOverride}
      onPointerDown={enabled ? onPointerDown : undefined}
      onPointerMove={enabled ? onPointerMove : undefined}
      onPointerUp={enabled ? onPointerUp : undefined}
    >
      <SortComponent>{header}</SortComponent>
      <div css={{ flex: 1 }} />
      <FilterControl />
      <ResizeHandle />
    </div>
  );
}
