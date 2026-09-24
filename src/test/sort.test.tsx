import { useState } from 'react';
import { describe, expect, test, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser/context';
import { render, type RenderResult } from 'vitest-browser-react';
import { Table } from '..';
import type { Sort, TableProps } from '../types';
import { persons, renderTable, type Person } from './fixtures';

type Fruit = { id: number; name: string };

const fruits: Fruit[] = [
  { id: 4, name: 'grape' },
  { id: 2, name: 'Apple' },
  { id: 6, name: 'pear' },
  { id: 1, name: 'apple' },
  { id: 5, name: 'Orange' },
  { id: 3, name: 'Banana' },
];

const cell = (testId: string) => (value: unknown) => (
  <span data-testid={testId}>{value instanceof Date ? value.toISOString() : String(value)}</span>
);

function columnValues(screen: RenderResult, testId: string) {
  return screen
    .getByTestId(testId)
    .elements()
    .map((element) => element.textContent);
}

function fruitTable(props: Partial<TableProps<Fruit>> = {}) {
  return renderTable<Fruit>({
    items: fruits,
    id: 'id',
    columns: (col) => [
      col((x) => x.name, { id: 'name', header: 'Name', renderCell: cell('name') }),
    ],
    ...props,
  });
}

const people = persons.slice(0, 8);

function personTable(props: Partial<TableProps<Person>> = {}) {
  return renderTable<Person>({
    items: people,
    id: 'id',
    columns: (col) => [
      col((x) => x.first_name, { id: 'first', header: 'First', renderCell: cell('first') }),
      col((x) => x.job_title, { id: 'job', header: 'Job', renderCell: cell('job') }),
    ],
    ...props,
  });
}

describe('sort', () => {
  test('unsorted by default: items keep their input order', async () => {
    const screen = await fruitTable();
    await expect
      .poll(() => columnValues(screen, 'name'))
      .toEqual(['grape', 'Apple', 'pear', 'apple', 'Orange', 'Banana']);
  });

  test('clicking a header sorts asc, then desc, then asc again', async () => {
    const screen = await fruitTable();
    const header = screen.getByText('Name');

    await header.click();
    await expect
      .poll(() => columnValues(screen, 'name'))
      .toEqual(['apple', 'Apple', 'Banana', 'grape', 'Orange', 'pear']);

    await header.click();
    await expect
      .poll(() => columnValues(screen, 'name'))
      .toEqual(['pear', 'Orange', 'grape', 'Banana', 'Apple', 'apple']);

    await header.click();
    await expect
      .poll(() => columnValues(screen, 'name'))
      .toEqual(['apple', 'Apple', 'Banana', 'grape', 'Orange', 'pear']);
  });

  test('right-clicking a sorted header removes its sort', async () => {
    const onSortChange = vi.fn();
    const screen = await fruitTable({
      defaultSort: [{ columnId: 'name', direction: 'asc' }],
      onSortChange,
    });

    await userEvent.click(screen.getByText('Name'), { button: 'right' });
    expect(onSortChange).toHaveBeenLastCalledWith([]);
    await expect
      .poll(() => columnValues(screen, 'name'))
      .toEqual(['grape', 'Apple', 'pear', 'apple', 'Orange', 'Banana']);
  });

  test('defaultSort is applied on first render (case-insensitive collation)', async () => {
    const screen = await fruitTable({ defaultSort: [{ columnId: 'name', direction: 'asc' }] });
    await expect
      .poll(() => columnValues(screen, 'name'))
      .toEqual(['apple', 'Apple', 'Banana', 'grape', 'Orange', 'pear']);
  });

  test('Sort.options are passed to the collator', async () => {
    const screen = await fruitTable({
      defaultSort: [{ columnId: 'name', direction: 'asc', options: { caseFirst: 'upper' } }],
    });
    await expect
      .poll(() => columnValues(screen, 'name'))
      .toEqual(['Apple', 'apple', 'Banana', 'grape', 'Orange', 'pear']);
  });

  test('numbers sort by value, not as strings', async () => {
    const screen = await renderTable({
      items: [10, 9, 100, 2, 21].map((n) => ({ id: n, n })),
      id: 'id',
      columns: (col) => [col((x) => x.n, { header: 'N', renderCell: cell('n') })],
    });

    await screen.getByText('N', { exact: true }).click();
    await expect.poll(() => columnValues(screen, 'n')).toEqual(['2', '9', '10', '21', '100']);
  });

  test('dates sort chronologically', async () => {
    const screen = await personTable({
      columns: (col) => [
        col((x) => new Date(x.birthday), { header: 'Birthday', renderCell: cell('birthday') }),
      ],
    });

    await screen.getByText('Birthday').click();
    const expected = people
      .map((p) => new Date(p.birthday))
      .sort((a, b) => a.getTime() - b.getTime())
      .map((d) => d.toISOString());
    await expect.poll(() => columnValues(screen, 'birthday')).toEqual(expected);
  });

  test('plain click replaces the sort, ctrl+click adds a secondary sort', async () => {
    const onSortChange = vi.fn();
    const screen = await personTable({ onSortChange });

    await screen.getByText('First').click();
    await screen.getByText('Job').click();
    expect(onSortChange).toHaveBeenLastCalledWith([{ columnId: 'job', direction: 'asc' }]);

    await userEvent.click(screen.getByText('First'), { modifiers: ['Control'] });
    expect(onSortChange).toHaveBeenLastCalledWith([
      { columnId: 'job', direction: 'asc' },
      { columnId: 'first', direction: 'asc' },
    ]);

    // Badges show the sort priority when more than one column is sorted.
    await expect.element(screen.getByText('1', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('2', { exact: true })).toBeInTheDocument();
  });

  test('a secondary sort breaks ties of a string primary sort', async () => {
    const screen = await personTable({
      defaultSort: [
        { columnId: 'job', direction: 'asc' },
        { columnId: 'first', direction: 'asc' },
      ],
    });

    const expected = [...people]
      .sort(
        (a, b) =>
          a.job_title.localeCompare(b.job_title) || a.first_name.localeCompare(b.first_name),
      )
      .map((p) => p.first_name);
    // Both Paralegals (Dulcia before Arne in input order) must be ordered by first name.
    await expect.poll(() => columnValues(screen, 'first'), { timeout: 200 }).toEqual(expected);
  });

  test('ctrl+click on an already sorted column flips it and moves it to the end', async () => {
    const onSortChange = vi.fn();
    const screen = await personTable({
      defaultSort: [
        { columnId: 'first', direction: 'asc' },
        { columnId: 'job', direction: 'asc' },
      ],
      onSortChange,
    });

    await userEvent.click(screen.getByText('First'), { modifiers: ['Control'] });
    expect(onSortChange).toHaveBeenLastCalledWith([
      { columnId: 'job', direction: 'asc' },
      { columnId: 'first', direction: 'desc' },
    ]);
  });

  // Table-level disableSort never applies: calcProps.ts:115 defaults each column's disableSort to
  // false, so `column.disableSort ?? props.disableSort` (sortComponent.tsx:19) never reaches it.
  test.fails('disableSort on the table: clicking a header does nothing', async () => {
    const onSortChange = vi.fn();
    const screen = await fruitTable({ disableSort: true, onSortChange });

    await screen.getByText('Name').click();
    await expect
      .poll(() => columnValues(screen, 'name'), { timeout: 200 })
      .toEqual(['grape', 'Apple', 'pear', 'apple', 'Orange', 'Banana']);
    expect(onSortChange).not.toHaveBeenCalled();
  });

  test('disableSort on a column: only that column ignores clicks', async () => {
    const onSortChange = vi.fn();
    const screen = await personTable({
      columns: (col) => [
        col((x) => x.first_name, {
          id: 'first',
          header: 'First',
          renderCell: cell('first'),
          disableSort: true,
        }),
        col((x) => x.job_title, { id: 'job', header: 'Job', renderCell: cell('job') }),
      ],
      onSortChange,
    });

    await screen.getByText('First').click();
    await userEvent.click(screen.getByText('First'), { button: 'right' });
    expect(onSortChange).not.toHaveBeenCalled();
    await expect.poll(() => columnValues(screen, 'first')).toEqual(people.map((p) => p.first_name));

    await screen.getByText('Job').click();
    expect(onSortChange).toHaveBeenCalledWith([{ columnId: 'job', direction: 'asc' }]);
  });

  test('controlled sort: order follows the prop, clicks only report changes', async () => {
    const onSortChange = vi.fn();
    const screen = await fruitTable({
      sort: [{ columnId: 'name', direction: 'desc' }],
      onSortChange,
    });

    await expect
      .poll(() => columnValues(screen, 'name'))
      .toEqual(['pear', 'Orange', 'grape', 'Banana', 'Apple', 'apple']);

    await screen.getByText('Name').click();
    expect(onSortChange).toHaveBeenCalledWith([{ columnId: 'name', direction: 'asc' }]);
    await expect
      .poll(() => columnValues(screen, 'name'), { timeout: 200 })
      .toEqual(['pear', 'Orange', 'grape', 'Banana', 'Apple', 'apple']);
  });

  test('controlled sort: updating the prop from onSortChange re-sorts', async () => {
    function Controlled() {
      const [sort, setSort] = useState<Sort[]>([]);
      return (
        <Table<Fruit>
          items={fruits}
          id="id"
          sort={sort}
          onSortChange={setSort}
          columns={(col) => [
            col((x) => x.name, { id: 'name', header: 'Name', renderCell: cell('name') }),
          ]}
        />
      );
    }
    const screen = await render(<Controlled />);

    await screen.getByText('Name').click();
    await expect
      .poll(() => columnValues(screen, 'name'))
      .toEqual(['apple', 'Apple', 'Banana', 'grape', 'Orange', 'pear']);

    await screen.getByText('Name').click();
    await expect
      .poll(() => columnValues(screen, 'name'))
      .toEqual(['pear', 'Orange', 'grape', 'Banana', 'Apple', 'apple']);
  });

  test('externalSort: item order is untouched, sort changes are still reported', async () => {
    const onSortChange = vi.fn();
    const screen = await fruitTable({
      externalSort: true,
      defaultSort: [{ columnId: 'name', direction: 'asc' }],
      onSortChange,
    });
    const inputOrder = fruits.map((f) => f.name);

    await expect.poll(() => columnValues(screen, 'name')).toEqual(inputOrder);

    await screen.getByText('Name').click();
    expect(onSortChange).toHaveBeenLastCalledWith([{ columnId: 'name', direction: 'desc' }]);
    await expect.poll(() => columnValues(screen, 'name'), { timeout: 200 }).toEqual(inputOrder);
  });

  test('sortBy: custom criteria, later entries break ties', async () => {
    const screen = await fruitTable({
      columns: (col) => [
        col((x) => x.name, {
          id: 'name',
          header: 'Name',
          renderCell: cell('name'),
          sortBy: [(name) => name.length, (_name, item) => -item.id],
        }),
      ],
      defaultSort: [{ columnId: 'name', direction: 'asc' }],
    });

    // Lengths: pear 4; Apple/apple/grape 5 (ids 2/1/4 -> by -id: grape, Apple, apple); 6: Orange/Banana (5/3).
    await expect
      .poll(() => columnValues(screen, 'name'))
      .toEqual(['pear', 'grape', 'Apple', 'apple', 'Orange', 'Banana']);
  });
});
