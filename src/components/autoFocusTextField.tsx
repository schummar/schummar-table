import type { ComponentType } from 'react';
import { useContext, useLayoutEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import type { TableTheme } from '../types';
import { FilterControlContext } from './filterControl';

type Props = TableTheme['components']['TextField'] extends ComponentType<infer T> ? T : never;

export function AutoFocusTextField(props: Omit<Props, 'inputRef'>) {
  const TextField = useTheme((t) => t.components.TextField);

  const ref = useRef<HTMLInputElement>(null);
  const { isActive } = useContext(FilterControlContext);

  useLayoutEffect(() => {
    if (isActive && ref.current) {
      ref.current.focus();
    }
  }, [isActive]);

  return <TextField {...props} inputRef={ref} />;
}
