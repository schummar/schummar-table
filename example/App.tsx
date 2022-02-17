import { css } from '@emotion/react';
import { createTheme as mui5CreateTheme } from '@mui/material';
import { ThemeProvider as Mui5ThemeProvider } from '@mui/system';
import localforage from 'localforage';
import React, { useEffect, useMemo, useState } from 'react';
import { createResource } from 'schummar-state';
import { useResource } from 'schummar-state/react';
import { DateFilter, SelectFilter, Table, TextFilter } from '../src';
import { DateRange } from '../src/components/datePicker';
import { flatMap } from '../src/misc/helpers';
import { Mui5TableThemeProvider } from '../src/theme/mui5Theme';

const storage = localforage.createInstance({ name: 'xyz' });

const mui5Theme = mui5CreateTheme();

type TopItem = {
  type: 'top';
  id: string;
  name: string;
  h: number;
  date: DateRange;
};

type SubItem = {
  type: 'sub';
  id: string;
  parentId: string;
  name: string;
  state: string;
  tags: string[];
  date: DateRange;
};

const N = 1000,
  M = 10;
const loadTop = createResource(async () => {
  // await new Promise((r) => setTimeout(r, 1000));
  return new Array(N).fill(0).map<TopItem>((_d, index) => ({
    type: 'top',
    id: String(index),
    name: `top item ${index}`,
    h: (index % 4) * 30,
    date: { min: new Date(2022, 0, index, 12), max: new Date(2022, 0, index + 7, 12) },
  }));
});

function App(): JSX.Element {
  const [active, setActive] = useState<string[]>(['0']);
  const [selected, setSelected] = useState<Set<any>>(new Set());
  const [children, setChildren] = useState<SubItem[]>([]);
  const { value: topItems } = useResource(loadTop());
  const [big, setBig] = useState(true);

  const formatDate = useMemo(() => {
    const { format } = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
    return format;
  }, []);

  useEffect(() => {
    setChildren((c) => c.filter((c) => active.includes(c.parentId)));
    let i = 0;

    const handle = setInterval(() => {
      setChildren(
        flatMap(active, (parentId) =>
          new Array(M).fill(0).map<SubItem>((_d, index) => ({
            type: 'sub',
            id: `${parentId}_${index}`,
            parentId,
            name: `sub item ${parentId}_${index}`,
            state: `foo--${i === index ? 1 : 0}`,
            tags: [`foo${index}`, index % 2 === 0 ? 'bar' : 'baz'],
            date: topItems?.find((i) => i.id === parentId)?.date ?? { min: new Date(), max: new Date() },
          })),
        ),
      );
      i = (i + 1) % M;
      clearInterval(handle);
    }, 1000);
    return () => clearInterval(handle);
  }, [active, topItems]);

  const table = (
    // <div css={{ height: 300, overflowY: 'auto', margin: 10 }}>
    <Table
      items={topItems ? [...topItems, ...children] : undefined}
      id="id"
      parentId={(x) => (x.type === 'sub' ? x.parentId : undefined)}
      hasDeferredChildren={(x) => !x.id.replace('_', '').includes('_')}
      onExpandedChange={(e) => {
        setActive([...e].map(String));
      }}
      // onSelectionChange={setSelected}
      // disableSelection
      expandOnlyOne
      // selectSyncChildren
      // defaultHiddenColumns={new Set([3])}
      // defaultExpanded={new Set('0')}
      // expanded={new Set()}
      // wrapCell={(cell) => <div style={{ background: 'green' }}>{cell}</div>}
      // enableColumnResize={false}
      // enableColumnReorder={false}
      enableExport
      rowAction={(_item, index) => (index % 2 === 0 ? '?' : undefined)}
      persist={{ storage, exclude: ['selection'] }}
      columns={(col) => [
        col((x) => x.id, {
          header: 'Id',
          filter: <TextFilter />,
          renderCell: (id, x) => (x.type === 'top' ? <div>{id}</div> : id),
          sortBy: (id) => id,
        }),

        col((x) => x.name, {
          header: 'Name',
          filter: <TextFilter />,
        }),

        col((x) => (x.type === 'sub' ? x.state : []), {
          header: 'State',
          width: '20ch',
          filter: <SelectFilter singleSelect />,
        }),

        col((x) => (x.type === 'sub' ? x.tags : []), {
          header: 'Tags',
          filter: <SelectFilter render={(x) => String(x)} />,
          // defaultIsHidden: true,
          sortBy: [(x) => x.includes('bar'), (x) => x[0]],
        }),

        col((x) => 'askdjfhdfjkgfhas kljfhsdkjfh dfkgjlhs dfkljhdfgk jdh', {
          header: 'test',
          width: '10ch',
        }),
        col((x) => x.date, {
          header: 'Date',
          renderCell: (date) => date && [formatDate(date.min), formatDate(date.max)].join(' - '),
          filter: <DateFilter defaultValue={new Date()} persist={false} />,
        }),
      ]}
      css={{
        cell: (item) => (item.name.endsWith('10') ? css({ background: 'lightGray' }) : undefined),
      }}
      // stickyHeader
      debug={(...args) => console.debug(...args)}
      virtual={{ throttleScroll: 16 }}
      fullWidth="left"
      // revealFiltered
    />
    // </div>
  );

  return (
    <div
      css={{
        padding: 20,
        display: 'grid',
      }}
    >
      <Mui5ThemeProvider theme={mui5Theme}>
        <Mui5TableThemeProvider>{table}</Mui5TableThemeProvider>
      </Mui5ThemeProvider>

      {/* <Mui4ThemeProvider theme={mui4Theme}>
        <Mui4TableThemeProvider>{table}</Mui4TableThemeProvider>
      </Mui4ThemeProvider> */}

      {table}
    </div>
  );
}

export default App;
