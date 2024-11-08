import type { TableProps } from '../../src';
import { DateFilter, SelectFilter, TextFilter } from '../../src';
import type { Person } from './_data';

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

const _defaultColumns: TableProps<Person>['columns'] = (col) => [
  //
  col((x) => x.avatar, {
    header: 'Avatar',
    exportHeader: 'Avatar',
    renderCell: (avatar) => <img width={50} height={50} src={avatar} />,
    width: 'max-content',
  }),

  col((x) => x.first_name, {
    id: 'first_name',
    header: 'First Name',
    filter: <TextFilter />,
  }),

  col((x) => x.last_name, {
    id: 'last_name',
    header: 'Last Name',
    filter: <TextFilter />,
  }),

  col((x) => x.job_title, {
    header: 'Job Title',
    filter: <SelectFilter />,
  }),

  col((x) => new Date(x.birthday), {
    header: 'Birthday',
    renderCell: (birthday) => dateFormat.format(birthday),
    filter: <DateFilter maxDate={new Date()} />,
  }),
];

export const defaultColumns = _defaultColumns((value, column) => ({ value, ...column }));
