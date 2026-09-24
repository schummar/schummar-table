import type { ReactElement } from 'react';
import { AutoFocusTextField } from '../components/autoFocusTextField';
import { useTheme } from '../hooks/useTheme';
import { toSingles } from '../misc/helpers';
import type { FilterComponentProps, SingleOrMultiple } from '../types';
import { defineFilter } from './defineFilter';

const compares = {
  contains: (itemValue: string, filterValue: string) =>
    itemValue.toLowerCase().includes(filterValue.toLowerCase()),
  prefix: (itemValue: string, filterValue: string) =>
    itemValue.toLowerCase().startsWith(filterValue.toLowerCase()),
  exact: (itemValue: string, filterValue: string) =>
    itemValue.toLowerCase() === filterValue.toLowerCase(),
};

export interface TextFilterOptions {
  /** How item values are matched, ignoring case. A function gets the item value and the filter
   * value and returns whether they match.
   * @default 'contains'
   */
  compare?: keyof typeof compares | ((itemValue: string, filterValue: string) => boolean);
  placeholder?: string;
  /** Delay in ms before typed text applies.
   * @default 300
   */
  debounce?: number;
}

type TextInput = SingleOrMultiple<string | number | bigint | null | undefined>;

function TextFilterComponent({
  value,
  onChange,
  close,
  options,
}: FilterComponentProps<TextInput, string, TextFilterOptions>): ReactElement {
  const IconButton = useTheme((t) => t.components.IconButton);
  const Search = useTheme((t) => t.icons.Search);
  const Clear = useTheme((t) => t.icons.Clear);

  return (
    <div css={{ padding: `calc(var(--spacing) * 2)`, display: 'grid' }}>
      <AutoFocusTextField
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        onKeyUp={(event) => {
          if (event.key === 'Enter') close();
        }}
        endIcon={
          <IconButton onClick={() => onChange('')}>{!value ? <Search /> : <Clear />}</IconButton>
        }
        placeholder={options.placeholder}
      />
    </div>
  );
}

export const textFilter = defineFilter<TextInput, string, TextFilterOptions>({
  isActive: (value) => !!value,
  test(value, input, { compare = 'contains' }) {
    const match = typeof compare === 'function' ? compare : compares[compare];
    return toSingles(input).some((x) => x !== null && x !== undefined && match(String(x), value));
  },
  debounce: 300,
  Component: TextFilterComponent,
});
