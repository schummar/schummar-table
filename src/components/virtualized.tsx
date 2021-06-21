import React, { HTMLProps, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { throttle } from '../misc/throttle';
import { useTableContext } from '../table';
import { Id } from '../types';

const onAncestorScroll = (x: HTMLElement, onScroll: () => void): (() => void) => {
  const find = (x: HTMLElement): Node[] => (x.parentElement ? [x.parentElement, ...find(x.parentElement)] : [document]);
  const ancestors = find(x);
  for (const ancestor of ancestors) {
    ancestor.addEventListener('scroll', onScroll);
  }

  return () => {
    for (const ancestor of ancestors) {
      ancestor.removeEventListener('scroll', onScroll);
    }
  };
};

const findScrollRoot = (x: HTMLElement): HTMLElement => {
  const parent = x.parentElement;
  if (!parent) return document.documentElement;
  if (parent.scrollHeight > parent.clientHeight) return parent;
  return findScrollRoot(parent);
};

const relativeOffset = (x: HTMLElement, y: HTMLElement): number => {
  if (x.offsetParent === y.offsetParent || !x.offsetParent) return x.offsetTop - y.offsetTop;
  if (x.offsetParent instanceof HTMLElement) return relativeOffset(x.offsetParent, y) + x.offsetTop;
  return 0;
};

export function Virtualized<T>({
  header,
  children,
  ...props
}: { header: ReactNode; children: (itemIds: Id[]) => ReactNode } & HTMLProps<HTMLDivElement>): JSX.Element {
  const state = useTableContext<T>();
  const virtual = state.useState('props.virtual');
  const probeRef = useRef<HTMLDivElement>(null);
  const [counter, setCounter] = useState(0);

  const {
    itemIds = [],
    before = 0,
    after = 0,
  } = state.useState(
    (state) => {
      const itemIds = state.activeItems.map((item) => item.id);
      const root = probeRef.current && findScrollRoot(probeRef.current);
      if (!state.props.virtual) return { itemIds };
      if (!probeRef.current || !root || !document.contains(root)) return {};

      const { rowHeight, initalRowHeight } = (state.props.virtual instanceof Object ? state.props.virtual : undefined) ?? {};

      let totalHeight = 0;
      const rowHeights = itemIds.map((itemId, index) => {
        const h = rowHeight ?? state.rowHeights.get(itemId) ?? initalRowHeight ?? (index === 0 ? 100 : totalHeight / index);
        totalHeight += h;
        return h;
      });

      const probeOffset = relativeOffset(probeRef.current, root);
      const headerHeight = probeRef.current.offsetTop;
      const topOfTable = root.scrollTop - probeOffset + headerHeight;
      const bottomOfTable = topOfTable + root.clientHeight - headerHeight;

      let from = 0,
        to = itemIds.length,
        before = 0,
        after = 0;
      for (const h of rowHeights) {
        if (before + h > topOfTable) break;
        from++;
        before += h;
      }

      for (const h of rowHeights.reverse()) {
        if (after + h > totalHeight - bottomOfTable) break;
        to--;
        after += h;
      }

      state.props.debug?.(`Virtualalized render ${from} to ${to}`);
      return { itemIds: itemIds.slice(from, to), before, after };
    },
    [probeRef.current, counter],
  );

  const throttleScroll = (typeof virtual === 'boolean' ? undefined : virtual)?.throttleScroll ?? 100;
  const incCounter = useMemo(() => throttle(() => setCounter((c) => c + 1), throttleScroll), [throttleScroll]);

  useEffect(() => {
    if (!virtual || !probeRef.current) return;
    return onAncestorScroll(probeRef.current, incCounter);
  }, [probeRef.current, incCounter]);

  return (
    <div {...props}>
      {header}

      {virtual && <div style={{ gridColumn: '1 / -1', height: before }} ref={probeRef} />}

      {children(itemIds)}

      {virtual && <div style={{ gridColumn: '1 / -1', height: after }} />}
    </div>
  );
}
