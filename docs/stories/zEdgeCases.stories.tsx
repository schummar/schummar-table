import type { ComponentMeta } from '@storybook/react';
import { Table } from '../../src';
import data from './_data';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Edge Cases',
  component: Table,
} as ComponentMeta<typeof Table>;

export const ManyColumns = () => {
  return (
    <Table
      items={data}
      id="id"
      virtual
      stickyHeader
      fullWidth
      columns={(col) =>
        Array.from({ length: 30 })
          .fill(0)
          .map((_x, i) =>
            col(() => 'x', {
              header: String(i),
            }),
          )
      }
    />
  );
};
