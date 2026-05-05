import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table, TextFilter } from '../../src';
import data, { type Person } from './_data';
import { useEffect, useState } from 'react';

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
    items: data.slice(0, 1000),
    id: 'id',
    enableSelection: false,
    virtual: true,
    columns: (col) => [col(() => 'x', { id: 'x', header: 'X' })],
    defaultHiddenColumns: new Set(['x']),
    displaySize: { mobile: 400, desktop: Infinity },
    displaySizeOverrides: {
      mobile: {
        enableExport: false,
      },
    },
    subgrid: true,
    styles: {
      table: {
        border: '1px solid red',
      },
      row: {
        border: '1px solid blue',
      },
    },
    debugRender: (msg) =>
      typeof msg === 'string' && msg.startsWith('Virtualized') && console.log(msg),
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

export const PeriodicRerenders = {
  args: {
    items: data.slice(0, 20),
    id: 'id',
    enableSelection: false,
    virtual: true,
    columns: (col) => [
      col(() => 'x', {
        header: 'X',
        filter: <TextFilter filterBy={(x: Person) => x.first_name} />,
      }),
    ],
  },
  decorators: [
    (Story) => {
      const [count, setCount] = useState(0);

      useEffect(() => {
        const interval = setInterval(() => {
          setCount((c) => c + 1);
        }, 10_000);

        return () => clearInterval(interval);
      }, []);

      return (
        <div>
          <p>Rerenders: {count}</p>
          <Story />
        </div>
      );
    },
  ],
} satisfies Story;
