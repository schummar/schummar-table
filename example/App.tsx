import { createTheme as mui5CreateTheme, Tooltip } from '@mui/material';
import localforage from 'localforage';
import React, { useEffect, useMemo, useState } from 'react';
import { createResource } from 'schummar-state';
import { useResource } from 'schummar-state/react';
import { DateFilter, SelectFilter, Table, TableThemeProvider, TextFilter } from '../src';
import { DateRange } from '../src/components/datePicker';
import { asString, flatMap } from '../src/misc/helpers';
import classes from './app.module.css';

const storage = localforage.createInstance({ name: 'xyz' });

const mui5Theme = mui5CreateTheme();

type TopItem = {
  index: number;
  type: 'top';
  id: string;
  name: string;
  h: number;
  date: DateRange;
  price: number;
};

type SubItem = {
  index: number;
  type: 'sub';
  id: string;
  parentId: string;
  name: string;
  state: string;
  tags: string[];
  date: DateRange;
  price: number;
};

const N = 500,
  M = 10;
const loadTop = createResource(async () => {
  // await new Promise((r) => setTimeout(r, 1000));
  return new Array(N).fill(0).map<TopItem>((_d, index) => ({
    index,
    type: 'top',
    id: String(index),
    name: `top item ${index}`,
    h: (index % 4) * 30,
    date: { min: new Date(2022, 0, index, 12), max: new Date(2022, 0, index + 7, 12) },
    price: Math.random() * 1000,
  }));
});

function Content(): JSX.Element {
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
            index,
            type: 'sub',
            id: `${parentId}_${index}`,
            parentId,
            name: `sub item ${parentId}_${index}`,
            state: `foo--${i === index ? 1 : 0}`,
            tags: [`foo${index}`, index % 2 === 0 ? 'bar' : 'baz'],
            date: topItems?.find((i) => i.id === parentId)?.date ?? { min: new Date(), max: new Date() },
            price: Math.random() * 1000,
          })),
        ),
      );
      i = (i + 1) % M;
      clearInterval(handle);
    }, 1000);
    return () => clearInterval(handle);
  }, [active, topItems]);

  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const h = setInterval(() => setCounter((c) => c + 1), 1000);
    return () => {
      clearInterval(h);
    };
  });

  console.log('render', counter);

  return (
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
      // rowAction={(_item, index) => (index % 2 === 0 ? '?' : undefined)}
      persist={{ storage, id: 'example', exclude: ['selection'] }}
      defaultColumnProps={{
        renderCell: (value) => (typeof value === 'string' ? `${counter}::${value}` : asString(value)),
      }}
      wrapCell={(content) => (
        <Tooltip title={content ?? ''}>
          <div css={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{content}</div>
        </Tooltip>
      )}
      columns={(col) => [
        col((x) => x.id, {
          header: 'Id',
          filter: <TextFilter />,
          renderCell: (id, x) => (x.type === 'top' ? <div>{id}</div> : id),
          sortBy: [(id) => id],
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

        col((x) => ''.padEnd(x.index, '#'), {
          header: 'test',
          filter: <SelectFilter filterBy={(x: string) => x.length} />,
          // width: '10ch',
        }),
        col((x) => x.date, {
          header: 'Date',
          renderCell: (date) => date && [formatDate(date.min), formatDate(date.max)].join(' - '),
          filter: <DateFilter firstDayOfWeek={3} />,
        }),
        col((x) => x.price, {
          header: 'Price',
          footer: (prices) => <>∑ {prices.reduce((sum, price) => sum + price, 0).toFixed(2)}€</>,
          renderCell: (price) => <>{price.toFixed(2)}€</>,
          classes: {
            cell: classes.right,
            footerCell: classes.right,
          },
        }),
      ]}
      classes={{
        ...classes,
        // cell: (_item, index) => (index % 2 === 1 ? classes.odd : undefined),
      }}
      // stickyHeader
      // debug={(...args) => console.debug(...args)}
      // debugRender={(...args) => console.debug(...args)}
      virtual={{ throttleScroll: 16 }}
      fullWidth="left"
      text={{
        exportCopy: <span onClick={() => undefined}>foo</span>,
      }}
      // revealFiltered
    />
  );
}

function App() {
  return (
    <TableThemeProvider
      theme={{
        classes: {
          cell: '.my-cell-style',
        },
        colors: {
          primary: {
            main: '#2e8555',
            light: '#33925d',
            contrastText: 'white',
          },
        },
      }}
    >
      <div
        css={{
          padding: 20,
          display: 'grid',
          color: '#454d59',
          // color: 'red',
        }}
      >
        {/* <Mui5ThemeProvider theme={mui5Theme}>
        <Mui5TableThemeProvider>{table}</Mui5TableThemeProvider>
      </Mui5ThemeProvider> */}

        {/* <Mui4ThemeProvider theme={mui4Theme}>
        <Mui4TableThemeProvider>{table}</Mui4TableThemeProvider>
      </Mui4ThemeProvider> */}

        <Content />
      </div>
    </TableThemeProvider>
  );
}

export default App;
