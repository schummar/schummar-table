import { afterEach, beforeEach, describe, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser/context';
import { createRoot } from 'react-dom/client';
import { render } from 'vitest-browser-react';
import { Table, textFilter } from '..';
import type { TableProps } from '../types';
import { persons, type Person } from './fixtures';

const items = persons.slice(0, 5);
const names = items.map((p) => p.first_name);
const unsorted = ['Kassia', 'Dulcia', 'Chelsey', 'Thoma', 'Maurene'];
const storageKey = (id: string) => `schummar-table_state-v1_${id}`;

// Unique per test: a throttled save from the previous test can still land after it ended.
let persistId = '';
let testCount = 0;

function PersonTable(props: Partial<TableProps<Person>>) {
  return (
    <Table<Person>
      items={items}
      id="id"
      enableSelection={false}
      persist={{ storage: localStorage, id: persistId }}
      columns={(col) => [
        col((x) => x.first_name, {
          id: 'first_name',
          header: 'First name',
          filter: textFilter(),
        }),
        col((x) => x.last_name, { id: 'last_name', header: 'Last name' }),
      ]}
      {...props}
    />
  );
}

function renderPersons(props: Partial<TableProps<Person>> = {}) {
  return render(<PersonTable {...props} />);
}

function shownNames() {
  return [...document.querySelectorAll<HTMLElement>('[title]')]
    .map((el) => el.title)
    .filter((title) => names.includes(title));
}

function shownHeaders() {
  return [...document.querySelectorAll<HTMLElement>('div')]
    .filter((el) => el.children.length === 0)
    .map((el) => el.textContent)
    .filter((text) => text === 'First name' || text === 'Last name');
}

function stored(id = persistId) {
  const json = localStorage.getItem(storageKey(id));
  return json ? JSON.parse(json) : null;
}

// Saving is throttled to once per second.
const pollStored = (id?: string) => expect.poll(() => stored(id), { timeout: 3000 });

async function sortByFirstName() {
  await page.getByText('First name', { exact: true }).click();
  await expect.poll(shownNames).toEqual(['Chelsey', 'Dulcia', 'Kassia', 'Maurene', 'Thoma']);
}

async function filterFirstName(text: string) {
  const header = page.getByText('First name', { exact: true }).element()
    .parentElement?.parentElement;
  const filterButton = header?.querySelector('button');
  if (!filterButton) throw new Error('no filter button');
  await userEvent.click(filterButton);
  await userEvent.fill(page.getByRole('textbox'), text);
  await userEvent.keyboard('{Enter}');
}

async function openColumnSelection() {
  const button = document.querySelector('button:has(path[d^="M3 17v2h6"])');
  if (!button) throw new Error('no column selection button');
  await userEvent.click(button);
}

beforeEach(() => {
  persistId = `persist-test-${testCount++}`;
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('persist', () => {
  test('sort is saved and restored on a fresh mount', async () => {
    const screen = await renderPersons();
    await expect.poll(shownNames).toEqual(unsorted);
    await sortByFirstName();

    await pollStored().toMatchObject({ sort: [{ columnId: 'first_name', direction: 'asc' }] });

    await screen.unmount();
    await renderPersons();
    await expect.poll(shownNames).toEqual(['Chelsey', 'Dulcia', 'Kassia', 'Maurene', 'Thoma']);
  });

  test('hidden columns are saved and restored on a fresh mount', async () => {
    const screen = await renderPersons();
    await openColumnSelection();
    const popover = page.elementLocator(
      page.getByText('Select visible columns').element().parentElement!,
    );
    await popover.getByText('Last name', { exact: true }).click();
    await expect.poll(shownHeaders).toEqual(['First name']);

    await pollStored().toMatchObject({ hiddenColumns: { __set: ['last_name'] } });

    await screen.unmount();
    await renderPersons();
    await expect.element(page.getByText('Kassia')).toBeVisible();
    await expect.poll(shownHeaders).toEqual(['First name']);
    await expect.element(page.getByText('Nears')).not.toBeInTheDocument();
  });

  test('filter values are saved and restored on a fresh mount', async () => {
    const screen = await renderPersons();
    await filterFirstName('el');
    await expect.poll(shownNames).toEqual(['Chelsey']);

    await pollStored().toMatchObject({ filterValues: { __map: [['first_name', 'el']] } });

    await screen.unmount();
    await renderPersons();
    await expect.poll(shownNames).toEqual(['Chelsey']);
  });

  // render() wraps the mount in act(), which settles everything before the stored state loads.
  test('filter values are restored on a mount outside act', async () => {
    localStorage.setItem(
      storageKey(persistId),
      JSON.stringify({ filterValues: { __map: [['first_name', 'el']] } }),
    );
    const actEnvironment = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
    const previous = actEnvironment.IS_REACT_ACT_ENVIRONMENT;
    actEnvironment.IS_REACT_ACT_ENVIRONMENT = false;

    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    try {
      root.render(<PersonTable />);
      await expect.poll(shownNames).toEqual(['Chelsey']);
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(stored()).toMatchObject({ filterValues: { __map: [['first_name', 'el']] } });
    } finally {
      root.unmount();
      container.remove();
      actEnvironment.IS_REACT_ACT_ENVIRONMENT = previous;
    }
  });

  test('a restored cleared filter does not fall back to its default value', async () => {
    localStorage.setItem(
      storageKey(persistId),
      JSON.stringify({ filterValues: { __map: [['first_name', null]] } }),
    );
    await renderPersons({
      columns: (col) => [
        col((x) => x.first_name, {
          id: 'first_name',
          header: 'First name',
          filter: textFilter({ defaultValue: 'el' }),
        }),
      ],
    });
    await expect.poll(shownNames).toEqual(unsorted);
  });

  test.each([
    ['excluded', { exclude: [{ filterValues: ['first_name'] }] }],
    ['not included', { include: [{ filterValues: ['last_name'] }] }],
  ] as const)('%s filter values are neither saved nor restored', async (_name, options) => {
    localStorage.setItem(
      storageKey(persistId),
      JSON.stringify({ filterValues: { __map: [['first_name', 'el']] } }),
    );
    await renderPersons({
      persist: { storage: localStorage, id: persistId, ...options },
      columns: (col) => [
        col((x) => x.first_name, { id: 'first_name', header: 'First name', filter: textFilter() }),
        col((x) => x.last_name, { id: 'last_name', header: 'Last name', filter: textFilter() }),
      ],
    });
    await expect.poll(shownNames).toEqual(unsorted);

    await filterFirstName('a');
    await expect.poll(shownNames).toEqual(['Kassia', 'Dulcia', 'Thoma', 'Maurene']);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(stored()?.filterValues?.__map ?? []).not.toContainEqual(['first_name', 'a']);
  });

  test('included filter values are saved', async () => {
    await renderPersons({
      persist: {
        storage: localStorage,
        id: persistId,
        include: [{ filterValues: ['first_name'] }],
      },
    });
    await sortByFirstName();
    await filterFirstName('a');
    await pollStored().toEqual({ filterValues: { __map: [['first_name', 'a']] } });
  });

  test('a different persist id does not restore the state', async () => {
    const screen = await renderPersons();
    await sortByFirstName();
    await pollStored().toMatchObject({ sort: [{ columnId: 'first_name' }] });

    await screen.unmount();
    await renderPersons({ persist: { storage: localStorage, id: `${persistId}-other` } });
    await expect.element(page.getByText('Kassia')).toBeVisible();
    await expect.poll(shownNames).toEqual(unsorted);
  });

  test('excluded keys are neither saved nor restored', async () => {
    const persist = { storage: localStorage, id: persistId, exclude: ['sort' as const] };
    const screen = await renderPersons({ persist });
    await sortByFirstName();
    await filterFirstName('a');
    await expect.poll(shownNames).toEqual(['Dulcia', 'Kassia', 'Maurene', 'Thoma']);

    await pollStored().toMatchObject({ filterValues: { __map: [['first_name', 'a']] } });
    expect(stored()).not.toHaveProperty('sort');

    await screen.unmount();
    await renderPersons({ persist });
    await expect.poll(shownNames).toEqual(['Kassia', 'Dulcia', 'Thoma', 'Maurene']);
  });

  test('controlled state is not saved', async () => {
    await renderPersons({ sort: [{ columnId: 'last_name', direction: 'asc' }] });
    await filterFirstName('a');
    await pollStored().toMatchObject({ filterValues: { __map: [['first_name', 'a']] } });
    expect(stored()).not.toHaveProperty('sort');
  });

  test('"reset table state" clears the saved state', async () => {
    const screen = await renderPersons();
    await sortByFirstName();
    await pollStored().toMatchObject({ sort: [{ columnId: 'first_name' }] });

    await openColumnSelection();
    await page.getByRole('button', { name: 'Reset table state' }).click();
    await expect.poll(shownNames).toEqual(unsorted);

    await screen.unmount();
    await renderPersons();
    await expect.element(page.getByText('Kassia')).toBeVisible();
    await expect.poll(shownNames).toEqual(unsorted);
  });
});
