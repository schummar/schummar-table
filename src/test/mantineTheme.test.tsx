import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { MantineProvider } from '@mantine/core';
import type { ReactNode } from 'react';
import { expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser/context';
import { render } from 'vitest-browser-react';
import { DatePicker, endOfDay, Table } from '..';
import { MantineTableThemeProvider } from '../theme/mantineTheme';
import { persons } from './fixtures';

function Mantine({ children }: { children: ReactNode }) {
  return (
    <MantineProvider>
      <MantineTableThemeProvider>{children}</MantineTableThemeProvider>
    </MantineProvider>
  );
}

test('renders the table with mantine components', async () => {
  const screen = await render(
    <Mantine>
      <Table
        items={persons.slice(0, 3)}
        id="id"
        columns={(col) => [col((x) => x.first_name, { header: 'First name' })]}
      />
    </Mantine>,
  );

  await expect.element(screen.getByText('Kassia')).toBeVisible();
  expect(document.querySelectorAll('.mantine-Checkbox-root')).toHaveLength(4);
});

test('clicking the checkbox padding in a link-wrapped row selects without following the link', async () => {
  location.hash = '';
  const onSelectionChange = vi.fn();
  await render(
    <Mantine>
      <Table
        items={persons.slice(0, 3)}
        id="id"
        columns={(col) => [col((x) => x.first_name, { header: 'First name' })]}
        wrapRow={(props, item) => <a href={`#row${item.id}`} {...props} />}
        onSelectionChange={onSelectionChange}
      />
    </Mantine>,
  );

  const root = document.querySelector<HTMLElement>('a .mantine-Checkbox-root')!;
  await userEvent.click(page.elementLocator(root), { position: { x: 2, y: 2 } });
  expect(onSelectionChange).toHaveBeenLastCalledWith(new Set([persons[0]!.id]));
  expect(location.hash).toBe('');
});

test('the date picker selects a range with the mantine calendar', async () => {
  const onChange = vi.fn();
  const screen = await render(
    <Mantine>
      <DatePicker
        rangeSelect
        value={null}
        onChange={onChange}
        defaultDateInView={new Date(2024, 0, 1)}
      />
    </Mantine>,
  );

  await screen.getByRole('button', { name: '10 January 2024' }).click();
  expect(onChange).not.toHaveBeenCalled();

  await screen.getByRole('button', { name: '12 January 2024' }).click();
  expect(onChange).toHaveBeenCalledWith(
    { min: new Date(2024, 0, 10), max: endOfDay(new Date(2024, 0, 12)) },
    'calendar',
  );
});

test('the date picker clamps a single date and keeps the quick options', async () => {
  const onChange = vi.fn();
  const minDate = new Date(2024, 0, 10, 12);
  const screen = await render(
    <Mantine>
      <DatePicker
        value={null}
        onChange={onChange}
        minDate={minDate}
        defaultDateInView={new Date(2024, 0, 1)}
        quickOptions={[{ label: 'New year', value: new Date(2024, 0, 1) }]}
      />
    </Mantine>,
  );

  await expect.element(screen.getByRole('button', { name: '9 January 2024' })).toBeDisabled();

  await screen.getByRole('button', { name: '10 January 2024' }).click();
  expect(onChange).toHaveBeenLastCalledWith(minDate, 'calendar');

  await screen.getByRole('button', { name: 'New year' }).click();
  expect(onChange).toHaveBeenLastCalledWith(minDate, 'quickOption');
});

test('the sort arrow flips for desc and the multi-sort badge is not clipped', async () => {
  const screen = await render(
    <Mantine>
      <Table
        items={persons.slice(0, 3)}
        id="id"
        columns={(col) => [
          col((x) => x.first_name, { header: 'First name' }),
          col((x) => x.last_name, { header: 'Last name' }),
        ]}
        defaultSort={[
          { columnId: 0, direction: 'desc' },
          { columnId: 1, direction: 'asc' },
        ]}
      />
    </Mantine>,
  );

  await expect.element(screen.getByText('Kassia')).toBeVisible();
  const [first, second] = document.querySelectorAll('.mantine-Indicator-root');
  const [firstArrow, secondArrow] = [first, second].map((x) =>
    getComputedStyle(x!.querySelector('span')!),
  );
  // Inline boxes ignore transform, even though getComputedStyle still reports it.
  expect(firstArrow!.display).not.toBe('inline');
  expect(firstArrow!.transform).not.toBe('none');
  expect(secondArrow!.transform).toBe('none');
  expect(getComputedStyle(first!).overflow).toBe('visible');
  expect(first!.querySelector('.mantine-Indicator-indicator')).toHaveTextContent('1');
});
