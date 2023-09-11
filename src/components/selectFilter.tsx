import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useFilter } from '../hooks/useFilter';
import { useTheme } from '../hooks/useTheme';
import { asString, castArray, flatMap, uniq } from '../misc/helpers';
import { useColumnContext, useTableContext } from '../misc/tableContext';
import type { CommonFilterProps, InternalColumn, SerializableValue } from '../types';
import { AutoFocusTextField } from './autoFocusTextField';
import { FormControlLabel } from './formControlLabel';
import type { VirtualListProps } from './virtualList';
import { VirtualList } from './virtualList';

function toggle<T>(set: Set<T>, value: T, singleSelect?: boolean) {
  const newSet = new Set(singleSelect ? [] : set);
  if (set.has(value)) {
    newSet.delete(value);
  } else {
    newSet.add(value);
  }

  return newSet;
}

export function SelectFilter<T, V, F extends SerializableValue>({
  options: providedOptions,
  stringValue = asString,
  render = stringValue,
  singleSelect,
  hideSearchField,
  hideResetButton,
  ...props
}: {
  /** Which options are provided to select. By default all unique item values are used. */
  options?: F[];
  /** String representation of a value. Used to filter options via the text field. */
  stringValue?: (value: F) => string;
  /** Render values. By default a string representation of the value is used. */
  render?: (value: F) => ReactNode;
  /** If enabled, only one option can be selected at a time. */
  singleSelect?: boolean;
  /** If enabled, the search field is hidden. */
  hideSearchField?: boolean;
  /** If enabled, the reset button is hidden. */
  hideResetButton?: boolean;
  /** Virtual list props.
   * @default true */
  virtual?: VirtualListProps<unknown>['virtual'];
} & CommonFilterProps<T, V, F, Set<F>>): JSX.Element {
  const IconButton = useTheme((t) => t.components.IconButton);
  const Checkbox = useTheme((t) => t.components.Checkbox);
  const Search = useTheme((t) => t.icons.Search);
  const Clear = useTheme((t) => t.icons.Clear);
  const deselectAll = useTheme((t) => t.text.deselectAll);
  const noResults = useTheme((t) => t.text.noResults);

  const table = useTableContext<T>();
  const columnId = useColumnContext();

  const {
    value = new Set<F>(),
    onChange,
    filterBy,
    isActive,
  } = useFilter({
    ...props,

    id: 'selectFilter',

    isActive(filterValue) {
      return filterValue.size > 0;
    },

    test(filterValue, value) {
      return filterValue.has(value);
    },
  });

  const options = table.useState((state) => {
    if (providedOptions) return uniq(providedOptions);

    const column = state.activeColumns.find((column) => column.id === columnId) as
      | InternalColumn<T, V>
      | undefined;
    if (!column) return [];

    return uniq(
      flatMap(state.items, (item) => castArray(filterBy(column.value(item.value), item.value))),
    );
  });

  const [query, setQuery] = useState('');
  const filtered = options.filter(
    (option) => !query || stringValue(option).toLowerCase().includes(query.toLowerCase()),
  );
  const delayedValue = useMemo(() => value, [isActive]);
  const ordered = filtered
    .filter((option) => delayedValue.has(option))
    .concat(filtered.filter((option) => !delayedValue.has(option)));

  const Button = useTheme((t) => t.components.Button);

  useEffect(() => {
    setQuery('');
  }, [isActive]);

  return (
    <div
      css={{
        padding: 'calc(var(--spacing) * 2)',
        display: 'grid',
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
          css={{ justifyContent: 'center', width: '100%', marginBottom: 'var(--spacing)' }}
        >
          {deselectAll}
        </Button>
      )}

      <VirtualList
        items={ordered}
        css={{
          width: '20em',
          maxHeight: '20em',
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
          ></FormControlLabel>
        )}
      </VirtualList>

      {ordered.length === 0 && <span css={{ textAlign: 'center' }}>{noResults}</span>}
    </div>
  );
}
