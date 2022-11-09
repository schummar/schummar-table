import { useFilter } from '../hooks/useFilter';
import { useTheme } from '../hooks/useTheme';
import { asStringOrArray } from '../misc/helpers';
import { textMatch } from '../misc/textMatch';
import { CommonFilterProps } from '../types';
import { AutoFocusTextField } from './autoFocusTextField';

export function TextFilter<T, V>({
  compare = textMatch,
  filterBy = asStringOrArray,
  placeholder,
  ...props
}: {
  /** Custom comparison function. Should return true if an item value matches the current filter value.
   * By default a fuzzy text comparison is used.
   */
  compare?: (itemValue: string, filterValue: string) => boolean;
  placeholder?: string;
} & CommonFilterProps<T, V, string, string>): JSX.Element {
  const IconButton = useTheme((t) => t.components.IconButton);
  const Search = useTheme((t) => t.icons.Search);
  const Clear = useTheme((t) => t.icons.Clear);

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
        placeholder={placeholder}
      />
    </div>
  );
}
