import { Box, Typography } from '@mui/material';
import type { Meta } from '@storybook/react-vite';
import { useState } from 'react';
import type { DateRange, Id, Sort } from '../../src';
import { dateFilter, selectFilter, Table, textFilter } from '../../src';
import data from './_data';

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'External Filters',
  component: Table,
} as Meta<typeof Table>;

export const Primary = () => {
  const [sort, setSort] = useState(new Array<Sort>());
  const [filterValues, setFilterValues] = useState(new Map<Id, unknown>());

  const firstName = (filterValues.get('first_name') as string | undefined) ?? '';
  const lastName = (filterValues.get('last_name') as string | undefined) ?? '';
  const jobTitle = (filterValues.get('job_title') as Set<string> | undefined) ?? new Set();
  const birthday = (filterValues.get('birthday') as Date | DateRange | null | undefined) ?? null;

  const filteredData = data.filter((x) => {
    if (firstName && !x.first_name.includes(firstName)) return false;
    if (lastName && !x.last_name.includes(lastName)) return false;
    if (jobTitle.size > 0 && !jobTitle.has(x.job_title)) return false;

    const birthdayDate = new Date(x.birthday);
    if (birthday instanceof Date) {
      if (birthdayDate && birthdayDate !== birthday) return false;
    } else if (
      birthday?.min &&
      birthday?.max &&
      (birthdayDate < birthday.min || birthdayDate > birthday.max)
    ) {
      return false;
    }
    return true;
  });

  return (
    <Box>
      <Box>
        <Typography variant="h3">External filters:</Typography>
        <p>sort: {JSON.stringify([...(sort ?? [])])}</p>
        <p>firstName: {JSON.stringify(firstName)}</p>
        <p>lastName: {JSON.stringify(lastName)}</p>
        <p>jobTitle: {JSON.stringify([...jobTitle])}</p>
        <p>birthday: {JSON.stringify(birthday)}</p>
      </Box>

      <Table
        items={filteredData}
        id="id"
        virtual
        stickyHeader
        fullWidth
        sort={sort}
        onSortChange={setSort}
        externalSort
        filterValues={filterValues}
        onFilterValuesChange={setFilterValues}
        onReset={(scope) => {
          if (scope === 'table') {
            setSort([]);
            setFilterValues(new Map());
          }
        }}
        columns={(col) => [
          col((x) => x.avatar, {
            header: 'Avatar',
            renderCell: (avatar) => <img width={50} height={50} src={avatar} />,
            width: 'max-content',
          }),

          col((x) => x.first_name, {
            id: 'first_name',
            header: 'First Name',
            filter: textFilter({ external: true }),
          }),

          col((x) => x.last_name, {
            id: 'last_name',
            header: 'Last Name',
            filter: textFilter({ external: true }),
          }),

          col((x) => x.job_title, {
            id: 'job_title',
            header: 'Job Title',
            filter: selectFilter({ external: true }),
          }),

          col((x) => x.birthday, {
            id: 'birthday',
            header: 'Birthday',
            renderCell: (birthday) => dateFormat.format(new Date(birthday)),
            filter: dateFilter({ external: true }),
          }),
        ]}
      />
    </Box>
  );
};
