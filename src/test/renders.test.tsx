import { describe, expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser/context';
import { render } from 'vitest-browser-react';
import { Table } from '..';
import type { TableProps } from '../types';
import { persons, type Person } from './fixtures';

const columns: TableProps<Person>['columns'] = (col) => [
  col((x) => x.first_name, { id: 'first', header: 'First' }),
  col((x) => x.last_name, { id: 'last', header: 'Last' }),
];

function setup(props: Partial<TableProps<Person>> = {}) {
  const renders: string[] = [];
  const tableProps: TableProps<Person> = {
    items: persons.slice(0, 6),
    id: 'id',
    columns,
    debugRender: (message: string) => renders.push(message),
    ...props,
  };

  const count = (message: string) => renders.filter((r) => r === message).length;
  const reset = () => (renders.length = 0);
  return { tableProps, count, reset };
}

function rowCheckbox(index: number) {
  const input = page.getByRole('checkbox').all()[index + 1]!.element();
  return page.elementLocator(input.closest('label')!);
}

describe('render counts', () => {
  test('selecting a row renders no rows or cells', async () => {
    const { tableProps, count, reset } = setup();
    const screen = await render(<Table {...tableProps} />);
    await expect.element(screen.getByText('Kassia')).toBeVisible();

    reset();
    await userEvent.click(rowCheckbox(2));
    await expect.poll(() => count('render table')).toBeGreaterThan(0);
    expect(count('render row')).toBe(0);
    expect(count('render cell')).toBe(0);
  });

  test('re-rendering the parent with stable props renders no rows', async () => {
    const { tableProps, count, reset } = setup();
    const screen = await render(<Table {...tableProps} />);
    await expect.element(screen.getByText('Kassia')).toBeVisible();

    reset();
    await screen.rerender(<Table {...tableProps} />);
    expect(count('render row')).toBe(0);
    expect(count('render cell')).toBe(0);
  });

  test('re-rendering with equal but new props, columns and items renders no rows', async () => {
    const { tableProps, count, reset } = setup();
    const first = (x: Person) => x.first_name;
    const last = (x: Person) => x.last_name;
    const make = () => (
      <Table
        {...tableProps}
        items={[...tableProps.items!]}
        classes={{ row: 'row' }}
        defaultSelection={new Set([1])}
        columns={[
          { id: 'first', header: <b>First</b>, value: first },
          { id: 'last', header: 'Last', value: last },
        ]}
      />
    );
    const screen = await render(make());
    await expect.element(screen.getByText('Kassia')).toBeVisible();

    reset();
    await screen.rerender(make());
    expect(count('render row')).toBe(0);
    expect(count('render cell')).toBe(0);
  });

  test('a controlled Set that normalization changes is not re-reported on every render', async () => {
    const onSelectionChange = vi.fn();
    const { tableProps } = setup();
    // 99 does not exist, so normalization drops it and reports the result.
    const make = () => (
      <Table {...tableProps} selection={new Set([1, 99])} onSelectionChange={onSelectionChange} />
    );
    const screen = await render(make());
    await expect.element(screen.getByText('Kassia')).toBeVisible();
    await expect.poll(() => onSelectionChange.mock.calls.length).toBe(1);

    await screen.rerender(make());
    await screen.rerender(make());
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
  });

  test('dragging a column divider renders no rows until the drop', async () => {
    const { tableProps, count, reset } = setup({ enableSelection: false });
    const screen = await render(<Table {...tableProps} />);
    await expect.element(screen.getByText('Kassia')).toBeVisible();

    const header = screen
      .getByText('First', { exact: true })
      .element()
      .closest('[data-column-header]')!;
    const handle = header.lastElementChild as HTMLElement;
    const { right, top } = handle.getBoundingClientRect();
    const pointer = (type: string, x: number) =>
      handle.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          pointerId: 1,
          pointerType: 'mouse',
          clientX: x,
          clientY: top + 2,
        }),
      );

    reset();
    pointer('pointerdown', right);
    for (let i = 1; i <= 10; i++) pointer('pointermove', right + i * 10);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(count('render row')).toBe(0);
    expect(count('render table')).toBe(0);

    const width = header.getBoundingClientRect().width;
    pointer('pointerup', right + 100);
    await expect.poll(() => header.getBoundingClientRect().width).toBeCloseTo(width, -1);
    expect(count('render row')).toBe(0);
  });
});
