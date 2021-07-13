import { makeStyles } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { Action } from 'schummar-state/react';
import { DefaultFilterComponent, Table, TextFilterComponent } from '../../src';
import { flatMap } from '../../src/misc/helpers';

const useClasses = makeStyles((theme) => ({
  container: {
    // marginTop: '10vh',
    // height: '70vh',
    // overflow: 'auto',
    display: 'grid',
    gridTemplateRows: 'max-content 1fr',
  },
  oddCell: {
    background: theme.palette.grey[100],
  },
}));

type TopItem = {
  type: 'top';
  id: string;
  name: string;
  h: number;
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
const loadTop = new Action(async () => {
  // await new Promise((r) => setTimeout(r, 1000));
  return new Array(N)
    .fill(0)
    .map<TopItem>((_d, index) => ({ type: 'top', id: String(index), name: `top item ${index}`, h: (index % 4) * 30 }));
});

function App(): JSX.Element {
  const classes = useClasses();
  const [active, setActive] = useState<string[]>(['0']);
  const [selected, setSelected] = useState<Set<any>>(new Set());
  const [children, setChildren] = useState<SubItem[]>([]);
  const [topItems] = loadTop.useAction(undefined);
  const [big, setBig] = useState(true);

  // console.log(active, children1, children2);

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
    }, 100);
    return () => clearInterval(handle);
  }, [active]);

  return (
    <div className={classes.container} onClick={() => setBig((b) => !b)}>
      <div style={{ height: 200 }}></div>

      <Table
        items={topItems ? [...topItems, ...children] : undefined}
        id="id"
        parentId={(x) => (x.type === 'sub' ? x.parentId : undefined)}
        hasDeferredChildren={(x) => !x.id.replace('_', '').includes('_')}
        onExpandedChange={(e) => {
          // setActive([...e].map(String));
        }}
        onSelectionChange={setSelected}
        expandOnlyOne
        selectSyncChildren
        defaultHiddenColumns={new Set([3])}
        onHiddenColumnsChange={(...args) => console.log(...args)}
        // defaultExpanded={new Set('0')}
        // expanded={new Set('0')}
        columns={(col) => [
          col((x) => x.id, {
            header: 'Id',
            filterComponent: <TextFilterComponent />,
            renderCell: (id, x) => (x.type === 'top' ? <div style={{ height: x.h * (big ? 10 : 1) }}>{id}</div> : id),
            sortBy: (id) => id,
          }),

          col((x) => x.name, {
            header: 'Name',
            filterComponent: <TextFilterComponent />,
          }),

          col((x) => (x.type === 'sub' ? x.state : null), {
            header: 'State',
            filterComponent: <DefaultFilterComponent stringValue={(v) => v + '#'} />,
            width: '20ch',
          }),

          col((x) => (x.type === 'sub' ? x.tags : []), {
            header: 'Tags',
            filterComponent: <TextFilterComponent />,
            // filterComponent: <DefaultFilterComponent render={(x) => String(x)} />,
            // defaultIsHidden: true,
            sortBy: [(x) => x.includes('bar'), (x) => x[0]],
          }),
        ]}
        classes={classes}
        // dependencies={[]}
        stickyHeader
        debug={(...args) => console.log(...args)}
        virtual={{ throttleScroll: 16 }}
        fullWidth="left"
        revealFiltered
      />
    </div>
  );
}

export default App;
