import type { Meta } from '@storybook/react';
import { Id, Table, TableSettingsProvider, type TableProps } from '../../src';
import { DatePickerProvider } from '../../src/components/datePicker';
import ExcelExporter from '../../src/exporters/excelExporter';
import data from './_data';
import { defaultColumns } from './_default';
import css from './styles.module.css';

type Item = typeof data extends Array<infer S> ? S : never;

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Intro',
  component: Table,
  render: (args) => (
    <TableSettingsProvider
      additionalExporters={[{ action: 'download', exporter: new ExcelExporter() }]}
    >
      <DatePickerProvider showCalendarWeek>
        <Table {...args} />
      </DatePickerProvider>
    </TableSettingsProvider>
  ),

  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    items: {
      table: { disable: true },
    },
    fullWidth: {
      defaultValue: 'left',
      options: [true, false, 'left', 'right'],
      control: { type: 'inline-radio' },
    },
  },
} as Meta<typeof Table>;

export const Primary = {
  args: {
    classes: { table: css.table },
    items: data,
    id: 'id',
    columns: defaultColumns,
    virtual: true,
    enableExport: true,
    stickyHeader: true,
    fullWidth: 'left',
  } satisfies TableProps<Item>,
};

export const SortDisabledAll = {
  args: {
    ...Primary.args,
    disableSort: true,
  } satisfies TableProps<Item>,
};

export const SortDisabledOne = {
  args: {
    ...Primary.args,
    columns: defaultColumns.map((col, i) => ({
      ...col,
      disableSort: i === 0,
    })),
  } satisfies TableProps<Item>,
};

export const Persitance = {
  args: {
    ...Primary.args,
    persist: { storage: localStorage, id: 'tablePersistance' },
  } satisfies TableProps<Item>,
};

export const HiddenColumns = {
  args: {
    ...Primary.args,
    defaultHiddenColumns: new Set([1, 2]),
    columns: defaultColumns.map((col, i) => ({
      ...col,
      hidden: i === 0 ? false : i === 1 ? true : undefined,
    })),
  } satisfies TableProps<Item>,
};

export const StyledCells = {
  args: {
    ...Primary.args,
    styles: {
      cell: {
        'div:hover > &': {
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
        },
      },
      evenCell: {
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
      },
    },
  } satisfies TableProps<Item>,
};

export const StyleColumnDivider = {
  args: {
    ...Primary.args,
    enableSelection: false,
    enableColumnSelection: false,
    enableExport: false,
    styles: {
      columnDivider: {
        '&:after': {
          display: 'none',
        },
      },
    },
  } satisfies TableProps<Item>,
};

export const ColumnProps = {
  args: {
    ...Primary.args,
    columnProps: (id: Id) =>
      typeof id === 'string' && id.endsWith('_name') ? { styles: { cell: { color: 'red' } } } : {},
  },
};

export const WithDetails = {
  args: {
    ...Primary.args,
    rowDetails: (item: Item) => (
      <div
        css={{
          padding: '3em',
        }}
      >
        Some nice details about {item.first_name} {item.last_name}
      </div>
    ),
    styles: {
      details: {
        color: 'red',
      },
    },
    classes: {
      details: 'foo',
    },
  } satisfies TableProps<Item>,
};
