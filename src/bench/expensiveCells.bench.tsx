import { createRoot, type Root } from 'react-dom/client';
import { describe, test } from 'vite-plus/test';
import { Table } from '..';
import type { TableProps } from '../types';
import { benchGroup } from './_baseline';

// act() would flush all rendering synchronously and hide what the user sees frame by frame.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;

type Item = { id: number; name: string };

const items: Item[] = Array.from({ length: 100 }, (_, id) => ({ id, name: `Person ${id}` }));

function ExpensiveCell({ value, ms }: { value: string; ms: number }) {
  const end = performance.now() + ms;
  while (performance.now() < end);
  return <>{value}</>;
}

// Same shape as the ExpensiveCells story, with 2 ms instead of 10 ms per cell to keep samples short.
const columns: TableProps<Item>['columns'] = (col) =>
  Array.from({ length: 10 }, (_x, i) =>
    col((x) => x.name, {
      id: `col${i}`,
      header: `Column ${i}`,
      renderCell: (value) => <ExpensiveCell value={value} ms={2} />,
    }),
  );

const variants = {
  eager: { virtual: true },
  deferred: { virtual: { deferCells: true } },
} satisfies Record<string, Partial<TableProps<Item>>>;

let root: Root | undefined;
let container: HTMLElement | undefined;

function mount(props: Partial<TableProps<Item>>) {
  container = document.createElement('div');
  container.style.cssText = 'height: 600px; overflow-y: auto';
  document.body.append(container);
  root = createRoot(container);
  root.render(<Table items={items} id="id" fullWidth="left" columns={columns} {...props} />);
}

function unmount() {
  root?.unmount();
  container?.remove();
}

async function until(condition: () => boolean) {
  while (!condition()) await new Promise((resolve) => requestAnimationFrame(resolve));
}

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const nextTask = () => new Promise((resolve) => setTimeout(resolve));
const hasRows = () => !!container?.querySelector('[data-index]');
const isRevealed = () => hasRows() && !container?.querySelector('[data-deferred]');

function cases(run: (props: Partial<TableProps<Item>>) => Promise<void>) {
  return Object.fromEntries(
    Object.entries(variants).map(([name, props]) => [name, () => run(props)]),
  );
}

const afterEach = { afterEach: unmount };

describe('expensive cells 100 rows x 10 columns, 2 ms per cell', () => {
  test('first paint', async (ctx) => {
    await benchGroup(
      ctx,
      cases(async (props) => {
        mount(props);
        await until(hasRows);
        await nextFrame();
      }),
      afterEach,
    );
  });

  test('fully revealed', async (ctx) => {
    await benchGroup(
      ctx,
      cases(async (props) => {
        mount(props);
        await until(isRevealed);
      }),
      afterEach,
    );
  });

  // How long a task queued right after mounting has to wait: the main thread is blocked meanwhile.
  test('task latency while mounting', async (ctx) => {
    await benchGroup(
      ctx,
      cases(async (props) => {
        mount(props);
        await nextTask();
      }),
      afterEach,
    );
  });
});
