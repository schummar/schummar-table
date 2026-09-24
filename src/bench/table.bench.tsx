import { describe, test } from 'vite-plus/test';
import { render } from 'vitest-browser-react';
import { Table } from '..';
import type { TableProps } from '../types';
import { benchGroup } from './_baseline';

type Item = { id: number; name: string } & Record<`c${number}`, string | number>;

function createItems(count: number): Item[] {
  return Array.from({ length: count }, (_, i) => {
    const item: Item = { id: i, name: `Row ${i}` };
    for (let c = 1; c < 12; c++) {
      item[`c${c}`] = c % 2 ? `v${(i * 7919 + c) % 1000}` : (i * c) % 997;
    }
    return item;
  });
}

const items = createItems(10_000);
const itemCopies = [[...items], [...items]];

const columns: TableProps<Item>['columns'] = (col) => [
  col((x) => x.name, { id: 'name', header: 'Name' }),
  ...Array.from({ length: 11 }, (_, i) =>
    col((x) => x[`c${i + 1}`], { id: `c${i + 1}`, header: `Col ${i + 1}` }),
  ),
];

const props: TableProps<Item> = {
  items,
  id: 'id',
  columns,
  virtual: true,
  classes: { row: 'bench-row' },
};

function Scroller(tableProps: Partial<TableProps<Item>>) {
  return (
    <div data-testid="scroller" style={{ height: 600, overflowY: 'auto' }}>
      <Table {...props} {...tableProps} />
    </div>
  );
}

async function until(condition: () => boolean) {
  const start = performance.now();
  while (!condition()) {
    if (performance.now() - start > 10_000) throw new Error('timeout');
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}

const firstRowText = () => document.querySelector('.bench-row')?.textContent ?? '';

// Clicking in-page instead of via userEvent keeps the Playwright round trip out of the timing.
function clickText(text: string) {
  const element = Array.from(document.querySelectorAll('div')).find(
    (div) => div.textContent === text && div.children.length === 0,
  );
  if (!element) throw new Error(`no element with text ${text}`);
  element.click();
}

const checkbox = (index: number) =>
  document.querySelectorAll<HTMLInputElement>('input[type=checkbox]')[index]!;

async function mountTable(tableProps: Partial<TableProps<Item>> = {}) {
  const screen = await render(<Scroller {...tableProps} />);
  await until(() => firstRowText() !== '');
  return screen;
}

describe('table 10k rows x 12 columns', () => {
  test('mount', async (ctx) => {
    let screen: Awaited<ReturnType<typeof render>> | undefined;

    await benchGroup(
      ctx,
      {
        mount: async () => {
          screen = await mountTable();
        },
      },
      {
        afterEach: async () => {
          await screen?.unmount();
        },
      },
    );
  });

  test('re-render', async (ctx) => {
    const screen = await mountTable();
    let i = 0;

    await benchGroup(ctx, {
      'parent re-render, same props': async () => {
        await screen.rerender(<Scroller />);
      },
      'parent re-render, new items array': async () => {
        await screen.rerender(<Scroller items={itemCopies[i++ % 2]} />);
      },
    });
  });

  test('interaction', async (ctx) => {
    await mountTable();

    await benchGroup(ctx, {
      'toggle sort': async () => {
        const before = firstRowText();
        clickText('Col 1');
        await until(() => firstRowText() !== before);
      },
      'toggle one row selection': async () => {
        const before = checkbox(3).checked;
        checkbox(3).closest('label')!.click();
        await until(() => checkbox(3).checked !== before);
      },
      'toggle select all': async () => {
        const before = checkbox(0).checked;
        checkbox(0).closest('label')!.click();
        await until(() => checkbox(0).checked !== before);
      },
    });
  });

  test('scroll', async (ctx) => {
    const screen = await mountTable();
    const scroller = screen.getByTestId('scroller').element();
    let i = 0;

    await benchGroup(ctx, {
      'jump 4000px': async () => {
        const before = firstRowText();
        scroller.scrollTop = i++ % 2 ? 0 : 4000;
        await until(() => firstRowText() !== before);
      },
    });
  });
});
