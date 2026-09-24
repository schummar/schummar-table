import { describe, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser/context';
import { render } from 'vitest-browser-react';
import { Table, TextFilter } from '..';
import CsvExporter from '../exporters/csvExporter';
import type { TableProps } from '../types';
import { persons, type Person } from './fixtures';

type NestedPerson = Person & { parentId?: number };

const items: NestedPerson[] = persons.slice(0, 4);

function PersonTable(props: Partial<TableProps<NestedPerson>>) {
  return (
    <Table<NestedPerson>
      items={items}
      id="id"
      enableExport
      columns={(col) => [
        col((x) => x.first_name, {
          id: 'first_name',
          header: 'First name',
          filter: <TextFilter />,
        }),
        col((x) => x.last_name, { id: 'last_name', header: 'Last name' }),
      ]}
      {...props}
    />
  );
}

function renderPersons(props: Partial<TableProps<NestedPerson>> = {}) {
  return render(<PersonTable {...props} />);
}

function rowCheckbox(name: string) {
  const cell = page.getByText(name, { exact: true }).element().parentElement;
  // The native input is visually hidden, so click its label.
  const label = cell?.parentElement?.children[1]?.querySelector('label:has(input)');
  if (!label) throw new Error(`no checkbox for ${name}`);
  return label;
}

async function copyToClipboard() {
  const button = document.querySelector('button:has(path[d^="M18,15v3"])');
  if (!button) throw new Error('no export button');
  await userEvent.click(button);
  // Clipboard access needs a focused document, which the click above provides.
  await navigator.clipboard.writeText('');
  await page.getByRole('button', { name: 'To clipboard (.csv)' }).click();
}

function clipboard() {
  return expect.poll(() => navigator.clipboard.readText());
}

function csv(...lines: string[][]) {
  return lines.map((line) => line.join('\t')).join('\n');
}

describe('export', () => {
  test('copies visible rows as tab separated csv with column ids as default headers', async () => {
    await renderPersons();
    await copyToClipboard();

    await clipboard().toBe(
      csv(
        ['first_name', 'last_name'],
        ['Kassia', 'Nears'],
        ['Dulcia', 'Grevel'],
        ['Chelsey', 'Skivington'],
        ['Thoma', 'Greenroyd'],
      ),
    );
  });

  test('exportHeader and exportCell customize the output', async () => {
    await renderPersons({
      columns: (col) => [
        col((x) => x.first_name, {
          id: 'first_name',
          header: 'First name',
          exportHeader: 'Given name',
          exportCell: (value) => value.toUpperCase(),
        }),
        col((x) => x.id, { id: 'id', header: 'Id', exportCell: (value) => value * 10 }),
      ],
    });
    await copyToClipboard();

    await clipboard().toBe(
      csv(
        ['Given name', 'id'],
        ['KASSIA', '10'],
        ['DULCIA', '20'],
        ['CHELSEY', '30'],
        ['THOMA', '40'],
      ),
    );
  });

  test('values containing separators or quotes are quoted', async () => {
    await renderPersons({
      items: [{ ...persons[0]!, first_name: 'Kas\tsia', last_name: 'Ne"ars' }],
    });
    await copyToClipboard();

    await clipboard().toBe(csv(['first_name', 'last_name'], ['"Kas\tsia"', '"Ne""ars"']));
  });

  // CsvExporter returns the raw Date when it needs no quoting, so it is joined via Date#toString.
  test.fails('dates are exported as ISO strings', async () => {
    await renderPersons({
      items: persons.slice(0, 1),
      columns: (col) => [col((x) => new Date(x.birthday), { id: 'birthday', header: 'Birthday' })],
    });
    await copyToClipboard();

    await clipboard().toBe(csv(['birthday'], ['1965-05-03T13:47:23.000Z']));
  });

  test('hidden columns are not exported', async () => {
    await renderPersons({ defaultHiddenColumns: new Set(['first_name']) });
    await copyToClipboard();

    await clipboard().toBe(
      csv(['last_name'], ['Nears'], ['Grevel'], ['Skivington'], ['Greenroyd']),
    );
  });

  test('only exports selected rows when there is a selection', async () => {
    await renderPersons();
    await userEvent.click(rowCheckbox('Dulcia'));
    await userEvent.click(rowCheckbox('Thoma'));
    await copyToClipboard();

    await clipboard().toBe(
      csv(['first_name', 'last_name'], ['Dulcia', 'Grevel'], ['Thoma', 'Greenroyd']),
    );
  });

  test('only exports rows matching the active filter', async () => {
    await renderPersons({ enableSelection: false });
    const header = page.getByText('First name', { exact: true }).element()
      .parentElement?.parentElement;
    await userEvent.click(header!.querySelector('button')!);
    await userEvent.fill(page.getByRole('textbox'), 'el');
    await userEvent.keyboard('{Enter}');
    await expect.element(page.getByText('Kassia')).not.toBeInTheDocument();
    await copyToClipboard();

    await clipboard().toBe(csv(['first_name', 'last_name'], ['Chelsey', 'Skivington']));
  });

  test('does not export collapsed children', async () => {
    await renderPersons({
      items: items.map((p) => ({ ...p, parentId: p.id === 2 ? 1 : undefined })),
      parentId: 'parentId',
    });
    await copyToClipboard();

    await clipboard().toBe(
      csv(
        ['first_name', 'last_name'],
        ['Kassia', 'Nears'],
        ['Chelsey', 'Skivington'],
        ['Thoma', 'Greenroyd'],
      ),
    );
  });

  test('with all: true, exports every item regardless of selection', async () => {
    await renderPersons({
      items: items.map((p) => ({ ...p, parentId: p.id === 2 ? 1 : undefined })),
      parentId: 'parentId',
      enableExport: { all: true, exporters: [{ action: 'copy', exporter: new CsvExporter() }] },
    });
    await userEvent.click(rowCheckbox('Thoma'));
    await copyToClipboard();

    await clipboard().toBe(
      csv(
        ['first_name', 'last_name'],
        ['Kassia', 'Nears'],
        ['Dulcia', 'Grevel'],
        ['Chelsey', 'Skivington'],
        ['Thoma', 'Greenroyd'],
      ),
    );
  });
});
