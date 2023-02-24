import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import type { TableTheme } from '../types';

type TextFieldProps = TableTheme['components']['TextField'] extends React.ComponentType<infer T>
  ? T
  : never;

export interface NumberFieldProps extends Omit<TextFieldProps, 'value' | 'onChange'> {
  value?: number | null;
  onChange?: (value: number | null) => void;
}

const Pattern = /^-?\d*(?:[.,]\d*)?$/;

const printNumber = (value: number | null, locale?: string) => {
  if (value === null) {
    return '';
  }

  return value.toLocaleString(locale);
};

const parseNumber = (value: string) => {
  if (value === '') {
    return null;
  }

  const asNumber = Number(value.replace(',', '.'));
  return Number.isNaN(asNumber) ? null : asNumber;
};

export function NumberField({
  value: commitedValue = null,
  onChange,
  ...textFieldProps
}: NumberFieldProps) {
  const locale = useTheme((t) => t.locale);
  const TextField = useTheme((t) => t.components.TextField);
  const [value = printNumber(commitedValue, locale), setValue] = useState<string>();

  return (
    <TextField
      value={value}
      onChange={(event) => {
        if (Pattern.test(event.target.value)) {
          setValue(event.target.value);
        }
      }}
      onBlur={() => {
        onChange?.(parseNumber(value));
        setValue(undefined);
      }}
      {...textFieldProps}
    />
  );
}
