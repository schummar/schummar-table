import { useVirtualizer } from '@tanstack/react-virtual';
import type { HTMLProps, ReactElement, ReactNode } from 'react';
import { useState } from 'react';

type VirtualOptions = { rowHeight?: number; estimatedRowHeight?: number; overscan?: number };

export interface VirtualListProps<T> extends Omit<HTMLProps<HTMLDivElement>, 'children'> {
  virtual?: boolean | VirtualOptions;
  items: T[];
  children: (item: T, index: number) => ReactNode;
}

const containerCss = { overflowY: 'auto', display: 'grid' } as const;

export function VirtualList<T>({
  virtual = true,
  items,
  children,
  ...props
}: VirtualListProps<T>): ReactElement {
  if (!virtual) {
    return (
      <div {...props} css={containerCss}>
        {items.map((item, index) => children(item, index))}
      </div>
    );
  }

  return (
    <VirtualItems {...props} items={items} options={virtual === true ? {} : virtual}>
      {children}
    </VirtualItems>
  );
}

function VirtualItems<T>({
  items,
  options,
  children,
  ...props
}: Omit<VirtualListProps<T>, 'virtual'> & { options: VirtualOptions }) {
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: items.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => options.rowHeight ?? options.estimatedRowHeight ?? 38,
    overscan: options.overscan ?? 5,
    useFlushSync: false,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const measure = options.rowHeight === undefined ? virtualizer.measureElement : undefined;
  const before = virtualItems[0]?.start ?? 0;
  // With no items rendered yet the spacer must still take up the full size: the virtualizer
  // renders nothing while the container has no height.
  const after = virtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end ?? 0);

  return (
    <div {...props} ref={setScrollElement} css={containerCss}>
      <div style={{ height: before }} />
      {virtualItems.map((virtualItem) => (
        <div
          key={virtualItem.key}
          ref={measure}
          data-index={virtualItem.index}
          css={{ display: 'grid' }}
        >
          {children(items[virtualItem.index]!, virtualItem.index)}
        </div>
      ))}
      <div style={{ height: after }} />
    </div>
  );
}
