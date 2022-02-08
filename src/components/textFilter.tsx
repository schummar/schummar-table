import React, { useState } from 'react';
import { useDebounced } from '../hooks/useDebounced';
import { useFilter } from '../hooks/useFilter';
import { useTheme } from '../hooks/useTheme';
import { asStringOrArray, castArray } from '../misc/helpers';
import { textMatch } from '../misc/textMatch';

export function TextFilter<T, V>({
  filterBy = asStringOrArray,
  compare = textMatch,
  value: controlledValue,
  defaultValue = '',
  onChange,
  dependencies = [],
}: {
  filterBy?: (value: V, item: T) => string | string[];
  compare?: (a: string, b: string) => boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  dependencies?: any[];
}): JSX.Element {
  const {
    components: { TextField, IconButton },
    icons: { Search, Clear },
    text: { textFilter },
  } = useTheme();

  const [stateValue, setStateValue] = useState<string>(defaultValue);
  const value = controlledValue ?? stateValue;
  const debouncedValue = useDebounced(value, 500);

  function setValue(value: string) {
    if (controlledValue === undefined) {
      setStateValue(value);
    }

    onChange?.(value);
  }

  useFilter<T, V>(
    {
      id: 'textFilter',
      test: debouncedValue ? (value, item) => castArray(filterBy(value, item)).some((text) => compare(text, debouncedValue)) : undefined,
      serialize: () => value,
      deserialize: setValue,
    },
    [debouncedValue, ...dependencies],
  );

  return (
    <div
      css={{
        padding: `calc(var(--spacing) * 2)`,
        display: 'grid',
        gap: 'var(--spacing)',
      }}
    >
      <div css={{ marginBottom: 'var(--spacing)' }}>{textFilter}</div>

      <TextField
        value={value}
        onChange={(e) => setValue(e.target.value)}
        endIcon={<IconButton onClick={() => setValue('')}>{!value ? <Search /> : <Clear />}</IconButton>}
      />
    </div>
  );
}
