import { expect, test } from 'vite-plus/test';
import { Mui5TableThemeProvider } from '../theme/mui5Theme';
import { persons } from './fixtures';
import { render } from 'vitest-browser-react';
import { Table } from '..';

test('renders the table with mui5 components', async () => {
  const screen = await render(
    <Mui5TableThemeProvider>
      <Table
        items={persons.slice(0, 3)}
        id="id"
        columns={(col) => [col((x) => x.first_name, { header: 'First name' })]}
      />
    </Mui5TableThemeProvider>,
  );

  await expect.element(screen.getByText('Kassia')).toBeVisible();
  expect(document.querySelectorAll('.MuiCheckbox-root')).toHaveLength(4);
});
