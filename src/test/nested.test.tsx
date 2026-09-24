import { describe, expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser/context';
import { render } from 'vitest-browser-react';
import { Table, textFilter } from '..';
import type { Id, TableProps } from '../types';
import { persons, type Person } from './fixtures';

type NestedPerson = Person & { parentId?: number };

// Two trees: Kassia > Dulcia > Chelsey and Thoma > Maurene > Julian
const parents: Record<number, number | undefined> = { 2: 1, 3: 2, 5: 4, 6: 5 };
const items: NestedPerson[] = persons.slice(0, 6).map((p) => ({ ...p, parentId: parents[p.id] }));
const names = items.map((p) => p.first_name);

function NestedTable(props: Partial<TableProps<NestedPerson>>) {
  return (
    <Table<NestedPerson>
      items={items}
      id="id"
      parentId="parentId"
      enableSelection={false}
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

function renderNested(props: Partial<TableProps<NestedPerson>> = {}) {
  return render(<NestedTable {...props} />);
}

function shownNames() {
  return [...document.querySelectorAll<HTMLElement>('[title]')]
    .map((el) => el.title)
    .filter((title) => names.includes(title));
}

function expandButton(name: string) {
  const cell = page.getByText(name, { exact: true }).element().parentElement;
  const firstCell = cell?.parentElement?.children[1];
  const button = firstCell?.querySelector('button');
  if (!button) throw new Error(`no expand button for ${name}`);
  return page.elementLocator(button);
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

describe('nested items', () => {
  test('only roots are shown initially', async () => {
    await renderNested();
    await expect.poll(shownNames).toEqual(['Kassia', 'Thoma']);
  });

  test('expanding shows children, collapsing hides them including grandchildren', async () => {
    await renderNested();
    await expect.poll(shownNames).toEqual(['Kassia', 'Thoma']);

    await expandButton('Kassia').click();
    await expect.poll(shownNames).toEqual(['Kassia', 'Dulcia', 'Thoma']);

    await expandButton('Dulcia').click();
    await expect.poll(shownNames).toEqual(['Kassia', 'Dulcia', 'Chelsey', 'Thoma']);

    await expandButton('Kassia').click();
    await expect.poll(shownNames).toEqual(['Kassia', 'Thoma']);

    // Collapsing a parent also collapses its descendants
    await expandButton('Kassia').click();
    await expect.poll(shownNames).toEqual(['Kassia', 'Dulcia', 'Thoma']);
  });

  test('expandOnlyOne collapses the other branch but keeps ancestors expanded', async () => {
    await renderNested({ expandOnlyOne: true });

    await expandButton('Kassia').click();
    await expandButton('Dulcia').click();
    await expect.poll(shownNames).toEqual(['Kassia', 'Dulcia', 'Chelsey', 'Thoma']);

    await expandButton('Thoma').click();
    await expect.poll(shownNames).toEqual(['Kassia', 'Thoma', 'Maurene']);
  });

  test('defaultExpanded expands the given rows and their ancestors', async () => {
    await renderNested({ defaultExpanded: new Set([2]) });
    await expect.poll(shownNames).toEqual(['Kassia', 'Dulcia', 'Chelsey', 'Thoma']);
  });

  test('controlled expanded only changes through props', async () => {
    const onExpandedChange = vi.fn<(expanded: Set<Id>) => void>();
    const screen = await renderNested({ expanded: new Set([1]), onExpandedChange });
    await expect.poll(shownNames).toEqual(['Kassia', 'Dulcia', 'Thoma']);

    await expandButton('Thoma').click();
    expect(onExpandedChange).toHaveBeenLastCalledWith(new Set([1, 4]));
    await expect.poll(shownNames).toEqual(['Kassia', 'Dulcia', 'Thoma']);

    await screen.rerender(
      <NestedTable expanded={new Set([1, 4])} onExpandedChange={onExpandedChange} />,
    );
    await expect.poll(shownNames).toEqual(['Kassia', 'Dulcia', 'Thoma', 'Maurene']);
  });

  test('filtering a descendant keeps its ancestors visible', async () => {
    await renderNested();
    await filterFirstName('Chelsey');
    await expect.poll(shownNames).toEqual(['Kassia']);

    await expandButton('Kassia').click();
    await expect.poll(shownNames).toEqual(['Kassia', 'Dulcia']);

    await expandButton('Dulcia').click();
    await expect.poll(shownNames).toEqual(['Kassia', 'Dulcia', 'Chelsey']);
  });

  test('revealFiltered expands ancestors of matching descendants', async () => {
    await renderNested({ revealFiltered: true });
    await filterFirstName('Chelsey');
    await expect.poll(shownNames).toEqual(['Kassia', 'Dulcia', 'Chelsey']);
  });
});
