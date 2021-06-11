import React, { useMemo } from 'react';
import { Table } from '../../src';

type Family = {
  id: number;
  lastName: string;
};

type User = {
  parent: number;
  lastName: string;
  firstName: string;
  birthday: Date;
};

function App(): JSX.Element {
  const data: (Family | User)[] = useMemo(
    () => [
      { id: 1, lastName: 'Schumacher' },
      { parent: 1, firstName: 'Marco', lastName: 'Schumacher', birthday: new Date('1988-10-16') },
      { parent: 1, firstName: 'Sonja', lastName: 'Schumacher', birthday: new Date('1989-07-19') },
      { parent: 1, firstName: 'Linus', lastName: 'Schumacher', birthday: new Date('2017-07-01') },
      { parent: 1, firstName: 'Laura', lastName: 'Schumacher', birthday: new Date('2020-02-21') },
      { id: 2, lastName: 'Kowarschick' },
      { parent: 2, firstName: 'Wolfgang', lastName: 'Kowarschick', birthday: new Date() },
      { parent: 2, firstName: 'Marianne', lastName: 'Kowarschick', birthday: new Date() },
      { id: 3, lastName: 'Foo' },
    ],
    [],
  );

  return (
    <Table
      data={data}
      deferredExpansion={(u) => 'id' in u}
      columns={(col) => [
        col((u) => u.lastName, {
          header: 'Nachname',
        }),

        col((u) => ('firstName' in u ? u.firstName : ''), {
          header: 'Vorname',
        }),

        col((u) => ('birthday' in u ? u.birthday : null), {
          header: 'Geburtstag',
          renderValue: (g) => g?.toISOString(),
        }),
      ]}
    />
  );
}

export default App;
