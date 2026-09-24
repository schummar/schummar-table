import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-react';
import { Table } from '..';

test('renders a table', async () => {
  const screen = await render(
    <Table
      items={[{ id: 1, name: 'apple' }]}
      id="id"
      columns={(col) => [col((x) => x.name, { header: 'Name' })]}
    />,
  );
  await expect.element(screen.getByText('Name')).toBeVisible();
  await expect.element(screen.getByText('apple')).toBeVisible();
});
