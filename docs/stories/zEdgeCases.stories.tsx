import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table } from '../../src';
import data, { type Person } from './_data';

type Story = StoryObj<typeof meta>;

const meta: Meta<typeof Table<Person>> = {
  title: 'Edge Cases',
  component: Table,
};
export default meta;

export const ManyColumns = {
  args: {
    items: data,
    id: 'id',
    virtual: true,
    stickyHeader: true,
    fullWidth: true,
    columns: (col) =>
      Array.from({ length: 30 })
        .fill(0)
        .map((_x, i) =>
          col(() => 'x', {
            header: String(i),
          }),
        ),
  },
} satisfies Story;

export const NoColumns = {
  args: {
    items: data.slice(0, 3),
    id: 'id',
    enableSelection: false,
    virtual: true,
    columns: (col) => [col(() => 'x', { header: 'X' })],
    displaySize: { mobile: 400, desktop: Infinity },
    displaySizeOverrides: {
      mobile: {
        enableExport: false,
      },
    },
  },
} satisfies Story;

export const FalsyColumnsInFunction = {
  args: {
    items: data.slice(0, 3),
    id: 'id',
    enableSelection: false,
    virtual: true,
    columns: (col) => [col(() => 'x', { header: 'X' }), null, undefined, false, '', 0],
    displaySize: { mobile: 400, desktop: Infinity },
    displaySizeOverrides: {
      mobile: {
        enableExport: false,
      },
    },
  },
} satisfies Story;

export const FalsyColumnsInArray = {
  args: {
    items: data.slice(0, 3),
    id: 'id',
    enableSelection: false,
    virtual: true,
    columns: [{ value: () => 'x', header: 'X' }, null, undefined, false, '', 0],
    displaySize: { mobile: 400, desktop: Infinity },
    displaySizeOverrides: {
      mobile: {
        enableExport: false,
      },
    },
  },
} satisfies Story;
