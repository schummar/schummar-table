import createCache from '@emotion/cache';
import { CacheProvider, ThemeProvider } from '@emotion/react';
import { describe, expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-react';
import { Table } from '..';
import type { TableProps } from '../types';
import { persons, type Person } from './fixtures';

const columns: TableProps<Person>['columns'] = (col) => [
  col((x) => x.first_name, { id: 'first', header: 'First' }),
  col((x) => x.last_name, { id: 'last', header: 'Last' }),
];

const baseProps: TableProps<Person> = { items: persons.slice(0, 3), id: 'id', columns };

async function cellOf(text: string) {
  await expect.poll(() => document.body.textContent?.includes(text)).toBe(true);
  const span = [...document.querySelectorAll('span')].find((el) => el.textContent === text)!;
  return span.parentElement!;
}

describe('style precedence', () => {
  test('emotion cell styles override the built-in cell styles', async () => {
    await render(<Table {...baseProps} styles={{ cell: { paddingLeft: '13px' } }} />);
    expect(getComputedStyle(await cellOf('Kassia')).paddingLeft).toBe('13px');
  });

  test('user styles win when the app cache is prepended as well', async () => {
    const cache = createCache({ key: 'prepended', prepend: true });
    await render(
      <CacheProvider value={cache}>
        <Table {...baseProps} styles={{ cell: { paddingLeft: '13px' } }} />
      </CacheProvider>,
    );
    expect(getComputedStyle(await cellOf('Kassia')).paddingLeft).toBe('13px');
  });

  test('theme function interpolations receive the emotion theme', async () => {
    await render(
      <ThemeProvider theme={{ pad: '13px' }}>
        <Table
          {...baseProps}
          styles={{ evenCell: (theme) => ({ paddingLeft: (theme as { pad: string }).pad }) }}
        />
      </ThemeProvider>,
    );
    expect(getComputedStyle(await cellOf('Kassia')).paddingLeft).toBe('13px');
    expect(getComputedStyle(await cellOf('Dulcia')).paddingLeft).not.toBe('13px');
  });

  test('row checkboxes keep their muted colour', async () => {
    await render(<Table {...baseProps} />);
    await cellOf('Kassia');
    const label = document.querySelectorAll('input[type=checkbox]')[1]!.closest('label')!;
    expect(getComputedStyle(label).color).toBe('rgb(201, 207, 218)');
  });
});

describe('dynamic styles', () => {
  test('function classes and styles are applied per row and cell', async () => {
    await render(
      <Table
        {...baseProps}
        defaultExpanded={new Set([1])}
        rowDetails="details"
        classes={{
          row: (item) => `row-${item.id}`,
          cell: (item, index) => `cell-${index}`,
          oddCell: 'odd',
          details: (item) => `details-${item.id}`,
        }}
        styles={{
          row: (item) => (item.id === 2 ? { outline: '1px solid rgb(255, 0, 0)' } : undefined),
          cell: (item) => ({ paddingLeft: `${10 + item.id}px` }),
          details: () => ({ paddingLeft: '21px' }),
        }}
      />,
    );

    const dulcia = await cellOf('Dulcia');
    expect(dulcia.classList).toContain('cell-1');
    expect(dulcia.classList).toContain('odd');
    expect(getComputedStyle(dulcia).paddingLeft).toBe('12px');

    const row = dulcia.parentElement!;
    expect(row.classList).toContain('row-2');
    expect(getComputedStyle(row).outlineColor).toBe('rgb(255, 0, 0)');

    const details = document.querySelector('.details-1')!;
    expect(getComputedStyle(details).paddingLeft).toBe('21px');
  });

  test('column styles replace the theme cell styles for that column', async () => {
    await render(
      <Table
        {...baseProps}
        styles={{ cell: { paddingLeft: '13px' } }}
        columns={(col) => [
          col((x) => x.first_name, { id: 'first', styles: { cell: { paddingLeft: '17px' } } }),
          col((x) => x.last_name, { id: 'last' }),
        ]}
      />,
    );
    expect(getComputedStyle(await cellOf('Kassia')).paddingLeft).toBe('17px');
    expect(getComputedStyle(await cellOf('Nears')).paddingLeft).toBe('13px');
  });
});
