import type { Meta } from '@storybook/react';
import { Table } from '../../src';
import data from './_data';
import { defaultColumns } from './_default';
import css from './styles.module.css';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Intro',
  component: Table,

  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    items: {
      table: { disable: true },
    },
    fullWidth: {
      defaultValue: true,
      options: [true, false, 'left', 'right'],
      control: { type: 'inline-radio' },
    },
  },
} as Meta<typeof Table>;

export const Primary = {
  args: {
    classes: { table: css.table },
    items: data,
    id: 'id',
    columns: defaultColumns,
    virtual: true,
    enableExport: true,
    stickyHeader: true,
    fullWidth: true,
  },
};

export const SortDisabledAll = {
  args: {
    ...Primary.args,
    disableSort: true,
  },
};

export const SortDisabledOne = {
  args: {
    ...Primary.args,
    columns: defaultColumns.map((col, i) => ({
      ...col,
      disableSort: i === 0,
    })),
  },
};

export const Persitance = {
  args: {
    ...Primary.args,
    persist: { storage: localStorage, id: 'tablePersistance' },
  },
};

export const HiddenColumns = {
  args: {
    ...Primary.args,
    defaultHiddenColumns: new Set([1, 2]),
    columns: defaultColumns.map((col, i) => ({
      ...col,
      hidden: i === 0 ? false : i === 1 ? true : undefined,
    })),
  },
};

export const StyledCells = {
  args: {
    ...Primary.args,
    styles: {
      cell: {
        'div:hover > &': {
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
        },
      },
      evenCell: {
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
      },
    },
  },
};
