import { ComponentMeta } from '@storybook/react';
import React from 'react';
import { DateFilter, SelectFilter, Table, TableProps, TextFilter } from '../../src';
import data, { Person } from './_data';

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

const defaultColumns: TableProps<Person>['columns'] = (col) => [
  //
  col((x) => x.avatar, {
    header: 'Avatar',
    renderCell: (avatar) => <img width={50} height={50} src={avatar} />,
    width: 'max-content',
  }),

  col((x) => x.first_name, {
    header: 'First Name',
    filter: <TextFilter />,
  }),

  col((x) => x.last_name, {
    header: 'Last Name',
    filter: <TextFilter />,
  }),

  col((x) => x.job_title, {
    header: 'Job Title',
    filter: <SelectFilter />,
  }),

  col((x) => x.birthday, {
    header: 'Birthday',
    renderCell: (birthday) => dateFormat.format(new Date(birthday)),
    filter: <DateFilter />,
  }),
];

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

export const SortDisabled = {
  args: {
    disableSort: true,
  },
};
