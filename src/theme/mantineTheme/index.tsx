import { ActionIcon, Button, Checkbox, Indicator, Loader, TextInput } from '@mantine/core';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { TableSettingsProvider } from '../../misc/tableSettings';
import type { PartialTableTheme } from '../../types';
import { Popover } from '../defaultTheme/popover';
import { mergeThemes } from '../tableTheme';
import { MantineDatePicker } from './datePicker';

const buttonVariants = {
  text: 'subtle',
  outlined: 'default',
  contained: 'filled',
} as const;

export const mantineTheme: PartialTableTheme = {
  components: {
    Button: ({ startIcon, variant = 'text', ...props }) => (
      <Button
        {...props}
        variant={buttonVariants[variant]}
        color={variant === 'contained' ? undefined : 'gray'}
        c={variant === 'contained' ? undefined : 'inherit'}
        leftSection={startIcon}
        size="sm"
        justify="flex-start"
      />
    ),
    IconButton: (props) => (
      <ActionIcon
        {...props}
        variant="subtle"
        color="gray"
        c="inherit"
        radius="xl"
        css={{ fontSize: 'var(--mantine-font-size-sm)' }}
      />
    ),
    Checkbox: (props) => (
      <Checkbox {...props} size="xs" css={{ padding: 'calc(var(--spacing) * 1.8)' }} />
    ),
    Popover,
    Badge: ({ badgeContent, children }) => (
      <Indicator label={badgeContent} disabled={!badgeContent} size={16} inline>
        {children}
      </Indicator>
    ),
    TextField: ({ startIcon, endIcon, inputRef, value, ...props }) => (
      <TextInput
        {...props}
        ref={inputRef}
        value={value ?? ''}
        leftSection={startIcon}
        rightSection={endIcon}
        leftSectionPointerEvents="all"
        rightSectionPointerEvents="all"
        size="sm"
      />
    ),
    Spinner: (props) => <Loader {...props} size="sm" />,
    DatePicker: MantineDatePicker,
  },
  // Mantine sets `color-scheme` on :root, so light-dark() follows its color scheme.
  colors: {
    primary: {
      main: 'var(--mantine-primary-color-filled)',
      light: 'var(--mantine-primary-color-4)',
      contrastText: 'var(--mantine-primary-color-contrast)',
    },
    secondary: {
      main: 'var(--mantine-color-gray-filled)',
      light: 'var(--mantine-color-gray-4)',
      contrastText: 'var(--mantine-color-white)',
    },
    blocked: {
      main: 'var(--mantine-color-red-filled)',
      light: 'var(--mantine-color-red-4)',
      contrastText: 'var(--mantine-color-white)',
    },
    background: 'var(--mantine-color-body)',
    text: 'var(--mantine-color-text)',
    border: 'var(--mantine-color-default-border)',
    borderLight: 'light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))',
  },
};

export function MantineTableThemeProvider({
  theme,
  children,
}: {
  theme?: PartialTableTheme;
  children: ReactNode;
}) {
  const _theme = useMemo(() => mergeThemes(mantineTheme, theme ?? {}), [theme]);

  return <TableSettingsProvider theme={_theme}>{children}</TableSettingsProvider>;
}
