import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table, TableSettingsProvider } from '../../src';
import { DatePickerProvider } from '../../src/components/datePicker';
import ExcelExporter from '../../src/exporters/excelExporter';
import css from './styles.module.css';

type Story = StoryObj<typeof meta>;

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof Table<{ id: number; name: string }>> = {
  title: 'Sort',
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

export const CaseSensitivity: Story = {
  args: {
    classes: { table: css.table },
    items: [
      { id: 1, name: 'apple' },
      { id: 2, name: 'Apple' },
      { id: 3, name: 'Banana' },
      { id: 4, name: 'grape' },
      { id: 5, name: 'Orange' },
      { id: 6, name: 'pear' },
    ],
    id: 'id',
    columns: (col) => [
      col((x) => x.name, {
        id: 'name',
        header: 'Name',
      }),
    ],
    fullWidth: 'left',
    defaultSort: [{ columnId: 'name', direction: 'asc' }],
  },
};
