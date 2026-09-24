import { useVirtualizer, useWindowVirtualizer, type Virtualizer } from '@tanstack/react-virtual';
import {
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
  type RefCallback,
  type RefObject,
} from 'react';
import { CellSchedulerContext } from './cellScheduler';
import type { Id, TableProps } from '../types';

type VirtualOptions = Exclude<TableProps<unknown>['virtual'], boolean | undefined>;

export type RenderRow = (index: number, measureRef?: RefCallback<HTMLElement>) => ReactNode;

const spacerCss = { gridColumn: '1 / -1' } as const;

const scrolls = (element: HTMLElement) =>
  element.scrollHeight > element.clientHeight && getComputedStyle(element).overflowY !== 'visible';

function findScrollRoot(element: HTMLElement): HTMLElement | undefined {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (parent === document.documentElement) return undefined;
    if (parent === document.body) {
      // body's overflow applies to the viewport unless <html> sets its own.
      const ownScroller = getComputedStyle(document.documentElement).overflowY !== 'visible';
      return ownScroller && scrolls(parent) ? parent : undefined;
    }
    if (scrolls(parent)) return parent;
  }
  return undefined;
}

/** Offset of the first row from the start of the scroll root's content. */
function measureScrollMargin(probe: HTMLElement, root: HTMLElement | undefined) {
  if (!root) return probe.getBoundingClientRect().top + window.scrollY;
  return probe.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
}

/**
 * Finds the scroll root and the rows' offset in it. Both are re-measured when the table or the
 * page layout resizes: a container only becomes a scroll root once its content overflows, and
 * content above the table shifts the offset.
 */
function useScrollRoot(tableRef: RefObject<HTMLElement | null>, probe: HTMLElement | null) {
  const [root, setRoot] = useState<{ element: HTMLElement | undefined; margin: number }>();

  useLayoutEffect(() => {
    const table = tableRef.current;
    if (!probe || !table) return;

    function update() {
      setRoot((current) => {
        // A container stays the scroll root while it can scroll, even when a filter shrinks the
        // content below its height: switching virtualizers would remount every row.
        const keep =
          current?.element?.contains(probe) &&
          getComputedStyle(current.element).overflowY !== 'visible';
        const element = keep ? current!.element : findScrollRoot(probe!);
        const margin = Math.round(measureScrollMargin(probe!, element));
        return current && current.element === element && current.margin === margin
          ? current
          : { element, margin };
      });
    }

    update();
    const observer = new ResizeObserver(update);
    observer.observe(table);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [tableRef, probe]);

  return root;
}

interface VirtualRowsProps {
  count: number;
  getKey: (index: number) => Id;
  options: VirtualOptions;
  scrollMargin: number;
  renderRow: RenderRow;
}

function VirtualWindow({
  virtualizer,
  renderRow,
  measure,
}: {
  virtualizer: Virtualizer<any, HTMLDivElement>;
  renderRow: RenderRow;
  measure: boolean;
}) {
  'use no memo';
  const items = virtualizer.getVirtualItems();
  const scheduler = useContext(CellSchedulerContext);

  // Deferred cells of rows in the viewport are revealed before those in the overscan.
  useLayoutEffect(() => {
    const { range } = virtualizer;
    if (range) scheduler?.setVisibleRange(range.startIndex, range.endIndex);
  });

  const margin = virtualizer.options.scrollMargin;
  const before = items.length ? items[0]!.start - margin : 0;
  const after = items.length
    ? virtualizer.getTotalSize() - (items[items.length - 1]!.end - margin)
    : 0;

  return (
    <>
      <div style={{ ...spacerCss, height: before }} />
      {items.map((item) => renderRow(item.index, measure ? virtualizer.measureElement : undefined))}
      <div style={{ ...spacerCss, height: after }} />
    </>
  );
}

function virtualizerOptions({ count, getKey, options, scrollMargin }: VirtualRowsProps) {
  return {
    count,
    getItemKey: getKey,
    estimateSize: () => options.rowHeight ?? options.estimatedRowHeight ?? 40,
    overscan: options.overscan ?? 5,
    scrollMargin,
  };
}

// The virtualizers return the same mutable object on every render: memoizing on it would freeze
// the rows, so these must stay out of React Compiler.
function ElementRows(props: VirtualRowsProps & { root: HTMLElement }) {
  'use no memo';
  const virtualizer = useVirtualizer<HTMLElement, HTMLDivElement>({
    ...virtualizerOptions(props),
    getScrollElement: () => props.root,
  });
  return (
    <VirtualWindow
      virtualizer={virtualizer}
      renderRow={props.renderRow}
      measure={props.options.rowHeight === undefined}
    />
  );
}

function WindowRows(props: VirtualRowsProps) {
  'use no memo';
  const virtualizer = useWindowVirtualizer<HTMLDivElement>(virtualizerOptions(props));
  return (
    <VirtualWindow
      virtualizer={virtualizer}
      renderRow={props.renderRow}
      measure={props.options.rowHeight === undefined}
    />
  );
}

export function VirtualRows({
  tableRef,
  ...props
}: Omit<VirtualRowsProps, 'scrollMargin'> & { tableRef: RefObject<HTMLElement | null> }) {
  const [probe, setProbe] = useState<HTMLDivElement | null>(null);
  const root = useScrollRoot(tableRef, probe);
  const estimate = props.options.rowHeight ?? props.options.estimatedRowHeight ?? 40;

  return (
    <>
      <div ref={setProbe} style={spacerCss} />
      {/* Takes the rows' estimated space until the scroll root is known, so the container that
          will scroll already overflows and gets picked right away. */}
      {!root && <div style={{ ...spacerCss, height: props.count * estimate }} />}
      {root &&
        (root.element ? (
          <ElementRows {...props} root={root.element} scrollMargin={root.margin} />
        ) : (
          <WindowRows {...props} scrollMargin={root.margin} />
        ))}
    </>
  );
}
