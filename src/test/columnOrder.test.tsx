import { describe, expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser/context';
import { render } from 'vitest-browser-react';
import { Table } from '..';
import type { Id, TableProps } from '../types';
import { persons, type Person } from './fixtures';

const headers = ['First name', 'Last name', 'Job title'];

function PersonTable(props: Partial<TableProps<Person>>) {
  return (
    <Table<Person>
      items={persons.slice(0, 3)}
      id="id"
      enableSelection={false}
      columns={(col) => [
        col((x) => x.first_name, { id: 'first_name', header: 'First name' }),
        col((x) => x.last_name, { id: 'last_name', header: 'Last name' }),
        col((x) => x.job_title, { id: 'job_title', header: 'Job title' }),
      ]}
      {...props}
    />
  );
}

function renderPersons(props: Partial<TableProps<Person>> = {}) {
  return render(<PersonTable {...props} />);
}

function headerCells() {
  return [...document.querySelectorAll<HTMLElement>('[data-column-header]')];
}

function tableHeaders() {
  return headerCells().map((el) => el.textContent);
}

function header(name: string) {
  const el = headerCells().find((el) => el.textContent === name);
  if (!el) throw new Error(`no header ${name}`);
  return el;
}

// The first cell of the first row, which belongs to the leftmost column.
function firstRowCells() {
  const row = [...document.querySelectorAll<HTMLElement>('[title]')].map((el) => el.title);
  return row.slice(0, 3);
}

async function openColumnSelection() {
  const button = document.querySelector('button:has(path[d^="M3 17v2h6"])');
  if (!button) throw new Error('no column selection button');
  await userEvent.click(button);
  await expect.element(page.getByText('Select visible columns')).toBeVisible();
}

function moveButton(column: string, direction: 'left' | 'right') {
  const popover = page.getByText('Select visible columns').element().parentElement!;
  const label = [...popover.querySelectorAll('label')].find((el) => el.textContent === column);
  const row = label!.parentElement!;
  return row.querySelector<HTMLButtonElement>(`button[aria-label="Move column ${direction}"]`)!;
}

function pointer(target: EventTarget, type: string, clientX: number, clientY = 10) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      button: 0,
      pointerId: 1,
      pointerType: 'mouse',
      clientX,
      clientY,
    }),
  );
}

/** Starts dragging `name`'s header and moves the pointer to the center of `to`. */
function dragOver(name: string, to: string) {
  const source = header(name).getBoundingClientRect();
  const target = header(to).getBoundingClientRect();
  const y = source.top + source.height / 2;
  const x = target.left + target.width / 2 + (target.left < source.left ? -1 : 1);
  pointer(header(name), 'pointerdown', source.left + 10, y);
  pointer(window, 'pointermove', source.left + 20, y);
  pointer(window, 'pointermove', x, y);
  return x;
}

function indicators() {
  return [...document.querySelectorAll<HTMLElement>('[data-schummar-table] > div')].filter(
    (el) => el.style.position === 'absolute',
  );
}

describe('column order', () => {
  test('arrows in the column selection move columns', async () => {
    const onColumnOrderChange = vi.fn<(order: Id[]) => void>();
    await renderPersons({ onColumnOrderChange });
    await openColumnSelection();

    expect(moveButton('First name', 'left').disabled).toBe(true);
    expect(moveButton('Job title', 'right').disabled).toBe(true);

    await userEvent.click(moveButton('First name', 'right'));
    await expect.poll(tableHeaders).toEqual(['Last name', 'First name', 'Job title']);
    expect(onColumnOrderChange).toHaveBeenLastCalledWith(['last_name', 'first_name', 'job_title']);
    expect(firstRowCells()).toEqual([
      persons[0]!.last_name,
      persons[0]!.first_name,
      persons[0]!.job_title,
    ]);

    await userEvent.click(moveButton('Job title', 'left'));
    await expect.poll(tableHeaders).toEqual(['Last name', 'Job title', 'First name']);
  });

  test('moving skips over hidden columns in the menu order', async () => {
    await renderPersons({ defaultHiddenColumns: new Set(['last_name']) });
    await openColumnSelection();

    await userEvent.click(moveButton('Job title', 'left'));
    await expect.poll(tableHeaders).toEqual(['First name', 'Job title']);
    await userEvent.click(moveButton('Job title', 'left'));
    await expect.poll(tableHeaders).toEqual(['Job title', 'First name']);
  });

  test('dragging a header drops it at the target and does not sort', async () => {
    const onSortChange = vi.fn();
    await renderPersons({ onSortChange });
    await expect.poll(tableHeaders).toEqual(headers);

    // The label sits in the left half of its header, so this lands in front of it.
    await userEvent.dragAndDrop(page.getByText('First name'), page.getByText('Job title'));
    await expect.poll(tableHeaders).toEqual(['Last name', 'First name', 'Job title']);
    expect(onSortChange).not.toHaveBeenCalled();

    // A click right after the drop sorts again.
    await page.getByText('Last name').click();
    expect(onSortChange).toHaveBeenCalledTimes(1);
  });

  test('dragging left drops before the target', async () => {
    await renderPersons();
    const x = dragOver('Job title', 'First name');
    expect(indicators()).toHaveLength(1);
    pointer(window, 'pointerup', x);
    await expect.poll(tableHeaders).toEqual(['Job title', 'First name', 'Last name']);
    expect(indicators()).toHaveLength(0);
  });

  test('a click without moving still sorts', async () => {
    const onSortChange = vi.fn();
    await renderPersons({ onSortChange });
    await page.getByText('Last name').click();
    expect(onSortChange).toHaveBeenCalledWith([{ columnId: 'last_name', direction: 'asc' }]);
    expect(tableHeaders()).toEqual(headers);
  });

  test.each([
    ['Escape', () => userEvent.keyboard('{Escape}')],
    ['pointercancel', async () => pointer(window, 'pointercancel', 0)],
    ['blur', async () => window.dispatchEvent(new Event('blur'))],
  ])('%s cancels a drag and leaves nothing behind', async (_name, cancel) => {
    const onColumnOrderChange = vi.fn();
    await renderPersons({ onColumnOrderChange });
    const dragged = header('First name');
    const x = dragOver('First name', 'Job title');
    expect(dragged.style.transform).not.toBe('');
    expect(document.body.style.userSelect).toBe('none');

    await cancel();
    pointer(window, 'pointerup', x);

    expect(dragged.style.cssText).toBe('');
    expect(document.body.style.cursor).toBe('');
    expect(document.body.style.userSelect).toBe('');
    expect(indicators()).toHaveLength(0);
    expect(onColumnOrderChange).not.toHaveBeenCalled();
    expect(tableHeaders()).toEqual(headers);
  });

  test('unmounting mid-drag cleans up', async () => {
    const screen = await renderPersons();
    dragOver('First name', 'Job title');
    expect(document.body.style.cursor).toBe('grabbing');

    await screen.unmount();
    expect(document.body.style.cursor).toBe('');
    expect(document.body.style.userSelect).toBe('');
  });

  test('defaultColumnOrder places missing columns after their predecessor', async () => {
    await renderPersons({ defaultColumnOrder: ['job_title', 'first_name'] });
    await expect.poll(tableHeaders).toEqual(['Job title', 'First name', 'Last name']);
  });

  test('controlled columnOrder only changes through props', async () => {
    const onColumnOrderChange = vi.fn<(order: Id[]) => void>();
    const columnOrder = ['job_title', 'first_name', 'last_name'];
    const screen = await renderPersons({ columnOrder, onColumnOrderChange });
    await expect.poll(tableHeaders).toEqual(['Job title', 'First name', 'Last name']);
    await openColumnSelection();

    await userEvent.click(moveButton('Job title', 'right'));
    expect(onColumnOrderChange).toHaveBeenLastCalledWith(['first_name', 'job_title', 'last_name']);
    expect(tableHeaders()).toEqual(['Job title', 'First name', 'Last name']);

    await screen.rerender(
      <PersonTable
        columnOrder={['first_name', 'job_title', 'last_name']}
        onColumnOrderChange={onColumnOrderChange}
      />,
    );
    await expect.poll(tableHeaders).toEqual(['First name', 'Job title', 'Last name']);
  });

  test('resetting the table restores the column order', async () => {
    await renderPersons({ defaultColumnOrder: ['last_name', 'first_name'] });
    await expect.poll(tableHeaders).toEqual(['Last name', 'Job title', 'First name']);
    await openColumnSelection();
    await userEvent.click(moveButton('Job title', 'left'));
    await expect.poll(tableHeaders).toEqual(['Job title', 'Last name', 'First name']);

    await page.getByRole('button', { name: 'Reset table state' }).click();
    await expect.poll(tableHeaders).toEqual(['Last name', 'Job title', 'First name']);
  });

  test('enableColumnReorder={false} disables arrows and dragging', async () => {
    await renderPersons({ enableColumnReorder: false });
    dragOver('First name', 'Job title');
    expect(indicators()).toHaveLength(0);
    expect(header('First name').style.transform).toBe('');
    pointer(window, 'pointerup', 0);

    await openColumnSelection();
    expect(document.querySelector('button[aria-label^="Move column"]')).toBeNull();
  });
});
