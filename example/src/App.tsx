import { makeStyles } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { Action } from 'schummar-state/react';
import { DefaultFilterComponent, Table, TextFilterComponent } from '../../src';
import { flatMap } from '../../src/misc/helpers';

const useClasses = makeStyles((theme) => ({
  container: {
    height: '90vh',
    overflowY: 'auto',
  },
  oddCell: {
    background: theme.palette.grey[100],
  },
}));

type TopItem = {
  type: 'top';
  id: string;
  name: string;
};

type SubItem = {
  type: 'sub';
  id: string;
  parentId: string;
  name: string;
  state: string;
  tags: string[];
};

const N = 100,
  M = 10;
const loadTop = new Action(async () => {
  // await new Promise((r) => setTimeout(r, 1000));
  return new Array(N).fill(0).map<TopItem>((_d, index) => ({ type: 'top', id: String(index), name: `top item ${index}` }));
});

function App(): JSX.Element {
  const classes = useClasses();
  const [active, setActive] = useState<string[]>([]);
  const [children, setChildren] = useState<SubItem[]>([]);
  const [topItems = []] = loadTop.useAction(undefined);

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
    }, 1000);
    return () => clearInterval(handle);
  }, [active]);

  return (
    <div className={classes.container}>
      <Table
        items={[...topItems, ...children]}
        id="id"
        parentId={(x) => (x.type === 'sub' ? x.parentId : undefined)}
        hasDeferredChildren={(x) => !x.id.replace('_', '').includes('_')}
        onExpandedChange={(e) => {
          console.log('setActive', e);
          setActive([...e].map(String));
        }}
        expandOnlyOne
        selectSyncChildren
        columns={(col) => [
          col((x) => x.id, {
            header: 'Id',
            filterComponent: <TextFilterComponent />,
          }),

          col((x) => x.name, {
            header: 'Name',
            filterComponent: <TextFilterComponent />,
            width: '1fr',
          }),

          col((x) => (x.type === 'sub' ? x.state : null), {
            header: 'State',
            filterComponent: <DefaultFilterComponent />,
            width: '20ch',
          }),

          col((x) => (x.type === 'sub' ? x.tags : []), {
            header: 'Tags',
            filterComponent: <DefaultFilterComponent />,
            // defaultIsHidden: true,
            sortBy: [(x) => x.includes('bar'), (x) => x[0]],
            renderCell: (tags) => tags.join(', '),
          }),
        ]}
        classes={classes}
        // dependencies={[]}
        stickyHeader
        // debug={(...args) => console.log(...args)}
      />
    </div>
  );
}

export default App;
