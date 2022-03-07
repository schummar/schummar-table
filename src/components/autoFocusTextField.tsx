import { ComponentType, useContext, useLayoutEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { PopoverContext } from '../theme/defaultTheme/popover';
import { TableTheme } from '../types';

type Props = TableTheme['components']['TextField'] extends ComponentType<infer T> ? T : never;

export function AutoFocusTextField(props: Omit<Props, 'inputRef'>) {
  const {
    components: { TextField },
  } = useTheme();

  const ref = useRef<HTMLInputElement>(null);
  const { visible } = useContext(PopoverContext);

  useLayoutEffect(() => {
    if (visible && ref.current) {
      ref.current.focus();
    }
  }, [visible]);

  return <TextField {...props} inputRef={ref} />;
}
