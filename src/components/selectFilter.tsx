import React, { ReactNode, useState } from 'react';
import { useColumnContext, useFilter, useTheme } from '..';
import { asString, castArray, flatMap, uniq } from '../misc/helpers';
import { CommonFilterProps, InternalColumn, SerializableValue } from '../types';
import { FormControlLabel } from './formControlLabel';
import { useTableContext } from './table';

function toggle<T>(set: Set<T>, value: T) {
  const newSet = new Set(set);
  if (newSet.has(value)) {
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
  options?: F[];
  stringValue?: (value: F) => string;
  render?: (value: F) => ReactNode;
  singleSelect?: boolean;
} & CommonFilterProps<T, V, F, Set<F>>): JSX.Element {
  const {
    components: { TextField, Button, IconButton, Checkbox },
    icons: { Search, Clear },
    text,
  } = useTheme();

  const table = useTableContext<T>();
  const columnId = useColumnContext();

  const options = table.useState((state) => {
    if (providedOptions) return uniq(providedOptions);

    const column = state.activeColumns.find((column) => column.id === columnId) as InternalColumn<T, V> | undefined;
    if (!column) return [];

    const filterBy = props.filterBy ?? ((x) => x as unknown as F | F[]);

    return uniq(flatMap(state.items, (item) => castArray(filterBy(column.value(item), item))));
  });

  const [query, setQuery] = useState('');
  const filtered = options.filter((option) => !query || stringValue(option).toLowerCase().includes(query.toLowerCase()));

  const { value = new Set<F>(), onChange } = useFilter({
    ...props,

    id: 'selectFilter',

    isActive(filterValue) {
      return filterValue.size > 0;
    },

    test(filterValue, value) {
      return filterValue.has(value);
    },
  });

  return (
    <div
      css={{
        padding: 'calc(var(--spacing) * 2)',
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
        <div>{text.selectFilter}</div>
        <Button variant="contained" onClick={() => onChange(new Set())} disabled={value.size === 0}>
          {text.reset}
        </Button>
      </div>

      <TextField
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        endIcon={<IconButton onClick={() => setQuery('')}>{!query ? <Search /> : <Clear />}</IconButton>}
        css={{ marginBottom: 'var(--spacing)' }}
      />

      {filtered.map((option, index) => (
        <FormControlLabel
          key={index}
          control={
            <Checkbox checked={value.has(option)} onChange={() => onChange(singleSelect ? new Set([option]) : toggle(value, option))} />
          }
          label={render(option)}
        ></FormControlLabel>
      ))}

      {filtered.length === 0 && <span css={{ textAlign: 'center' }}>{text.noResults}</span>}
    </div>
  );
}
