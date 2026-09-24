import { describe, expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-react';
import { Table } from '..';
import { CellScheduler } from '../components/cellScheduler';
import type { TableProps } from '../types';

function busy(ms: number) {
  const end = performance.now() + ms;
  while (performance.now() < end);
}

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

describe('CellScheduler', () => {
  test('reveals visible rows first, then the rest in row order', async () => {
    const scheduler = new CellScheduler();
    scheduler.setVisibleRange(10, 12);
    const revealed: number[] = [];

    for (let rowIndex = 0; rowIndex < 15; rowIndex++) {
      scheduler.enqueue({ rowIndex, reveal: () => revealed.push(rowIndex) });
    }

    await expect.poll(() => revealed.length).toBe(15);
    expect(revealed).toEqual([10, 11, 12, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 13, 14]);
  });

  test('drops tasks whose cell unmounted before being revealed', async () => {
    const scheduler = new CellScheduler();
    const revealed: number[] = [];
    const cancel = scheduler.enqueue({
      rowIndex: 0,

      reveal: () => revealed.push(0),
    });
    scheduler.enqueue({ rowIndex: 1, reveal: () => revealed.push(1) });
    cancel();

    await expect.poll(() => revealed).toEqual([1]);
    await nextFrame();
    expect(revealed).toEqual([1]);
  });

  test('yields to other tasks between slices of expensive reveals', async () => {
    const scheduler = new CellScheduler();
    const slices: number[] = [];
    let otherTasks = 0;
    const channel = new MessageChannel();
    channel.port1.onmessage = () => {
      otherTasks++;
      if (slices.length < 10) channel.port2.postMessage(null);
    };
    channel.port2.postMessage(null);

    for (let rowIndex = 0; rowIndex < 10; rowIndex++) {
      scheduler.enqueue({
        rowIndex,

        reveal: () => {
          busy(5);
          slices.push(otherTasks);
        },
      });
    }

    await expect.poll(() => slices.length).toBe(10);
    // 5 ms each with an 8 ms budget: never more than two reveals before another task runs.
    const perSlice = new Map<number, number>();
    for (const slice of slices) perSlice.set(slice, (perSlice.get(slice) ?? 0) + 1);
    expect(Math.max(...perSlice.values())).toBeLessThanOrEqual(2);
  });
});

describe('deferred cells', () => {
  type Item = { id: number };
  const items: Item[] = Array.from({ length: 40 }, (_, id) => ({ id }));

  test('cells beyond the frame budget render placeholders, then each renders exactly once', async () => {
    const renders: string[] = [];
    const props: TableProps<Item> = {
      items,
      id: 'id',
      enableSelection: false,
      virtual: { deferCells: true, rowHeight: 40 },
      debugRender: (message: string) => renders.push(message),
      columns: (col) =>
        Array.from({ length: 6 }, (_, i) =>
          col((x) => x.id, {
            id: `c${i}`,
            width: '80px',
            renderCell: (value) => {
              busy(2);
              return `${value}-${i}`;
            },
          }),
        ),
    };

    await render(
      <div style={{ height: 400, overflowY: 'auto' }}>
        <Table {...props} />
      </div>,
    );

    const placeholders = () => document.querySelectorAll('[data-deferred]').length;
    await expect.poll(placeholders, { timeout: 5000 }).toBe(0);

    const cells = renders.filter((r) => r === 'render cell').length;
    expect(cells).toBe(document.querySelectorAll('[data-schummar-table] [title]').length);
    expect(renders.filter((r) => r === 'defer cell').length).toBeGreaterThan(0);
  });

  test('rows reveal all their deferred cells at once', async () => {
    const columnCount = 5;
    // Sees the DOM after every task, i.e. after every reveal slice.
    const partialRows = new Set<number>();
    let sawPlaceholders = false;
    const check = () => {
      for (const row of document.querySelectorAll<HTMLElement>('[data-index]')) {
        const placeholders = row.querySelectorAll('[data-deferred]').length;
        if (placeholders > 0) sawPlaceholders = true;
        if (placeholders !== 0 && placeholders !== columnCount) {
          partialRows.add(Number(row.dataset.index));
        }
      }
    };
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    check();

    await render(
      <div style={{ height: 400, overflowY: 'auto' }}>
        <Table<Item>
          items={items}
          id="id"
          enableSelection={false}
          virtual={{ deferCells: true, rowHeight: 40 }}
          columns={(col) =>
            Array.from({ length: columnCount }, (_, i) =>
              col((x) => x.id, {
                id: `c${i}`,
                renderCell: (value) => {
                  busy(2);
                  return `${value}-${i}`;
                },
              }),
            )
          }
        />
      </div>,
    );

    await expect
      .poll(() => sawPlaceholders && !document.querySelector('[data-deferred]'), { timeout: 5000 })
      .toBe(true);
    observer.disconnect();

    expect(partialRows).toEqual(new Set());
    expect(document.querySelector('[data-deferred]')).toBeNull();
  });

  test('a column can opt out of deferring', async () => {
    const deferred = new Set<string>();
    await render(
      <Table<Item>
        items={items.slice(0, 10)}
        id="id"
        virtual={{ deferCells: true }}
        debugRender={(message: string, columnId: string) => {
          if (message === 'defer cell') deferred.add(columnId);
        }}
        columns={(col) => [
          col((x) => x.id, {
            id: 'slow',
            renderCell: (value) => {
              busy(3);
              return `slow-${value}`;
            },
          }),
          col((x) => x.id, { id: 'fast', deferred: false, renderCell: (value) => `fast-${value}` }),
        ]}
      />,
    );

    await expect.poll(() => document.body.textContent).toContain('slow-9');
    expect(deferred).toEqual(new Set(['slow']));
  });
});
