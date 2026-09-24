import { useState } from 'react';
import { describe, expect, test, vi } from 'vite-plus/test';
import { type Locator, page, userEvent } from 'vite-plus/test/browser/context';
import { render, type RenderResult } from 'vitest-browser-react';
import { Table, TextFilter, useTableActions } from '..';
import type { Id, TableProps } from '../types';
import { persons, renderTable, type Person } from './fixtures';

const people = persons.slice(0, 6);

function tableProps(props: Partial<TableProps<Person>> = {}): TableProps<Person> {
  return {
    items: people,
    id: 'id',
    columns: (col) => [col((x) => x.first_name, { id: 'first', header: 'First' })],
    ...props,
  };
}

// First checkbox is the header's select-all, the rest follow row order.
function checkboxes(screen: RenderResult) {
  const all = screen.getByRole('checkbox').all();
  return { header: all[0]!, rows: all.slice(1) };
}

// The themed checkbox hides its <input> (appearance: none, zero size); users click the label.
function toggle(checkbox: Locator, options?: Parameters<typeof userEvent.click>[1]) {
  const label = checkbox.element().closest('label')!;
  return userEvent.click(page.elementLocator(label), options);
}

async function expectChecked(screen: RenderResult, expected: boolean[]) {
  await expect
    .poll(() => checkboxes(screen).rows.map((row) => (row.element() as HTMLInputElement).checked))
    .toEqual(expected);
}

describe('selection', () => {
  test('clicking a row checkbox selects it and reports the selection', async () => {
    const onSelectionChange = vi.fn();
    const screen = await renderTable(tableProps({ onSelectionChange }));
    const { rows } = checkboxes(screen);

    await toggle(rows[1]!);
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set([2]));
    await expectChecked(screen, [false, true, false, false, false, false]);

    await toggle(rows[3]!);
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set([2, 4]));

    await toggle(rows[1]!);
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set([4]));
    await expectChecked(screen, [false, false, false, true, false, false]);
  });

  test('header checkbox selects all items and toggles them off again', async () => {
    const onSelectionChange = vi.fn();
    const screen = await renderTable(tableProps({ onSelectionChange }));
    const { header } = checkboxes(screen);

    await toggle(header);
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(people.map((p) => p.id)));
    await expectChecked(
      screen,
      people.map(() => true),
    );
    await expect.element(header).toBeChecked();

    await toggle(header);
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set());
    await expectChecked(
      screen,
      people.map(() => false),
    );
    await expect.element(header).not.toBeChecked();
  });

  test('header checkbox is checked only when every item is selected', async () => {
    const screen = await renderTable(tableProps({ defaultSelection: new Set([1, 2, 3, 4, 5]) }));
    const { header, rows } = checkboxes(screen);
    await expect.element(header).not.toBeChecked();

    await toggle(rows[5]!);
    await expect.element(header).toBeChecked();
  });

  test('select all only selects items that pass the filters', async () => {
    const onSelectionChange = vi.fn();
    const screen = await renderTable(
      tableProps({
        columns: (col) => [
          col((x) => x.first_name, { id: 'first', header: 'First' }),
          col((x) => x.job_title, {
            id: 'job',
            header: 'Job',
            filter: <TextFilter defaultValue="Paralegal" />,
          }),
        ],
        onSelectionChange,
      }),
    );
    await expect.poll(() => checkboxes(screen).rows.length).toBe(1);

    await toggle(checkboxes(screen).header);
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set([2]));
  });

  test('defaultSelection preselects items', async () => {
    const screen = await renderTable(tableProps({ defaultSelection: new Set<Id>([1, 3]) }));
    await expectChecked(screen, [true, false, true, false, false, false]);
  });

  test('controlled selection: checkboxes follow the prop, clicks only report', async () => {
    const onSelectionChange = vi.fn();
    const screen = await renderTable(
      tableProps({ selection: new Set<Id>([2]), onSelectionChange }),
    );
    await expectChecked(screen, [false, true, false, false, false, false]);

    await toggle(checkboxes(screen).rows[0]!);
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set([2, 1]));
    await expectChecked(screen, [false, true, false, false, false, false]);

    await screen.rerender(
      <Table {...tableProps({ selection: new Set<Id>([5]), onSelectionChange })} />,
    );
    await expectChecked(screen, [false, false, false, false, true, false]);
  });

  test('controlled selection: updating the prop from onSelectionChange works', async () => {
    function Controlled() {
      const [selection, setSelection] = useState(new Set<Id>());
      return <Table {...tableProps({ selection, onSelectionChange: setSelection })} />;
    }
    const screen = await render(<Controlled />);

    await toggle(checkboxes(screen).rows[2]!);
    await expectChecked(screen, [false, false, true, false, false, false]);

    await toggle(checkboxes(screen).header);
    await expectChecked(
      screen,
      people.map(() => true),
    );
  });

  test('enableSelection: false renders no checkboxes', async () => {
    const screen = await renderTable(tableProps({ enableSelection: false }));
    await expect.element(screen.getByText(people[0]!.first_name)).toBeVisible();
    expect(screen.getByRole('checkbox').elements()).toHaveLength(0);
  });

  test('shift-click selects the range since the last clicked row', async () => {
    const onSelectionChange = vi.fn();
    const screen = await renderTable(tableProps({ onSelectionChange }));

    await toggle(checkboxes(screen).rows[1]!);
    await toggle(checkboxes(screen).rows[4]!, { modifiers: ['Shift'] });
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set([2, 3, 4, 5]));
    await expectChecked(screen, [false, true, true, true, true, false]);
  });

  test('shift-click on a selected row deselects the range', async () => {
    const screen = await renderTable(
      tableProps({ defaultSelection: new Set<Id>(people.map((p) => p.id)) }),
    );

    await toggle(checkboxes(screen).rows[4]!);
    await toggle(checkboxes(screen).rows[1]!, { modifiers: ['Shift'] });
    await expectChecked(screen, [true, false, false, false, false, true]);
  });

  test('selection of items removed from items is cleaned up', async () => {
    const onSelectionChange = vi.fn();
    const screen = await renderTable(
      tableProps({ defaultSelection: new Set<Id>([1, 2, 3]), onSelectionChange }),
    );
    await expectChecked(screen, [true, true, true, false, false, false]);

    await screen.rerender(<Table {...tableProps({ items: people.slice(1), onSelectionChange })} />);
    await expect.poll(() => onSelectionChange.mock.lastCall).toEqual([new Set([2, 3])]);
    await expectChecked(screen, [true, true, false, false, false]);
  });

  test('selecting a parent selects its children (selectSyncChildren)', async () => {
    type Node = { id: number; parent?: number; name: string };
    const items: Node[] = [
      { id: 1, name: 'root' },
      { id: 2, parent: 1, name: 'child a' },
      { id: 3, parent: 1, name: 'child b' },
      { id: 4, name: 'other' },
    ];
    const onSelectionChange = vi.fn();
    const screen = await render(
      <Table<Node>
        items={items}
        id="id"
        parentId="parent"
        defaultExpanded={new Set([1])}
        onSelectionChange={onSelectionChange}
        columns={(col) => [col((x) => x.name, { header: 'Name' })]}
      />,
    );
    await expect.poll(() => checkboxes(screen).rows.length).toBe(4);

    await toggle(checkboxes(screen).rows[0]!);
    await expectChecked(screen, [true, true, true, false]);
    await expect.poll(() => onSelectionChange.mock.lastCall).toEqual([new Set([1, 2, 3])]);

    await toggle(checkboxes(screen).rows[0]!);
    await expectChecked(screen, [false, false, false, false]);
  });

  test('two actions in one event both apply', async () => {
    function SelectTwo() {
      const actions = useTableActions();
      return (
        <button
          onClick={() => {
            actions.toggleSelection(1);
            actions.toggleSelection(2);
          }}
        >
          select two
        </button>
      );
    }

    const onSelectionChange = vi.fn();
    const screen = await renderTable(
      tableProps({ onSelectionChange, rowAction: (item) => item.id === 3 && <SelectTwo /> }),
    );

    await screen.getByRole('button', { name: 'select two' }).click();
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set([1, 2]));
    await expectChecked(screen, [true, true, false, false, false, false]);
  });
});
