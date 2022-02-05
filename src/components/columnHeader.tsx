import { makeStyles, Portal } from '@material-ui/core';
import { castDraft } from 'immer';
import React, { HTMLProps, useEffect, useRef, useState } from 'react';
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
  dragging: undefined as { index: number; targetIndex: number } | undefined,
});

export function ColumnHeader({ index, ...props }: { index: number } & HTMLProps<HTMLDivElement>) {
  const classes = useClasses();
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef(0);
  const store = ColumnHeaderContext.useStore();
  const [isDragged, setIsDragged] = useState<number>();
  const columnId = useColumnContext();
  const tableState = useTableContext();

  useEffect(() => {
    const div = ref.current;
    if (!div) return;

    store.update((state) => {
      state.items.add(castDraft(div));
    });

    return () => {
      console.log('unmount');

      store.update((state) => {
        state.items.delete(castDraft(div));
      });
    };
  }, [ref.current, store]);

  // function onDragStart(e: React.DragEvent) {
  //   start.current = e.clientX;
  //   e.dataTransfer.effectAllowed = 'move';
  // }

  // const onDrag = useMemo(
  //   () =>
  //     throttle((e: React.DragEvent) => {
  //       const { items } = store.getState();
  //       const divs = [...items.values()].sort((a, b) => a.offsetLeft - b.offsetLeft);
  //       const currentX = (e.target as HTMLDivElement).offsetLeft + e.clientX - start.current;

  //       let targetIndex = divs.findIndex((div) => div.offsetLeft + div.offsetWidth / 2 > currentX);

  //       if (targetIndex === -1) {
  //         targetIndex = divs.length - 1;
  //       }

  //       store.update((state) => {
  //         state.dragging = { index, targetIndex };
  //       });
  //     }, 16),
  //   [store],
  // );

  // function onDragEnd(e: React.DragEvent) {
  //   store.update((state) => {
  //     delete state.dragging;
  //   });
  // }

  // function onDragOver(e: React.DragEvent) {
  //   e.preventDefault();
  // }

  function onPointerDown(e: React.PointerEvent) {
    e.stopPropagation();

    const div = ref.current;
    if (!div) return;
    setIsDragged(e.clientX);
    div.setPointerCapture(e.pointerId);
    start.current = e.clientX;
  }

  function onPointerMove(e: React.PointerEvent) {
    e.stopPropagation();

    const div = ref.current;
    if (!div || isDragged === undefined) return;

    setIsDragged(e.clientX);
    div.setPointerCapture(e.pointerId);
    // div.style.transform = `translate3d(${e.clientX - start.current}px, 0, 0)`;
    // div.style.zIndex = 2;

    // const parent = div.parentElement as HTMLDivElement;
    // const width = Math.max(e.clientX - parent.getBoundingClientRect().left, 50);

    // tableState.update((state) => {
    //   state.columnWidths.set(columnId, `${width}px`);
    // });

    let targetIndex = [...store.getState().items]
      .sort((a, b) => a.offsetLeft - b.offsetLeft)
      .findIndex((x) => x.getBoundingClientRect().right > e.clientX);

    if (targetIndex === -1) {
      targetIndex = store.getState().items.size - 1;
    }

    tableState.update((state) => {
      const index = state.columnOrder.indexOf(columnId);
      state.columnOrder.splice(index, 1);
      state.columnOrder.splice(targetIndex, 0, columnId);
    });
  }

  function onPointerUp(e: React.PointerEvent) {
    console.log('up');

    e.stopPropagation();

    const div = e.target as HTMLDivElement;
    div.releasePointerCapture(e.pointerId);
    // div.style.transform = '';
    setIsDragged(undefined);
  }

  function onDoubleClick() {
    // tableState.update((state) => {
    //   state.columnWidths.set(columnId, 'max-content');
    // });
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

      <ResizeHandle />
      {/* <MoveTarget index={index} /> */}

      {isDragged !== undefined && (
        <Portal>
          <div
            style={{
              zIndex: 10,
              padding: 10,
              position: 'fixed',
              left: isDragged,
              top: ref.current?.getBoundingClientRect().top,
              background: 'red',
            }}
          >
            foo
          </div>
        </Portal>
      )}
    </div>
  );
}

function ResizeHandle() {
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

function MoveTarget({ index }: { index: number }) {
  const classes = useClasses();
  const state = ColumnHeaderContext.useState((state) => {
    if (state.dragging?.targetIndex !== index) return undefined;
    if (state.dragging.index > index) return 'right';
    return 'left';
  });

  return <div className={c(classes.moveTarget, state && classes[state])} />;
}
