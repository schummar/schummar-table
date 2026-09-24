import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { MantineProvider } from '@mantine/core';
import type { ReactNode } from 'react';
import { expect, test, vi } from 'vite-plus/test';
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
