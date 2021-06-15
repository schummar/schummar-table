import React, { useState } from 'react';
import { Action } from 'schummar-state/react';
import { DefaultFilterComponent, Table, TextFilterComponent } from '../../src';
import { flatMap } from '../../src/helpers';

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
  date: Date;
};

const loadTop = new Action(async () => {
  await new Promise((r) => setTimeout(r, 1000));
  return new Array(10).fill(0).map<TopItem>((_d, index) => ({ type: 'top', id: String(index), name: `top item ${index}` }));
});

const loadChildren = new Action(async (parentId?: string) => {
  await new Promise((r) => setTimeout(r, 1000));
  if (!parentId) return [];

  return new Array(10).fill(0).map<SubItem>((_d, index) => ({
    type: 'sub',
    id: `${parentId}_${index}`,
    parentId,
    name: `sub item ${parentId}_${index}`,
    state: 'foo',
    date: new Date(),
  }));
});

const month = (d: Date) => new Date(d.getFullYear(), d.getMonth());

function App(): JSX.Element {
  const [active, setActive] = useState<string[]>([]);
  const [topItems = []] = loadTop.useAction(undefined);
  const [children1 = []] = loadChildren.useAction(active.find((a) => !a.includes('_')));
  const [children2 = []] = loadChildren.useAction(active.find((a) => a.includes('_')));

  console.log(active, children1, children2);

  return (
    <Table
      items={[...topItems, ...children1, ...children2]}
      id="id"
      parentId={(x) => (x.type === 'sub' ? x.parentId : undefined)}
      hasDeferredChildren={(x) => !x.id.replace('_', '').includes('_')}
      onExpandedChange={(e) => {
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
        }),

        col((x) => (x.type === 'sub' ? x.state : null), {
          header: 'State',
          filterComponent: <DefaultFilterComponent options={['foo', 'bar', 'baz']} />,
        }),
      ]}
    />
  );
}

export default App;
