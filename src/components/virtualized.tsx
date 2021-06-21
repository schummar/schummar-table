import React, { HTMLProps, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../misc/helpers';
import { throttle } from '../misc/throttle';
import { useTableContext } from '../table';

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

export function Virtualized<T>({
  header,
  count,
  children,
  ...props
}: { header: ReactNode; count: number; children: (from: number, to: number) => ReactNode } & HTMLProps<HTMLDivElement>): JSX.Element {
  const state = useTableContext<T>();
  const { rowHeight, throttleScroll = 100 } = state.useState('props.virtual') ?? {};
  const probeRef = useRef<HTMLDivElement>(null);
  const [, setCounter] = useState(0);
  const incCounter = useMemo(() => throttle(() => setCounter((c) => c + 1), throttleScroll), [throttleScroll]);

  let from = 0,
    to = 0;
  if (!rowHeight) {
    to = count;
  } else if (probeRef.current) {
    const root = findScrollRoot(probeRef.current);
    if (document.contains(root)) {
      const topOutside = root.scrollTop;
      const height = root.clientHeight - probeRef.current.offsetTop;
      from = clamp(0, count, Math.floor(topOutside / rowHeight));
      to = clamp(0, count, Math.ceil((topOutside + height) / rowHeight));
    }
  }

  useEffect(() => {
    if (!rowHeight || !probeRef.current) return;
    return onAncestorScroll(probeRef.current, incCounter);
  }, [probeRef.current, incCounter]);

  return (
    <div {...props}>
      {header}

      {rowHeight && <div style={{ gridColumn: '1 / -1', height: from * rowHeight }} ref={probeRef} />}

      {children(from, to)}

      {rowHeight && <div style={{ gridColumn: '1 / -1', height: (count - to) * rowHeight }} />}
    </div>
  );
}
