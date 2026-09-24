import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { MantineProvider } from '@mantine/core';
import { createTheme as createMui5Theme, ThemeProvider as Mui5ThemeProvider } from '@mui/material';
import type { Meta } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import {
  DatePicker,
  Table,
  TableSettingsProvider,
  thisWeek,
  type DateRange,
  type TableProps,
} from '../../src';
import { MantineTableThemeProvider } from '../../src/theme/mantineTheme';
import { Mui5TableThemeProvider } from '../../src/theme/mui5Theme';
import data, { type Person } from './_data';
import { defaultColumns } from './_default';

type ColorScheme = 'light' | 'dark';

const mui5Themes = {
  light: createMui5Theme({ palette: { mode: 'light' } }),
  dark: createMui5Theme({ palette: { mode: 'dark' } }),
};

const themes = {
  default: ({ colorScheme, children }: { colorScheme: ColorScheme; children: ReactNode }) => (
    <TableSettingsProvider
      theme={
        colorScheme === 'dark'
          ? { colors: { background: '#333', text: '#fff', border: '#555', borderLight: '#444' } }
          : undefined
      }
    >
      <Page background={colorScheme === 'dark' ? '#333' : '#fff'}>{children}</Page>
    </TableSettingsProvider>
  ),
  mui5: ({ colorScheme, children }: { colorScheme: ColorScheme; children: ReactNode }) => (
    <Mui5ThemeProvider theme={mui5Themes[colorScheme]}>
      <Mui5TableThemeProvider>
        <Page background={mui5Themes[colorScheme].palette.background.default}>{children}</Page>
      </Mui5TableThemeProvider>
    </Mui5ThemeProvider>
  ),
  mantine: ({ colorScheme, children }: { colorScheme: ColorScheme; children: ReactNode }) => (
    <MantineProvider forceColorScheme={colorScheme}>
      <MantineTableThemeProvider>
        <Page background="var(--mantine-color-body)">{children}</Page>
      </MantineTableThemeProvider>
    </MantineProvider>
  ),
};

function Page({ background, children }: { background: string; children: ReactNode }) {
  return <div css={{ background, padding: 16, minHeight: '100vh' }}>{children}</div>;
}

function ThemedTable({
  theme,
  colorScheme,
  ...props
}: TableProps<Person> & { theme: keyof typeof themes; colorScheme: ColorScheme }) {
  const Theme = themes[theme];

  return (
    <Theme colorScheme={colorScheme}>
      <Table {...props} />
    </Theme>
  );
}

const meta: Meta<typeof ThemedTable> = {
  title: 'Themes',
  component: ThemedTable,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    items: { table: { disable: true } },
    theme: { options: Object.keys(themes), control: { type: 'inline-radio' } },
    colorScheme: { options: ['light', 'dark'], control: { type: 'inline-radio' } },
  },
};
export default meta;

const args = {
  items: data,
  id: 'id',
  columns: defaultColumns,
  virtual: true,
  enableExport: true,
  stickyHeader: true,
  fullWidth: 'left',
  colorScheme: 'light' as ColorScheme,
} satisfies Partial<TableProps<Person>> & { colorScheme: ColorScheme };

export const Default = { args: { ...args, theme: 'default' as const } };

export const Mui5 = { args: { ...args, theme: 'mui5' as const } };

export const Mantine = { args: { ...args, theme: 'mantine' as const } };

function ThemedDatePicker({
  theme,
  colorScheme,
}: {
  theme: keyof typeof themes;
  colorScheme: ColorScheme;
}) {
  const Theme = themes[theme];
  const [value, setValue] = useState<Date | DateRange | null>(thisWeek);
  const blocked = thisWeek(1);

  return (
    <Theme colorScheme={colorScheme}>
      <div css={{ display: 'flex', justifyContent: 'center' }}>
        <DatePicker
          value={value}
          onChange={setValue}
          rangeSelect
          showCalendarWeek
          showTime={{ showSeconds: false }}
          blockedRanges={[{ min: blocked.min, max: new Date(blocked.min.getTime() + 2 * 864e5) }]}
          quickOptions={['today', 'thisWeek', 'thisMonth']}
        />
      </div>
    </Theme>
  );
}

const datePickerStory = (theme: keyof typeof themes) => ({
  args: { ...args, theme },
  render: ({ theme, colorScheme }: { theme: keyof typeof themes; colorScheme: ColorScheme }) => (
    <ThemedDatePicker theme={theme} colorScheme={colorScheme} />
  ),
});

export const DefaultDatePicker = datePickerStory('default');

export const Mui5DatePicker = datePickerStory('mui5');

export const MantineDatePicker = datePickerStory('mantine');
