import type { Meta } from '@storybook/react';
import { Table, type TableProps } from '../../src';

import { defaultColumns } from './_default';

type Item = typeof data extends readonly (infer S)[] ? S : never;

const data = [
  {
    id: 1,
    parentId: undefined,
    avatar: 'https://robohash.org/nihilrerumsaepe.png?size=50x50&set=set1',
    first_name: 'Kassia',
    last_name: 'Nears',
    job_title: 'Occupational Therapist',
    birthday: '1965-05-03T13:47:23Z',
  },
  {
    id: 2,
    parentId: 1,
    avatar: 'https://robohash.org/estquiest.png?size=50x50&set=set1',
    first_name: 'Dulcia',
    last_name: 'Grevel',
    job_title: 'Paralegal',
    birthday: '1976-10-21T08:58:33Z',
  },
  {
    id: 3,
    parentId: 2,
    avatar: 'https://robohash.org/voluptatemetatque.png?size=50x50&set=set1',
    first_name: 'Chelsey',
    last_name: 'Skivington',
    job_title: 'Recruiting Manager',
    birthday: '1966-03-04T10:49:44Z',
  },
  {
    id: 4,
    parentId: undefined,
    avatar: 'https://robohash.org/expeditacumcorrupti.png?size=50x50&set=set1',
    first_name: 'Thoma',
    last_name: 'Greenroyd',
    job_title: 'Nurse Practicioner',
    birthday: '1979-09-18T01:09:51Z',
  },
  {
    id: 5,
    parentId: 4,
    avatar: 'https://robohash.org/voluptatemquirerum.png?size=50x50&set=set1',
    first_name: 'Maurene',
    last_name: 'Stroobant',
    job_title: 'Internal Auditor',
    birthday: '1998-09-24T00:45:41Z',
  },
  {
    id: 6,
    parentId: 5,
    avatar: 'https://robohash.org/debitisnisiveniam.png?size=50x50&set=set1',
    first_name: 'Julian',
    last_name: 'Terbrugge',
    job_title: 'Tax Accountant',
    birthday: '1988-10-19T19:11:56Z',
  },
] as const;

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Nested',
  component: Table,

  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    items: {
      table: { disable: true },
    },
    fullWidth: {
      defaultValue: 'left',
      options: [true, false, 'left', 'right'],
      control: { type: 'inline-radio' },
    },
  },
} as Meta<typeof Table>;

export const Primary = {
  args: {
    items: data,
    id: 'id',
    parentId: 'parentId',
    columns: defaultColumns,
    virtual: true,
    enableExport: true,
    stickyHeader: true,
    fullWidth: 'left',
  } satisfies TableProps<Item>,
};

export const ExpandOnlyOne = {
  args: {
    ...Primary.args,
    expandOnlyOne: true,
  } satisfies TableProps<Item>,
};
