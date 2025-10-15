import type { Meta, StoryObj } from '@storybook/react';
import { Id, Table, TableSettingsProvider, type Column, type TableProps } from '../../src';
import { DatePickerProvider } from '../../src/components/datePicker';
import ExcelExporter from '../../src/exporters/excelExporter';
import data, { type Person } from './_data';
import { defaultColumns, mobileColumn } from './_default';
import css from './styles.module.css';

type Story = StoryObj<typeof meta>;

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof Table<Person>> = {
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
};
export default meta;

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
  } satisfies TableProps<Person>,
};

export const SortDisabledAll = {
  args: {
    ...Primary.args,
    disableSort: true,
  } satisfies TableProps<Person>,
};

export const SortDisabledOne = {
  args: {
    ...Primary.args,
    columns: defaultColumns.map((col, i) => ({
      ...col,
      disableSort: i === 0,
    })),
  } satisfies TableProps<Person>,
};

export const Persitance = {
  args: {
    ...Primary.args,
    persist: { storage: localStorage, id: 'tablePersistance' },
  } satisfies TableProps<Person>,
};

export const HiddenColumns = {
  args: {
    ...Primary.args,
    defaultHiddenColumns: new Set([1, 2]),
    columns: defaultColumns.map((col, i) => ({
      ...col,
      hidden: i === 0 ? false : i === 1 ? true : undefined,
    })),
  } satisfies TableProps<Person>,
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
  } satisfies TableProps<Person>,
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
  } satisfies TableProps<Person>,
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
    rowDetails: (item: Person) => (
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
  } satisfies TableProps<Person>,
};

export const WithNoSpecialColumns = {
  args: {
    ...Primary.args,
    enableSelection: false,
    enableColumnSelection: false,
    enableExport: false,
  } satisfies TableProps<Person>,
};

export const DarkMode = {
  args: {
    ...Primary.args,
    colors: {
      background: '#333',
      text: '#fff',
      border: '#555',
      borderLight: '#444',
    },
  } satisfies TableProps<Person>,
};

export const Subgrid = {
  args: {
    ...Primary.args,
    items: data.slice(0, 10),
    subgrid: true,
    styles: {
      row: {
        '&:hover': {
          background: 'red',
        },
      },
    },
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  args: {
    ...Primary.args,
    items: data.slice(0, 50),
    displaySize: { mobile: 500, desktop: Infinity },
    columns: defaultColumns
      .map<Column<Person, any>>((col) => ({
        ...col,
        displaySize: 'desktop',
      }))
      .concat(mobileColumn),
    styles: {
      popover: {
        marginBottom: '20px',
        zIndex: 100,
      },
    },
  },
};
