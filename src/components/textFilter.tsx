import React from 'react';
import { useFilter } from '../hooks/useFilter';
import { useTheme } from '../hooks/useTheme';
import { asStringOrArray } from '../misc/helpers';
import { textMatch } from '../misc/textMatch';
import { CommonFilterProps } from '../types';
import { AutoFocusTextField } from './autoFocusTextField';

export function TextFilter<T, V>({
  compare = textMatch,
  filterBy = asStringOrArray,
  ...props
}: {
  compare?: (a: string, b: string) => boolean;
} & CommonFilterProps<T, V, string, string>): JSX.Element {
  const {
    components: { IconButton },
    icons: { Search, Clear },
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
      }}
    >
      <AutoFocusTextField
        value={value}
        onChange={(e) => onChange(e.target.value)}
        endIcon={<IconButton onClick={() => onChange('')}>{!value ? <Search /> : <Clear />}</IconButton>}
      />
    </div>
  );
}
