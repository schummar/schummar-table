import { describe, expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-react';
import { Table } from '..';
import type { TableProps } from '../types';
import { persons, renderTable, type Person } from './fixtures';

const icons = {
  Settings: () => <span data-testid="icon-settings" />,
  Export: () => <span data-testid="icon-export" />,
};

const nameColumns: TableProps<Person>['columns'] = (col) => [
  col((x) => x.first_name, { id: 'first', header: 'First name' }),
  col((x) => x.last_name, { id: 'last', header: 'Last name' }),
];

function rows(className: string) {
  return document.querySelectorAll(`.${className}`);
}

describe('columns', () => {
  test('renders headers and cell values from a column factory', async () => {
    const screen = await renderTable({
      items: persons.slice(0, 3),
      id: 'id',
      columns: nameColumns,
    });

    await expect.element(screen.getByText('First name')).toBeVisible();
    await expect.element(screen.getByText('Last name')).toBeVisible();
    for (const person of persons.slice(0, 3)) {
      await expect.element(screen.getByText(person.first_name)).toBeVisible();
      await expect.element(screen.getByText(person.last_name)).toBeVisible();
    }
    await expect.element(screen.getByText(persons[3]!.first_name)).not.toBeInTheDocument();
  });

  test('renders headers and cell values from a plain column array', async () => {
    const screen = await renderTable<Person>({
      items: persons.slice(0, 3),
      id: 'id',
      columns: [
        { value: (x) => x.job_title, header: 'Job' },
        { value: (x) => x.id, header: 'Id' },
      ],
    });

    await expect.element(screen.getByText('Job')).toBeVisible();
    await expect.element(screen.getByText('Id', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Occupational Therapist')).toBeVisible();
    await expect.element(screen.getByText('Recruiting Manager')).toBeVisible();
    await expect.element(screen.getByText('2', { exact: true })).toBeVisible();
  });

  test('renderCell output is rendered in the cell', async () => {
    const screen = await renderTable({
      items: persons.slice(0, 2),
      id: 'id',
      columns: (col) => [
        col((x) => x.first_name, {
          header: 'Name',
          renderCell: (value, item) => (
            <strong data-testid={`cell-${item.id}`}>{value.toUpperCase()}</strong>
          ),
        }),
      ],
    });

    await expect.element(screen.getByTestId('cell-1')).toHaveTextContent('KASSIA');
    await expect.element(screen.getByTestId('cell-2')).toHaveTextContent('DULCIA');
    await expect.element(screen.getByText('Kassia')).not.toBeInTheDocument();
  });

  test('ignores falsy entries returned by a column factory', async () => {
    const screen = await renderTable<Person>({
      items: persons.slice(0, 3),
      id: 'id',
      enableSelection: false,
      classes: { headerCell: 'header' },
      columns: (col) => [col(() => 'x', { header: 'X' }), null, undefined, false, '', 0],
    });

    await expect.element(screen.getByText('X', { exact: true })).toBeVisible();
    expect(screen.getByText('x', { exact: true }).all()).toHaveLength(3);
    // Fill + control cell + one column + fill.
    expect(rows('header')).toHaveLength(4);
  });

  test('ignores falsy entries in a column array', async () => {
    const screen = await renderTable<Person>({
      items: persons.slice(0, 3),
      id: 'id',
      enableSelection: false,
      classes: { headerCell: 'header' },
      columns: [{ value: () => 'x', header: 'X' }, null, undefined, false, '', 0],
    });

    await expect.element(screen.getByText('X', { exact: true })).toBeVisible();
    expect(screen.getByText('x', { exact: true }).all()).toHaveLength(3);
    expect(rows('header')).toHaveLength(4);
  });

  test('a column with hidden: true is not rendered', async () => {
    const screen = await renderTable({
      items: persons.slice(0, 2),
      id: 'id',
      columns: (col) => [
        col((x) => x.first_name, { header: 'First name' }),
        col((x) => x.last_name, { header: 'Last name', hidden: true }),
      ],
    });

    await expect.element(screen.getByText('First name')).toBeVisible();
    await expect.element(screen.getByText('Kassia')).toBeVisible();
    await expect.element(screen.getByText('Last name')).not.toBeInTheDocument();
    await expect.element(screen.getByText('Nears')).not.toBeInTheDocument();
  });

  test('defaultHiddenColumns hides a column', async () => {
    const screen = await renderTable({
      items: persons.slice(0, 2),
      id: 'id',
      columns: nameColumns,
      defaultHiddenColumns: new Set(['first']),
    });

    await expect.element(screen.getByText('Last name')).toBeVisible();
    await expect.element(screen.getByText('Nears')).toBeVisible();
    await expect.element(screen.getByText('First name')).not.toBeInTheDocument();
    await expect.element(screen.getByText('Kassia')).not.toBeInTheDocument();
  });
});

describe('rows', () => {
  test('empty items renders headers but no rows', async () => {
    const screen = await renderTable<Person>({
      items: [],
      id: 'id',
      columns: nameColumns,
      classes: { row: 'row' },
    });

    await expect.element(screen.getByText('First name')).toBeVisible();
    expect(rows('row')).toHaveLength(0);
  });

  test('rowDetails are shown per row when the row is expanded', async () => {
    const screen = await renderTable({
      items: persons.slice(0, 3),
      id: 'id',
      enableSelection: false,
      enableColumnSelection: false,
      columns: nameColumns,
      rowDetails: (item) => <div>Details for {item.first_name}</div>,
    });

    await expect.element(screen.getByText('Details for', { exact: false })).not.toBeInTheDocument();
    expect(screen.getByRole('button').all()).toHaveLength(3);

    await screen.getByRole('button').nth(1).click();
    await expect.element(screen.getByText('Details for Dulcia')).toBeVisible();
    await expect.element(screen.getByText('Details for Kassia')).not.toBeInTheDocument();

    await screen.getByRole('button').nth(0).click();
    await expect.element(screen.getByText('Details for Kassia')).toBeVisible();
    await expect.element(screen.getByText('Details for Dulcia')).toBeVisible();
  });

  test('rowDetails with defaultExpanded are rendered immediately', async () => {
    const screen = await renderTable({
      items: persons.slice(0, 3),
      id: 'id',
      columns: nameColumns,
      defaultExpanded: new Set([3]),
      rowDetails: (item) => <div>Details for {item.first_name}</div>,
    });

    await expect.element(screen.getByText('Details for Chelsey')).toBeVisible();
    expect(screen.getByText('Details for', { exact: false }).all()).toHaveLength(1);
  });

  test('items updated via rerender update the rows', async () => {
    const props: TableProps<Person> = {
      id: 'id',
      columns: nameColumns,
      classes: { row: 'row' },
    };
    const screen = await render(<Table {...props} items={persons.slice(0, 2)} />);

    await expect.element(screen.getByText('Kassia')).toBeVisible();
    expect(rows('row')).toHaveLength(2);

    await screen.rerender(<Table {...props} items={persons.slice(1, 5)} />);
    await expect.element(screen.getByText('Maurene')).toBeVisible();
    await expect.element(screen.getByText('Kassia')).not.toBeInTheDocument();
    expect(rows('row')).toHaveLength(4);

    await screen.rerender(<Table {...props} items={[{ ...persons[1]!, first_name: 'Renamed' }]} />);
    await expect.element(screen.getByText('Renamed')).toBeVisible();
    await expect.element(screen.getByText('Dulcia')).not.toBeInTheDocument();
    expect(rows('row')).toHaveLength(1);
  });
});

describe('styling', () => {
  test('classes.row as a function applies a class per row', async () => {
    const seen: [number, number][] = [];
    await renderTable({
      items: persons.slice(0, 4),
      id: 'id',
      columns: nameColumns,
      classes: {
        row: (item, index) => {
          seen.push([item.id, index]);
          return index % 2 === 0 ? `row-even row-${item.id}` : `row-odd row-${item.id}`;
        },
      },
    });

    await expect.poll(() => rows('row-even').length).toBe(2);
    expect(rows('row-odd')).toHaveLength(2);
    expect(document.querySelector('.row-1')).toHaveTextContent('KassiaNears');
    expect(document.querySelector('.row-2')).toHaveClass('row-odd');
    expect(document.querySelector('.row-3')).toHaveClass('row-even');
    expect(seen).toContainEqual([4, 3]);
  });

  test('classes and styles are applied to table, header cells and cells', async () => {
    const screen = await renderTable({
      items: persons.slice(0, 2),
      id: 'id',
      columns: nameColumns,
      classes: { table: 'my-table', headerCell: 'my-header', cell: 'my-cell' },
      styles: {
        table: { outline: '3px solid rgb(255, 0, 0)' },
        headerCell: { color: 'rgb(0, 128, 0)' },
        cell: { backgroundColor: 'rgb(0, 0, 255)' },
      },
    });

    await expect.element(screen.getByText('Kassia')).toBeVisible();

    const table = document.querySelector('.my-table')!;
    expect(table).toBeTruthy();
    expect(getComputedStyle(table).outlineColor).toBe('rgb(255, 0, 0)');
    expect(getComputedStyle(table).outlineWidth).toBe('3px');

    const header = screen.getByText('First name').element().closest('.my-header')!;
    expect(header).toBeTruthy();
    expect(getComputedStyle(header).color).toBe('rgb(0, 128, 0)');

    const cell = screen.getByText('Kassia').element().closest('.my-cell')!;
    expect(cell).toBeTruthy();
    expect(getComputedStyle(cell).backgroundColor).toBe('rgb(0, 0, 255)');
  });
});

describe('style precedence', () => {
  test('a plain CSS class overrides the built-in cell styles', async () => {
    const style = document.createElement('style');
    style.textContent = '.plain-cell { padding: 13px; }';
    document.head.append(style);

    try {
      const screen = await renderTable({
        items: persons.slice(0, 1),
        id: 'id',
        columns: nameColumns,
        classes: { cell: 'plain-cell' },
      });
      const cell = screen.getByText('Kassia').element().closest('.plain-cell')!;
      expect(getComputedStyle(cell).paddingLeft).toBe('13px');
    } finally {
      style.remove();
    }
  });
});

describe('controls', () => {
  test('selection, column selection and export controls are shown when enabled', async () => {
    const screen = await renderTable({
      items: persons.slice(0, 3),
      id: 'id',
      columns: nameColumns,
      enableExport: true,
      icons,
    });

    await expect.element(screen.getByText('Kassia')).toBeVisible();
    // One in the header plus one per row.
    expect(screen.getByRole('checkbox').all()).toHaveLength(4);
    await expect.element(screen.getByTestId('icon-settings')).toBeInTheDocument();
    await expect.element(screen.getByTestId('icon-export')).toBeInTheDocument();
  });

  test('enableSelection: false removes the checkboxes', async () => {
    const screen = await renderTable({
      items: persons.slice(0, 3),
      id: 'id',
      columns: nameColumns,
      enableSelection: false,
      icons,
    });

    await expect.element(screen.getByText('Kassia')).toBeVisible();
    expect(screen.getByRole('checkbox').all()).toHaveLength(0);
    await expect.element(screen.getByTestId('icon-settings')).toBeInTheDocument();
  });

  test('enableColumnSelection: false removes the column selection button', async () => {
    const screen = await renderTable({
      items: persons.slice(0, 3),
      id: 'id',
      columns: nameColumns,
      enableColumnSelection: false,
      icons,
    });

    await expect.element(screen.getByText('Kassia')).toBeVisible();
    await expect.element(screen.getByTestId('icon-settings')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox').all()).toHaveLength(4);
  });

  test('enableExport: false removes the export button', async () => {
    const screen = await renderTable({
      items: persons.slice(0, 3),
      id: 'id',
      columns: nameColumns,
      enableExport: false,
      icons,
    });

    await expect.element(screen.getByText('Kassia')).toBeVisible();
    await expect.element(screen.getByTestId('icon-export')).not.toBeInTheDocument();
    await expect.element(screen.getByTestId('icon-settings')).toBeInTheDocument();
  });
});
