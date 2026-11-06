import type React from 'react';
import { useEffect, useRef } from 'react';
import { useTableStructure } from '../state/context';
import type { Id } from '../types';

const threshold = 5;
const interactive = 'button, input, select, textarea, a, label, [role="button"]';

type EndReason = 'drop' | 'escape' | 'abort';

/**
 * Drag a column header to reorder. The drag only touches the DOM and every way out (release,
 * cancel, Escape, blur, unmount) goes through `finish`, so no drag state can outlive it.
 */
export function useColumnDrag(columnId: Id) {
  const { props, visibleColumns, actions } = useTableStructure();
  const abort = useRef<(() => void) | undefined>(undefined);

  useEffect(() => () => abort.current?.(), []);

  function onPointerDown(event: React.PointerEvent<HTMLElement>) {
    if (!props.enableColumnReorder || event.button !== 0 || event.pointerType === 'touch') return;
    if (abort.current || (event.target as Element).closest(interactive)) return;

    const header = event.currentTarget;
    const table = header.closest<HTMLElement>('[data-schummar-table]');
    const headers = [...(header.parentElement?.children ?? [])].filter((element) =>
      element.hasAttribute('data-column-header'),
    ) as HTMLElement[];
    const from = headers.indexOf(header);
    const ids = visibleColumns.map((column) => column.id);
    if (!table || from === -1 || headers.length !== ids.length) return;

    const { pointerId, clientX: startX } = event;
    const { style } = header;
    const previousStyle = style.cssText;
    const bodyStyle = document.body.style;
    const previousBodyStyle = { cursor: bodyStyle.cursor, userSelect: bodyStyle.userSelect };
    let isDragging = false;
    let target: Id | undefined;
    let indicator: HTMLElement | undefined;
    const stopClick = (event: Event) => {
      event.stopPropagation();
      event.preventDefault();
    };

    function start() {
      isDragging = true;
      window.getSelection()?.removeAllRanges();
      // The release would otherwise click (and sort) whatever is under the pointer.
      window.addEventListener('click', stopClick, true);

      Object.assign(style, {
        zIndex: '3',
        boxShadow: '0 4px 12px rgb(0 0 0 / 20%)',
        cursor: 'grabbing',
      });
      Object.assign(bodyStyle, { cursor: 'grabbing', userSelect: 'none' });

      indicator = document.createElement('div');
      Object.assign(indicator.style, {
        position: 'absolute',
        top: '0',
        bottom: '0',
        width: '2px',
        marginLeft: '-1px',
        background: 'var(--primaryMain)',
        zIndex: '3',
        pointerEvents: 'none',
        display: 'none',
      });
      table!.append(indicator);
    }

    function update(clientX: number) {
      const rects = headers.map((header) => header.getBoundingClientRect());
      let index = 0;
      rects.forEach((rect, i) => {
        if (i !== from && rect.left + rect.width / 2 < clientX) index++;
      });

      target = index === from ? undefined : ids[index];
      if (target === undefined) {
        indicator!.style.display = 'none';
        return;
      }

      const edge = index < from ? rects[index]!.left : rects[index]!.right;
      const tableRect = table!.getBoundingClientRect();
      Object.assign(indicator!.style, {
        display: 'block',
        left: `${edge - tableRect.left - table!.clientLeft + table!.scrollLeft}px`,
      });
    }

    function onMove(event: PointerEvent) {
      if (event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      if (!isDragging) {
        if (Math.abs(dx) < threshold) return;
        start();
      }
      style.transform = `translateX(${dx}px)`;
      update(event.clientX);
    }

    const onUp = (event: PointerEvent) => event.pointerId === pointerId && finish('drop');
    const onCancel = (event: PointerEvent) => event.pointerId === pointerId && finish('abort');
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && finish('escape');
    const onBlur = () => finish('abort');

    const listeners = [
      ['pointermove', onMove],
      ['pointerup', onUp],
      ['pointercancel', onCancel],
      ['keydown', onKeyDown],
      ['blur', onBlur],
    ] as const;

    function finish(reason: EndReason) {
      abort.current = undefined;
      for (const [type, listener] of listeners) {
        window.removeEventListener(type, listener as EventListener);
      }
      if (!isDragging) return;

      style.cssText = previousStyle;
      Object.assign(bodyStyle, previousBodyStyle);
      indicator?.remove();

      const releaseClick = () => window.removeEventListener('click', stopClick, true);
      if (reason === 'drop') {
        setTimeout(releaseClick);
      } else if (reason === 'escape') {
        window.addEventListener('pointerup', () => setTimeout(releaseClick), { once: true });
      } else {
        releaseClick();
      }

      if (reason === 'drop' && target !== undefined) actions.moveColumn(columnId, target);
    }

    for (const [type, listener] of listeners) {
      window.addEventListener(type, listener as EventListener);
    }
    abort.current = () => finish('abort');
  }

  return onPointerDown;
}
