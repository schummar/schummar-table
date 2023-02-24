import { Box, Typography } from '@mui/material';
import type { ComponentMeta } from '@storybook/react';
import { useState } from 'react';
import type { DateRange, Sort } from '../../src';
import { DateFilter, SelectFilter, Table, TextFilter } from '../../src';
import data from './_data';

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'External Filters',
  component: Table,
} as ComponentMeta<typeof Table>;

export const Primary = () => {
  const [sort, setSort] = useState(new Array<Sort>());
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jobTitle, setJobTitle] = useState(new Set<string>());
  const [birthday, setBirthday] = useState<Date | DateRange | null>(null);

  return (
    <Box>
      <Box>
        <Typography variant="h3">External filters:</Typography>
        <p>sort: {JSON.stringify([...(sort ?? [])])}</p>
        <p>firstName: {JSON.stringify(firstName)}</p>
        <p>lastName: {JSON.stringify(lastName)}</p>
        <p>jobTitle: {JSON.stringify([...(jobTitle ?? [])])}</p>
        <p>birthday: {JSON.stringify(birthday)}</p>
      </Box>

      <Table
        items={data}
        id="id"
        virtual
        stickyHeader
        fullWidth
        sort={sort}
        onSortChange={setSort}
        externalSort
        onReset={() => {
          setSort([]);
          setFirstName('');
          setLastName('');
          setJobTitle(new Set());
          setBirthday(null);
        }}
        columns={(col) => [
          //
          col((x) => x.avatar, {
            header: 'Avatar',
            renderCell: (avatar) => <img width={50} height={50} src={avatar} />,
            width: 'max-content',
          }),

          col((x) => x.first_name, {
            header: 'First Name',
            filter: (
              <TextFilter external value={firstName} onChange={(v) => setFirstName(v ?? '')} />
            ),
          }),

          col((x) => x.last_name, {
            header: 'Last Name',
            filter: <TextFilter external value={lastName} onChange={(v) => setLastName(v ?? '')} />,
          }),

          col((x) => x.job_title, {
            header: 'Job Title',
            filter: (
              <SelectFilter
                external
                value={jobTitle}
                onChange={(v) => setJobTitle(v ?? new Set())}
              />
            ),
          }),

          col((x) => x.birthday, {
            header: 'Birthday',
            renderCell: (birthday) => dateFormat.format(new Date(birthday)),
            filter: (
              <DateFilter external value={birthday} onChange={(v) => setBirthday(v ?? null)} />
            ),
          }),
        ]}
      />
    </Box>
  );
};
