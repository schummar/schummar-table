import React from 'react';
import { Action } from 'schummar-state/react';
import { DefaultFilterComponent, Table, TextFilterComponent } from '../../src';

type Family = {
  id: number;
  lastName: string;
};

type Person = {
  id: number;
  lastName: string;
  firstName: string;
  birthday: Date;
};

const families: Family[] = [
  { id: 1, lastName: 'Schumacher' },
  { id: 2, lastName: 'Kowarschick' },
  { id: 3, lastName: 'Foo' },
];
const persons: Person[] = [
  { id: 11, firstName: 'Marco', lastName: 'Schumacher', birthday: new Date('1988-10-16') },
  { id: 12, firstName: 'Sonja', lastName: 'Schumacher', birthday: new Date('1989-07-19') },
  { id: 13, firstName: 'Linus', lastName: 'Schumacher', birthday: new Date('2017-07-01') },
  { id: 14, firstName: 'Laura', lastName: 'Schumacher', birthday: new Date('2020-02-21') },
  { id: 21, firstName: 'Wolfgang', lastName: 'Kowarschick', birthday: new Date() },
  { id: 22, firstName: 'Marianne', lastName: 'Kowarschick', birthday: new Date() },
];

const load = new Action(async (f?: Family) => {
  await new Promise((r) => setTimeout(r, 3000));
  return persons.filter((p) => p.lastName === f?.lastName);
});

const month = (d: Date) => new Date(d.getFullYear(), d.getMonth());

function App(): JSX.Element {
  return (
    <Table<Family | Person>
      items={families}
      id="id"
      // getChildren={(family) => ('firstName' in family ? [] : persons.filter((person) => person.lastName === family.lastName))}
      childrenHook={(item, isExpanded) => {
        const [data] = load.useAction('firstName' in item ? undefined : item, { dormant: !isExpanded || 'firstName' in item });
        return {
          hasChildren: !('firstName' in item),
          children: data,
        };
      }}
      columns={(col) => [
        col((u) => u.lastName, {
          header: 'Nachname',
          filterComponent: <DefaultFilterComponent />,
        }),

        col((u) => ('firstName' in u ? u.firstName : ''), {
          header: 'Vorname',
          filterComponent: <TextFilterComponent />,
        }),

        col((u) => ('birthday' in u ? month(u.birthday) : null), {
          header: 'Geburtstag',
          // stringValue: (month) => (month ? new Intl.DateTimeFormat('de', { dateStyle: 'short' }).format(month) : ''),
          renderCell: (_month, item) => ('birthday' in item ? item.birthday.toISOString() : ''),
          renderValue: (g) => g?.toISOString(),
          filterComponent: <DefaultFilterComponent />,
        }),
      ]}
    />
  );
}

export default App;
