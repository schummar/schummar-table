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

// Header cells are the only elements whose direct text is a column header outside the popover.
function tableHeaders() {
  const popover = popoverElement();
  return [...document.querySelectorAll<HTMLElement>('div')]
    .filter((el) => !popover?.contains(el))
    .filter((el) => el.children.length === 0 && headers.includes(el.textContent ?? ''))
    .map((el) => el.textContent);
}

function popoverElement() {
  return page.getByText('Select visible columns').query()?.parentElement ?? null;
}

function popover() {
  const el = popoverElement();
  if (!el) throw new Error('column selection popover is not open');
  return page.elementLocator(el);
}

function popoverColumns() {
  return [...(popoverElement()?.querySelectorAll('label > span') ?? [])].map(
    (el) => el.textContent,
  );
}

function columnCheckbox(header: string) {
  const input = popover()
    .getByText(header, { exact: true })
    .element()
    .closest('label')
    ?.querySelector('input');
  if (!input) throw new Error(`no checkbox for ${header}`);
  return input;
}

async function openColumnSelection() {
  const button = document.querySelector('button:has(path[d^="M3 17v2h6"])');
  if (!button) throw new Error('no column selection button');
  await userEvent.click(button);
  await expect.element(page.getByText('Select visible columns')).toBeVisible();
}

describe('column selection', () => {
  test('lists all columns, all checked', async () => {
    await renderPersons();
    await openColumnSelection();

    expect(popoverColumns()).toEqual(headers);
    for (const header of headers) {
      expect(columnCheckbox(header).checked).toBe(true);
    }
  });

  test('unchecking a column hides it, checking shows it again', async () => {
    await renderPersons();
    await openColumnSelection();

    await popover().getByText('Last name', { exact: true }).click();
    await expect.poll(tableHeaders).toEqual(['First name', 'Job title']);
    expect(columnCheckbox('Last name').checked).toBe(false);
    await expect.element(page.getByText('Nears')).not.toBeInTheDocument();

    await popover().getByText('Last name', { exact: true }).click();
    await expect.poll(tableHeaders).toEqual(headers);
    await expect.element(page.getByText('Nears')).toBeVisible();
  });

  test('hide all and show all', async () => {
    await renderPersons();
    await openColumnSelection();

    await popover().getByRole('button', { name: 'Hide all' }).click();
    await expect.poll(tableHeaders).toEqual([]);
    for (const header of headers) {
      expect(columnCheckbox(header).checked).toBe(false);
    }

    await popover().getByRole('button', { name: 'Show all' }).click();
    await expect.poll(tableHeaders).toEqual(headers);
  });

  test('shows "show all" while any column is hidden', async () => {
    await renderPersons({ defaultHiddenColumns: new Set(['job_title']) });
    await expect.poll(tableHeaders).toEqual(['First name', 'Last name']);
    await openColumnSelection();

    await popover().getByRole('button', { name: 'Show all' }).click();
    await expect.poll(tableHeaders).toEqual(headers);
    await expect.element(popover().getByRole('button', { name: 'Hide all' })).toBeVisible();
  });

  test('columns with a fixed hidden prop cannot be toggled', async () => {
    await renderPersons({
      columns: (col) => [
        col((x) => x.first_name, { id: 'first_name', header: 'First name', hidden: false }),
        col((x) => x.last_name, { id: 'last_name', header: 'Last name', hidden: true }),
        col((x) => x.job_title, { id: 'job_title', header: 'Job title' }),
      ],
    });
    await expect.poll(tableHeaders).toEqual(['First name', 'Job title']);
    await openColumnSelection();

    expect(columnCheckbox('First name').disabled).toBe(true);
    expect(columnCheckbox('Last name').disabled).toBe(true);
    expect(columnCheckbox('Last name').checked).toBe(false);
    expect(columnCheckbox('Job title').disabled).toBe(false);
  });

  test('controlled hiddenColumns only changes through props', async () => {
    const onHiddenColumnsChange = vi.fn<(hidden: Set<Id>) => void>();
    const screen = await renderPersons({
      hiddenColumns: new Set(['job_title']),
      onHiddenColumnsChange,
    });
    await expect.poll(tableHeaders).toEqual(['First name', 'Last name']);
    await openColumnSelection();

    await popover().getByText('First name', { exact: true }).click();
    expect(onHiddenColumnsChange).toHaveBeenLastCalledWith(new Set(['job_title', 'first_name']));
    await expect.poll(tableHeaders).toEqual(['First name', 'Last name']);

    await screen.rerender(
      <PersonTable
        hiddenColumns={new Set(['job_title', 'first_name'])}
        onHiddenColumnsChange={onHiddenColumnsChange}
      />,
    );
    await expect.poll(tableHeaders).toEqual(['Last name']);
    expect(columnCheckbox('First name').checked).toBe(false);
  });

  test('onHiddenColumnsChange is called for uncontrolled tables', async () => {
    const onHiddenColumnsChange = vi.fn<(hidden: Set<Id>) => void>();
    await renderPersons({ onHiddenColumnsChange });
    await openColumnSelection();

    await popover().getByText('Job title', { exact: true }).click();
    expect(onHiddenColumnsChange).toHaveBeenLastCalledWith(new Set(['job_title']));
    await expect.poll(tableHeaders).toEqual(['First name', 'Last name']);
  });

  test('popover order follows the column order after reordering', async () => {
    await renderPersons();
    await expect.poll(tableHeaders).toEqual(headers);

    const header = (text: string) =>
      page.getByText(text, { exact: true }).element().parentElement!.parentElement!;
    await userEvent.dragAndDrop(
      page.elementLocator(header('First name')),
      page.elementLocator(header('Job title')),
      // Headers only react to moves while pressed, so the pointer has to travel gradually.
      { steps: 20 },
    );
    await expect.poll(tableHeaders).toEqual(['Last name', 'Job title', 'First name']);

    await openColumnSelection();
    expect(popoverColumns()).toEqual(['Last name', 'Job title', 'First name']);
  });
});
