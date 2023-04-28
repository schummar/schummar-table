import type { HTMLProps, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { throttle } from '../misc/throttle';

export interface VirtualListProps<T> extends Omit<HTMLProps<HTMLDivElement>, 'children'> {
  virtual?:
    | boolean
    | {
        rowHeight?: number;
        initalRowHeight?: number;
        throttleScroll?: number;
        overscan?: number;
        overscanBottom?: number;
        overscanTop?: number;
      };
  items: T[];
  children: (item: T, index: number) => ReactNode;
}

export function VirtualList<T>({
  virtual = true,
  items,
  children,
  ...props
}: VirtualListProps<T>): JSX.Element {
  const container = useRef<HTMLDivElement>(null);
  const [, setId] = useState({});

  const throttleScroll = (typeof virtual === 'boolean' ? undefined : virtual)?.throttleScroll ?? 16;
  const update = useMemo(() => throttle(() => setId({}), throttleScroll), [throttleScroll]);

  useEffect(() => {
    if (!virtual) return;

    const ro = new ResizeObserver(update);

    if (container.current) {
      ro.observe(container.current);
    }

    window.addEventListener('resize', update, true);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update, true);
      update.cancel();
    };
  }, [update, virtual, throttleScroll]);

  if (!virtual) {
    return (
      <div
        {...props}
        css={{
          overflowY: 'auto',
          display: 'grid',
        }}
      >
        {items.map((item, index) => children(item, index))}
      </div>
    );
  }

  const {
    rowHeight,
    initalRowHeight = 38,
    overscan = 100,
    overscanTop,
    overscanBottom,
  } = (virtual instanceof Object ? virtual : undefined) ?? {};

  const itemHeight = rowHeight ?? (averageItemHeight(container.current) || initalRowHeight);
  const from = container.current?.clientHeight
    ? Math.max(
        0,
        Math.floor((container.current.scrollTop - (overscanTop ?? overscan)) / itemHeight),
      )
    : 0;
  const to = container.current?.clientHeight
    ? Math.min(
        items.length,
        Math.ceil(
          (container.current.scrollTop +
            container.current.clientHeight +
            (overscanBottom ?? overscan)) /
            itemHeight,
        ),
      )
    : 1;
  const before = from * itemHeight;
  const after = (items.length - to) * itemHeight;

  return (
    <div
      {...props}
      onScroll={(event) => {
        update();
        props.onScroll?.(event);
      }}
      ref={container}
      css={{
        overflowY: 'auto',
        display: 'grid',
      }}
    >
      <div data-virtual-before style={{ height: before }} />
      {items.slice(from, to).map((item, index) => children(item, index + from))}
      <div data-virtual-after style={{ height: after }} />
    </div>
  );
}

function averageItemHeight(container: HTMLDivElement | null) {
  if (!container?.children.length) {
    return undefined;
  }

  const heights = Array.from(container.children)
    .slice(1, -1)
    .map((child) => child.clientHeight);
  return heights.reduce((a, b) => a + b, 0) / heights.length;
}
