import { css } from '@emotion/react';
import { Link } from '@material-ui/icons';
import localforage from 'localforage';
import React, { useEffect, useMemo, useState } from 'react';
import { createResource } from 'schummar-state';
import { useResource } from 'schummar-state/react';
import { DateFilter, SelectFilter, Table, TextFilter } from '../src';
import { DateRange } from '../src/components/datePicker';
import { flatMap } from '../src/misc/helpers';
import { TableThemeContext } from '../src/theme/tableTheme';

const storage = localforage.createInstance({ name: 'xyz' });

// configureTableTheme({
//   text: {
//     exportCopy: <pre style={{ color: 'red' }}>foo</pre>,
//   },
// });

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

  // console.log(active, children1, children2);

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
          })),
        ),
      );
      i = (i + 1) % M;
      clearInterval(handle);
    }, 1000);
    return () => clearInterval(handle);
  }, [active]);

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
      onSelectionChange={setSelected}
      // disableSelection
      expandOnlyOne
      selectSyncChildren
      // defaultHiddenColumns={new Set([3])}
      onHiddenColumnsChange={(...args) => console.log(...args)}
      // defaultExpanded={new Set('0')}
      // expanded={new Set()}
      // wrapCell={(cell) => <div style={{ background: 'green' }}>{cell}</div>}
      enableExport
      rowAction={(_item, index) => (index % 2 === 0 ? <Link /> : undefined)}
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

        col((x) => (x.type === 'sub' ? x.state : null), {
          header: 'State',
          // filterComponent: <DefaultFilterComponent stringValue={(v) => v + '#'} />,
          width: '20ch',
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
        col((x) => (x.type === 'top' ? x.date : undefined), {
          header: 'Date',
          renderCell: (date) => date && [formatDate(date.min), formatDate(date.max)].join(' - '),
          filter: <DateFilter defaultValue={new Date()} persist={false} />,
        }),
      ]}
      css={{
        cell: (item) => (item.name.endsWith('10') ? css({ background: 'lightGray' }) : undefined),
      }}
      stickyHeader
      debug={(...args) => console.debug(...args)}
      virtual={{ throttleScroll: 16 }}
      fullWidth="left"
      revealFiltered
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
      {/* <div style={{ height: 200 }}></div> */}

      <TableThemeContext.Provider value={{}}>{table}</TableThemeContext.Provider>

      {/* <TableThemeContext.Provider value={muiTheme}>{table}</TableThemeContext.Provider>

      <TableThemeContext.Provider value={materialUiTheme}>{table}</TableThemeContext.Provider> */}
    </div>
  );
}

export default App;
