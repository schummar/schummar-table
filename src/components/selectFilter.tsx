import React, { ReactNode, useState } from 'react';
import { useColumnContext, useFilter, useTheme } from '..';
import { asString, castArray, flatMap, uniq } from '../misc/helpers';
import { CommonFilterProps, InternalColumn, SerializableValue } from '../types';
import { AutoFocusTextField } from './autoFocusTextField';
import { FormControlLabel } from './formControlLabel';
import { useTableContext } from './table';

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

    const column = state.activeColumns.find((column) => column.id === columnId) as InternalColumn<T, V> | undefined;
    if (!column) return [];

    return uniq(flatMap(state.items, (item) => castArray(filterBy(column.value(item.value), item.value))));
  });

  const [query, setQuery] = useState('');
  const filtered = options.filter((option) => !query || stringValue(option).toLowerCase().includes(query.toLowerCase()));

  const Button = useTheme((t) => t.components.Button);

  return (
    <div
      css={{
        padding: 'calc(var(--spacing) * 2)',
        display: 'grid',
        gap: 'var(--spacing)',
      }}
    >
      <AutoFocusTextField
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        endIcon={<IconButton onClick={() => setQuery('')}>{!query ? <Search /> : <Clear />}</IconButton>}
        css={{ marginBottom: 'var(--spacing)' }}
      />

      <Button
        disabled={!(value.size > 0)}
        onClick={() => onChange(new Set())}
        variant="outlined"
        css={{ justifyContent: 'center', width: '100%', marginBottom: 'var(--spacing)' }}
      >
        {deselectAll}
      </Button>

      <div css={{ maxHeight: '20em', overflowY: 'auto' }}>
        {filtered.map((option, index) => (
          <FormControlLabel
            key={index}
            control={<Checkbox checked={value.has(option)} onChange={() => onChange(toggle(value, option, singleSelect))} />}
            label={render(option)}
          ></FormControlLabel>
        ))}
      </div>

      {filtered.length === 0 && <span css={{ textAlign: 'center' }}>{noResults}</span>}
    </div>
  );
}
