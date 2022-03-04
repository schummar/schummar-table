import React from 'react';
import { DateFilter, SelectFilter, Table, TableProps, TextFilter } from '../../../src';
import fakePersons from '../data/fakePersons.json';

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

type Person = typeof fakePersons extends Array<infer T> ? T : never;

export function DefaultTable(props: Partial<TableProps<Person>>) {
  return (
    <Table
      items={fakePersons}
      id="id"
      virtual
      enableExport
      defaultWidth="200px"
      columns={(col) => [
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
      ]}
      {...props}
    />
  );
}
