import { ComponentMeta } from '@storybook/react';
import { Table } from '../../src';
import data from './_data';
import { defaultColumns } from './_default';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Intro',
  component: Table,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    items: {
      defaultValue: data,
      table: { disable: true },
    },
    id: {
      defaultValue: 'id',
    },
    columns: {
      defaultValue: defaultColumns,
    },
    virtual: {
      defaultValue: true,
    },
    enableExport: {
      defaultValue: true,
    },
    stickyHeader: {
      defaultValue: true,
    },
    fullWidth: {
      defaultValue: true,
      options: [true, false, 'left', 'right'],
      control: { type: 'inline-radio' },
    },
  },
} as ComponentMeta<typeof Table>;

export const Primary = {};

export const SortDisabledAll = {
  args: {
    disableSort: true,
  },
};

export const SortDisabledOne = {
  args: {
    columns: defaultColumns.map((col, i) => ({
      ...col,
      disableSort: i === 0,
    })),
  },
};
