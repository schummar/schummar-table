import { makeStyles } from '@material-ui/core';
import { castDraft } from 'immer';
import React, { HTMLProps, useEffect, useRef } from 'react';
import { StoreScope } from 'schummar-state/react';
import { useColumnContext, useTableContext } from '..';
import { c } from '../misc/helpers';

const useClasses = makeStyles((theme) => ({
  columnHeader: {
    position: 'relative',
    transition: 'background 300ms',
    userSelect: 'none',

    '&:hover': {
      background: theme.palette.grey[100],
    },
  },

  moveTarget: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: '100%',
    background: theme.palette.primary.main,
    zIndex: 1,
    opacity: 0,
    transition: 'opactiy 300ms',
  },

  left: {
    opacity: 1,
    left: 0,
  },

  right: {
    opacity: 1,
    right: 0,
  },
}));

export const ColumnHeaderContext = new StoreScope({
  items: new Set<HTMLDivElement>(),
});

export function ColumnHeader(props: HTMLProps<HTMLDivElement>) {
  const classes = useClasses();
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
    // const x = div.offsetLeft + div.offsetWidth / 2 + offset;
    // const items = [...store.getState().items].map((item) => item.offsetLeft + item.offsetWidth / 2).sort();
    // const i = items.findIndex((itemX) => itemX > x);
    // if (i === -1) return items.length - 1;
    // return i;

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

  function onPointerDown(e: React.PointerEvent) {
    const div = ref.current;
    if (!div) return;

    e.stopPropagation();
    div.setPointerCapture(e.pointerId);

    startX.current = e.clientX;

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
      left: `${div.getBoundingClientRect().left}px`,
      top: `${div.getBoundingClientRect().top}px`,
    });

    div.style.opacity = '0.2';
  }

  function onPointerMove(e: React.PointerEvent) {
    tableState.update((state) => {
      const div = ref.current;
      if (!div || startX.current === undefined || clone.current === undefined) return;

      e.stopPropagation();
      div.setPointerCapture(e.pointerId);

      clone.current.style.left = `${div.getBoundingClientRect().left + e.clientX - startX.current}px`;

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
      className={c(classes.columnHeader, props.className)}
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {props.children}
    </div>
  );
}
