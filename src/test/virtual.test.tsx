import { describe, expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-react';
import { Table } from '..';
import type { TableProps } from '../types';

type Item = { id: number; name: string };

const items: Item[] = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Row ${i}` }));

const props: TableProps<Item> = {
  items,
  id: 'id',
  virtual: true,
  enableSelection: false,
  classes: { row: 'row' },
  columns: (col) => [col((x) => x.name, { header: 'Name' })],
};

const renderedRows = () => document.querySelectorAll('.row').length;

describe('virtual', () => {
  test('renders only a window of rows inside a scroll container', async () => {
    const screen = await render(
      <div data-testid="scroller" style={{ height: 400, overflowY: 'auto' }}>
        <Table {...props} />
      </div>,
    );

    await expect.element(screen.getByText('Row 0', { exact: true })).toBeVisible();
    await expect.poll(renderedRows).toBeGreaterThan(0);
    await expect.poll(renderedRows).toBeLessThan(200);
    await expect.element(screen.getByText('Row 500', { exact: true })).not.toBeInTheDocument();

    const scroller = screen.getByTestId('scroller').element();
    // Scroll in steps so the measured row heights refine the estimate between updates.
    await expect
      .poll(
        () => {
          scroller.scrollTop += 2000;
          return document.body.textContent?.includes('Row 500');
        },
        { interval: 50, timeout: 5000 },
      )
      .toBe(true);

    await expect.element(screen.getByText('Row 500', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Row 0', { exact: true })).not.toBeInTheDocument();
    expect(renderedRows()).toBeLessThan(200);
  });

  test('scrolling to the end brings the last row into view', async () => {
    const screen = await render(
      <div data-testid="scroller" style={{ height: 400, overflowY: 'auto' }}>
        <Table {...props} />
      </div>,
    );

    await expect.element(screen.getByText('Row 0', { exact: true })).toBeVisible();
    const scroller = screen.getByTestId('scroller').element();

    await expect
      .poll(
        () => {
          scroller.scrollTop = scroller.scrollHeight;
          return document.body.textContent?.includes('Row 999');
        },
        { interval: 50, timeout: 5000 },
      )
      .toBe(true);
    await expect.element(screen.getByText('Row 999', { exact: true })).toBeVisible();
    expect(renderedRows()).toBeLessThan(200);
  });

  test('uses the document as scroll root when no container scrolls', async () => {
    const screen = await render(<Table {...props} />);

    await expect.element(screen.getByText('Row 0', { exact: true })).toBeVisible();
    await expect.poll(renderedRows).toBeLessThan(200);

    try {
      await expect
        .poll(
          () => {
            window.scrollBy(0, 2000);
            return document.body.textContent?.includes('Row 500');
          },
          { interval: 50, timeout: 5000 },
        )
        .toBe(true);
      expect(renderedRows()).toBeLessThan(200);
    } finally {
      window.scrollTo(0, 0);
    }
  });

  test('renders all rows when virtual is disabled', async () => {
    await render(<Table {...props} items={items.slice(0, 300)} virtual={false} />);

    await expect.poll(renderedRows).toBe(300);
  });
});
