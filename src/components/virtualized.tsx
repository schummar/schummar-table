import type { HTMLProps, ReactNode } from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTableContext } from '../misc/tableContext';
import { throttle } from '../misc/throttle';
import type { Id } from '../types';

const findScrollRoot = (x: HTMLElement): HTMLElement => {
  const parent = x.parentElement;
  if (!parent) return document.documentElement;
  if (parent.scrollHeight > parent.clientHeight && getComputedStyle(parent).overflowY !== 'visible')
    return parent;
  return findScrollRoot(parent);
};

const relativeOffset = (x: HTMLElement, y: HTMLElement): number => {
  if (x.offsetParent === y.offsetParent || !x.offsetParent) return x.offsetTop - y.offsetTop;
  if (x.offsetParent instanceof HTMLElement) return relativeOffset(x.offsetParent, y) + x.offsetTop;
  return 0;
};

export function Virtualized<T>({
  header,
  footer,
  children,
  ...props
}: {
  header: ReactNode;
  footer: ReactNode;
  children: (itemIds: Id[], startIndex: number) => ReactNode;
} & Omit<HTMLProps<HTMLDivElement>, 'children'>): JSX.Element {
  const table = useTableContext<T>();
  const virtual = table.useState('props.virtual');
  const probeRef = useRef<HTMLDivElement>(null);
  const [, setCounter] = useState(0);

  const {
    itemIds = [],
    from = 0,
    to,
    before = 0,
    after = 0,
  } = table.useState(
    (state) => {
      const itemIds = state.activeItems.map((item) => item.id);
      const root = probeRef.current && findScrollRoot(probeRef.current);
      if (!state.props.virtual) return { itemIds };
      if (!probeRef.current || !root || !document.contains(root)) return {};

      const {
        rowHeight,
        initalRowHeight,
        overscan = 100,
        overscanTop,
        overscanBottom,
      } = (state.props.virtual instanceof Object ? state.props.virtual : undefined) ?? {};

      let totalHeight = 0;
      const rowHeights = itemIds.map((itemId, index) => {
        const h =
          rowHeight ??
          state.rowHeights.get(itemId) ??
          initalRowHeight ??
          (index === 0 ? 100 : totalHeight / index);
        totalHeight += h;
        return h;
      });

      const probeOffset = relativeOffset(probeRef.current, root);
      const headerHeight = probeRef.current.offsetTop;
      const topOfTable = root.scrollTop - probeOffset + headerHeight;
      const bottomOfTable = topOfTable + root.clientHeight - headerHeight;

      let from = 0;
      let to = itemIds.length;
      let before = 0;
      let after = 0;
      for (const h of rowHeights) {
        if (before + h > topOfTable - (overscanTop ?? overscan)) break;
        from++;
        before += h;
      }

      for (const h of rowHeights.reverse()) {
        if (after + h > totalHeight - bottomOfTable - (overscanBottom ?? overscan)) break;
        to--;
        after += h;
      }

      return { itemIds: itemIds.slice(from, to), from, to, before, after };
    },
    { throttle: 16 },
  );

  const throttleScroll = (typeof virtual === 'boolean' ? undefined : virtual)?.throttleScroll ?? 16;
  const incCounter = useMemo(
    () => throttle(() => setCounter((c) => c + 1), throttleScroll),
    [throttleScroll],
  );

  useEffect(() => {
    if (!virtual || !probeRef.current) return;

    window.addEventListener('scroll', incCounter, true);
    window.addEventListener('resize', incCounter, true);
    return () => {
      window.removeEventListener('scroll', incCounter, true);
      window.removeEventListener('resize', incCounter, true);
    };
  }, [incCounter, virtual]);

  useEffect(() => incCounter.cancel, [incCounter]);

  useLayoutEffect(() =>
    table.getState().props.debugRender?.(`Virtualalized render ${from} to ${to}`),
  );

  return (
    <div {...props}>
      {header}

      {virtual && <div style={{ gridColumn: '1 / -1', height: before }} ref={probeRef} />}

      {children(itemIds, from)}

      {virtual && <div style={{ gridColumn: '1 / -1', height: after }} />}

      {footer}
    </div>
  );
}
