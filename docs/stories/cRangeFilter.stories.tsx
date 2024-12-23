import type { ComponentMeta } from '@storybook/react';
import { RangeFilter, Table } from '../../src';
import css from './styles.module.css';

const items = [
  { id: '1', name: 'John', age: 20 },
  { id: '2', name: 'Jane', age: 21 },
  { id: '3', name: 'Jack', age: 22 },
  { id: '4', name: 'Jill', age: 23 },
];

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Range Filter',
  component: Table,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    items: {
      table: { disable: true },
    },
    fullWidth: {
      options: [true, false, 'left', 'right'],
      control: { type: 'inline-radio' },
    },
  },
} as ComponentMeta<typeof Table>;

export const Primary = {
  args: {
    classes: { table: css.table },
    items: items,
    id: 'id',
    columns: (col: any) => [
      col((x: any) => x.name, {
        header: 'Name',
      }),
      col((x: any) => x.age, {
        header: 'Age',
        filter: <RangeFilter min={-42} />,
      }),
    ],
    fullWidth: true,
  },
};
