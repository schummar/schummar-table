import { ActionIcon, Button, Checkbox, Indicator, Loader, TextInput } from '@mantine/core';
import type { ReactNode } from 'react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { TableSettingsProvider } from '../../misc/tableSettings';
import type { PartialTableTheme, TableTheme } from '../../types';
import { Popover } from '../defaultTheme/popover';
import { mergeThemes } from '../tableTheme';
import { MantineDatePicker } from './datePicker';

const buttonVariants = {
  text: 'subtle',
  outlined: 'default',
  contained: 'filled',
} as const;

type TextFieldProps =
  TableTheme['components']['TextField'] extends React.ComponentType<infer T> ? T : never;

// Mantine's sections are as wide as the input is tall, so a text label like the range filter's
// "Min" runs into the value. Widen the section to its content when that does not fit.
function MantineTextField({ startIcon, endIcon, inputRef, value, ...props }: TextFieldProps) {
  const startRef = useRef<HTMLSpanElement>(null);
  const [startWidth, setStartWidth] = useState<number>();

  useLayoutEffect(() => {
    const element = startRef.current;
    if (!element) return;

    const observer = new ResizeObserver(() => setStartWidth(element.offsetWidth));
    observer.observe(element);
    return () => observer.disconnect();
  }, [startIcon]);

  return (
    <TextInput
      {...props}
      ref={inputRef}
      value={value ?? ''}
      leftSection={
        startIcon && (
          <span ref={startRef} css={{ display: 'inline-flex', flexShrink: 0 }}>
            {startIcon}
          </span>
        )
      }
      leftSectionWidth={
        startWidth
          ? `max(${startWidth}px, calc(var(--input-height) - calc(0.125rem * var(--mantine-scale))))`
          : undefined
      }
      rightSection={endIcon}
      leftSectionPointerEvents="all"
      rightSectionPointerEvents="all"
      size="sm"
    />
  );
}

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
    Popover: (props) => <Popover {...props} zIndex="var(--mantine-z-index-popover)" />,
    Badge: ({ badgeContent, children }) => (
      // Flex, so the root is as tall as the arrow instead of a whole line box, which pushed the badge out of the cell
      <Indicator
        label={badgeContent}
        disabled={!badgeContent}
        size={16}
        inline
        css={{ display: 'inline-flex' }}
      >
        {children}
      </Indicator>
    ),
    TextField: MantineTextField,
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
  children?: ReactNode;
}) {
  const _theme = useMemo(() => mergeThemes(mantineTheme, theme ?? {}), [theme]);

  return <TableSettingsProvider theme={_theme}>{children}</TableSettingsProvider>;
}
