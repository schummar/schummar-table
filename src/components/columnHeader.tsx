import { castDraft } from 'immer';
import React, { HTMLProps, useEffect, useRef } from 'react';
import { StoreScope } from 'schummar-state/react';
import { useColumnContext, useTableContext } from '..';
import { throttle } from '../misc/throttle';

export const ColumnHeaderContext = new StoreScope({
  items: new Set<HTMLDivElement>(),
});

export function ColumnHeader(props: HTMLProps<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const columnId = useColumnContext();
  const tableState = useTableContext();

  const store = ColumnHeaderContext.useStore();
  const startX = useRef<number>();
  const clone = useRef<HTMLDivElement>();

  useEffect(() => {
    const div = ref.current;
    if (!div) return;

    store.update((state) => {
      state.items.add(castDraft(div));
    });

    return () => {
      store.update((state) => {
        state.items.delete(castDraft(div));
      });
    };
  }, [ref.current, store]);

  function calcTargetIndex(div: HTMLDivElement, offset: number) {
    const items = [...store.getState().items].sort((a, b) => a.offsetLeft - b.offsetLeft);
    const index = items.indexOf(div);
    let targetIndex = index,
      next;
    while ((next = items[targetIndex + 1]) && offset > (div.offsetWidth + next.offsetWidth) / 2) {
      targetIndex++;
      offset -= (div.offsetWidth + next.offsetWidth) / 2;
    }
    while ((next = items[targetIndex - 1]) && -offset > (div.offsetWidth + next.offsetWidth) / 2) {
      targetIndex--;
      offset += (div.offsetWidth + next.offsetWidth) / 2;
    }

    return targetIndex;
  }

  const updateClone = throttle((left: number) => {
    if (clone.current) {
      clone.current.style.left = `${left}px`;
    }
  }, 16);

  function onPointerDown(e: React.PointerEvent) {
    const div = ref.current;
    if (!div) return;
    startX.current = e.clientX;
  }

  function onPointerMove(e: React.PointerEvent) {
    tableState.update((state) => {
      const div = ref.current;
      if (!div || startX.current === undefined || Math.abs(e.clientX - startX.current) < 5) return;

      e.stopPropagation();
      div.setPointerCapture(e.pointerId);

      if (!clone.current) {
        clone.current = div.cloneNode(true) as HTMLDivElement;
        clone.current.id = 'foo';
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
          boxShadow: '0px 5px 5px -3px rgb(0 0 0 / 20%), 0px 8px 10px 1px rgb(0 0 0 / 14%), 0px 3px 14px 2px rgb(0 0 0 / 12%)',
          left: `${div.getBoundingClientRect().left}px`,
          top: `${div.getBoundingClientRect().top}px`,
        });

        div.style.opacity = '0.2';
      }

      updateClone(div.getBoundingClientRect().left + e.clientX - startX.current);

      const index = state.columnOrder.indexOf(columnId);
      const targetIndex = calcTargetIndex(div, e.clientX - startX.current);

      state.insertLine = targetIndex > index ? targetIndex + 1 : targetIndex < index ? targetIndex : undefined;
    });
  }

  function onPointerUp(e: React.PointerEvent) {
    const div = ref.current;
    if (!div || startX.current === undefined) return;

    clone.current?.remove();
    div.style.opacity = '';

    const targetIndex = calcTargetIndex(div, e.clientX - startX.current);

    tableState.update((state) => {
      const index = state.columnOrder.indexOf(columnId);

      state.columnOrder.splice(index, 1);
      state.columnOrder.splice(targetIndex, 0, columnId);
      state.insertLine = undefined;
    });

    startX.current = undefined;
    clone.current = undefined;
  }

  return (
    <div
      {...props}
      css={{
        position: 'relative',
        userSelect: 'none',
      }}
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {props.children}
    </div>
  );
}
