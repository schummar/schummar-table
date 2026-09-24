import type { ComponentType } from 'react';
import { useLayoutEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import type { TableTheme } from '../types';

type Props = TableTheme['components']['TextField'] extends ComponentType<infer T> ? T : never;

export function AutoFocusTextField(props: Omit<Props, 'inputRef'>) {
  const TextField = useTheme((t) => t.components.TextField);

  const ref = useRef<HTMLInputElement>(null);
  // Filters mount when their popover opens. The popover positions itself first.
  useLayoutEffect(() => {
    const timeout = setTimeout(() => ref.current?.focus());
    return () => clearTimeout(timeout);
  }, []);

  return (
    <TextField
      {...props}
      inputRef={ref}
      css={{
        input: {
          backgroundColor: 'inherit',
          color: 'inherit',
        },
      }}
    />
  );
}
