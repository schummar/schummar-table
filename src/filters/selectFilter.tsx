import type { ReactElement, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { AutoFocusTextField } from '../components/autoFocusTextField';
import { FormControlLabel } from '../components/formControlLabel';
import type { VirtualListProps } from '../components/virtualList';
import { VirtualList } from '../components/virtualList';
import { useTheme } from '../hooks/useTheme';
import { asString, orderBy, toSingles, uniq } from '../misc/helpers';
import type { Filter, FilterComponentProps, FilterOptions, SingleOrMultiple } from '../types';
import { defineFilter } from './defineFilter';

export interface SelectFilterOptions<TFilterBy> {
  /** Which options are provided to select. By default all unique item values are used. */
  options?: TFilterBy[];
  /** String representation of a value. Used to filter options via the text field. */
  stringValue?: (value: TFilterBy) => string;
  /** Render values. By default a string representation of the value is used. */
  render?: (value: TFilterBy) => ReactNode;
  /** If enabled, only one option can be selected at a time. */
  singleSelect?: boolean;
  /** If enabled, the search field is hidden. */
  hideSearchField?: boolean;
  /** If enabled, the reset button is hidden. */
  hideResetButton?: boolean;
  /** Virtual list props.
   * @default true */
  virtual?: VirtualListProps<unknown>['virtual'];
}

function toggle<T>(set: Set<T>, value: T, singleSelect?: boolean) {
  const newSet = new Set(singleSelect ? [] : set);
  if (set.has(value)) {
    newSet.delete(value);
  } else {
    newSet.add(value);
  }

  return newSet;
}

function SelectFilterComponent({
  value: currentValue,
  onChange,
  options: {
    options: providedOptions,
    stringValue = asString,
    render = stringValue,
    singleSelect,
    hideSearchField,
    hideResetButton,
    virtual,
  },
  getValues,
}: FilterComponentProps<unknown, Set<unknown>, SelectFilterOptions<unknown>>): ReactElement {
  const IconButton = useTheme((t) => t.components.IconButton);
  const Checkbox = useTheme((t) => t.components.Checkbox);
  const Button = useTheme((t) => t.components.Button);
  const Search = useTheme((t) => t.icons.Search);
  const Clear = useTheme((t) => t.icons.Clear);
  const deselectAll = useTheme((t) => t.text.deselectAll);
  const noResults = useTheme((t) => t.text.noResults);

  const value = currentValue ?? new Set<unknown>();

  const options = useMemo(
    () => (providedOptions ? uniq(providedOptions) : orderBy(getValues())),
    [providedOptions, getValues],
  );

  const [query, setQuery] = useState('');
  // Selected options come first, as they were when the filter opened.
  const [initialValue] = useState(value);
  const filtered = options.filter(
    (option) => !query || stringValue(option).toLowerCase().includes(query.toLowerCase()),
  );
  const ordered = filtered
    .filter((option) => initialValue.has(option))
    .concat(filtered.filter((option) => !initialValue.has(option)));

  return (
    <div
      css={{
        padding: 'calc(var(--spacing) * 2)',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gap: 'var(--spacing)',
      }}
    >
      {!hideSearchField && (
        <AutoFocusTextField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          endIcon={
            <IconButton onClick={() => setQuery('')}>{!query ? <Search /> : <Clear />}</IconButton>
          }
          css={{ marginBottom: 'var(--spacing)' }}
        />
      )}

      {!hideResetButton && (
        <Button
          disabled={value.size === 0}
          onClick={() => onChange(new Set())}
          variant="outlined"
          css={{
            justifyContent: 'center',
            width: '100%',
            marginBottom: 'var(--spacing)',
            color: 'inherit',
          }}
        >
          {deselectAll}
        </Button>
      )}

      <VirtualList
        items={ordered}
        virtual={virtual}
        css={{
          width: '20em',
          maxWidth: '100%',
          maxHeight: 'min(20em, 50vh)',
          overflow: 'hidden auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
        }}
      >
        {(option, index) => (
          <FormControlLabel
            key={index}
            control={
              <Checkbox
                checked={value.has(option)}
                onChange={() => onChange(toggle(value, option, singleSelect))}
              />
            }
            label={render(option)}
          />
        )}
      </VirtualList>

      {ordered.length === 0 && <span css={{ textAlign: 'center' }}>{noResults}</span>}
    </div>
  );
}

/** Accepts any value; typing `options`, `defaultValue`, `render` etc. narrows it. */
// defineFilter can't make the factory generic, hence the cast.
export const selectFilter = defineFilter<
  SingleOrMultiple<unknown>,
  Set<unknown>,
  SelectFilterOptions<unknown>
>({
  isActive: (value) => value.size > 0,
  test: (value, input) => toSingles(input).some((x) => value.has(x)),
  Component: SelectFilterComponent,
}) as <T>(
  options?: FilterOptions<Set<T>> & SelectFilterOptions<T>,
) => Filter<SingleOrMultiple<T>, Set<T>, SelectFilterOptions<T>>;
