import { useFilter } from '../hooks/useFilter';
import { useTheme } from '../hooks/useTheme';
import { asStringOrArray } from '../misc/helpers';
import type { CommonFilterProps } from '../types';
import { AutoFocusTextField } from './autoFocusTextField';

export function substringCompare(itemValue: string, filterValue: string): boolean {
  return itemValue.toLowerCase().includes(filterValue.toLowerCase());
}

export function prefixCompare(itemValue: string, filterValue: string): boolean {
  return itemValue.toLowerCase().includes(filterValue.toLowerCase());
}

export function exactCompare(itemValue: string, filterValue: string): boolean {
  return itemValue.toLowerCase() === filterValue.toLowerCase();
}

export function TextFilter<TItem, TColumnValue>({
  compare = substringCompare,
  filterBy = asStringOrArray,
  placeholder,
  ...props
}: {
  /** Custom comparison function. Should return true if an item value matches the current filter value.
   * By default a fuzzy text comparison is used.
   */
  compare?: (itemValue: string, filterValue: string) => boolean;
  placeholder?: string;
} & CommonFilterProps<TItem, TColumnValue, string, string>): JSX.Element {
  const IconButton = useTheme((t) => t.components.IconButton);
  const Search = useTheme((t) => t.icons.Search);
  const Clear = useTheme((t) => t.icons.Clear);

  const {
    value = '',
    onChange,
    close,
  } = useFilter({
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
        onChange={(event) => onChange(event.target.value)}
        onKeyUp={(event) => {
          if (event.key === 'Enter') {
            close();
          }
        }}
        endIcon={
          <IconButton onClick={() => onChange('')}>{!value ? <Search /> : <Clear />}</IconButton>
        }
        placeholder={placeholder}
      />
    </div>
  );
}
