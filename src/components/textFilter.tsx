import React from 'react';
import { useFilter } from '../hooks/useFilter';
import { useTheme } from '../hooks/useTheme';
import { asStringOrArray } from '../misc/helpers';
import { textMatch } from '../misc/textMatch';
import { CommonFilterProps } from '../types';

export function TextFilter<T, V>({
  compare = textMatch,
  filterBy = asStringOrArray,
  ...props
}: {
  compare?: (a: string, b: string) => boolean;
} & CommonFilterProps<T, V, string, string>): JSX.Element {
  const {
    components: { TextField, IconButton, Button },
    icons: { Search, Clear },
    text,
  } = useTheme();

  const { value = '', onChange } = useFilter({
    ...props,
    filterBy,

    id: 'textFilter',

    isActive(filterValue) {
      return !!filterValue;
    },

    test(filterValue, value) {
      return compare(value, filterValue);
    },
  });

  return (
    <div
      css={{
        padding: `calc(var(--spacing) * 2)`,
        display: 'grid',
        gap: 'var(--spacing)',
      }}
    >
      <div
        css={{
          marginBottom: 'var(--spacing)',
          display: 'grid',
          gridAutoFlow: 'column',
          gap: 'var(--spacing)',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>{text.textFilter}</div>
        <Button variant="contained" onClick={() => onChange('')} disabled={!value}>
          {text.reset}
        </Button>
      </div>

      <TextField
        value={value}
        onChange={(e) => onChange(e.target.value)}
        endIcon={<IconButton onClick={() => onChange('')}>{!value ? <Search /> : <Clear />}</IconButton>}
      />
    </div>
  );
}
