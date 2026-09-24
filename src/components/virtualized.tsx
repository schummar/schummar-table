import { useVirtualizer, useWindowVirtualizer, type Virtualizer } from '@tanstack/react-virtual';
import { useLayoutEffect, useState, type ReactNode, type Ref, type RefObject } from 'react';
import type { Id, TableProps } from '../types';

type VirtualOptions = Exclude<TableProps<unknown>['virtual'], boolean | undefined>;

export type RenderRow = (index: number, measureRef?: Ref<HTMLDivElement>) => ReactNode;

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
      const element = findScrollRoot(probe!);
      const margin = Math.round(measureScrollMargin(probe!, element));
      setRoot((current) =>
        current && current.element === element && current.margin === margin
          ? current
          : { element, margin },
      );
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
  const items = virtualizer.getVirtualItems();
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

function ElementRows(props: VirtualRowsProps & { root: HTMLElement }) {
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

  return (
    <>
      <div ref={setProbe} style={spacerCss} />
      {root &&
        (root.element ? (
          <ElementRows {...props} root={root.element} scrollMargin={root.margin} />
        ) : (
          <WindowRows {...props} scrollMargin={root.margin} />
        ))}
    </>
  );
}
