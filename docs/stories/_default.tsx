import type { Column, TableProps } from '../../src';
import { DateFilter, SelectFilter, TextFilter } from '../../src';
import CombinedFilter from '../../src/components/combinedFilter';
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

export const mobileColumn: Column<Person, Person> = {
  value: (person) => person,
  id: 'mobile',
  header: 'Mobile View',
  displaySize: 'mobile',
  renderCell(person) {
    return (
      <div css={{ display: 'flex', gap: '1em' }}>
        <img width={50} height={50} src={person.avatar} />
        <div
          css={{
            '& .key': {
              fontSize: '0.7em',
              fontWeight: 'bold',

              '&:not(:first-of-type)': {
                marginTop: '0.5em',
              },
            },
            '.value': {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          }}
        >
          <div className="key">Name</div>
          <div className="value">
            {person.first_name} {person.last_name}
          </div>

          <div className="key">Job</div>
          <div className="value">{person.job_title}</div>

          <div className="key">Birthday</div>
          <div className="value">{dateFormat.format(new Date(person.birthday))}</div>
        </div>
      </div>
    );
  },
  filter: <CombinedFilter />,
  width: '1fr',
  styles: {
    cell: {
      padding: '0.5em 0',
    },
  },
};
