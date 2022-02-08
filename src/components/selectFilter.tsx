import React, { ReactNode, useState } from 'react';
import { useColumnContext, useFilter, useTheme } from '..';
import { useDebounced } from '../hooks/useDebounced';
import { asString, castArray, defaultEquals, flatMap, uniq } from '../misc/helpers';
import { InternalColumn } from '../types';
import { FormControlLabel } from './formControlLabel';
import { useTableContext } from './table';

export function SelectFilter<T, V, O>({
  options: providedOptions,
  filterBy = (x) => x as unknown as O | O[],
  stringValue = asString,
  render = stringValue,
  compare = defaultEquals,
  value: controlledValue,
  defaultValue = new Set(),
  onChange,
  dependencies = [],
}: {
  options?: O[];
  filterBy?: (value: V, item: T) => O | O[];
  stringValue?: (value: O) => string;
  render?: (value: O) => ReactNode;
  compare?: (a: O, b: O) => boolean;
  value?: Set<O>;
  defaultValue?: Set<O>;
  onChange?: (value: Set<O>) => void;
  dependencies?: any[];
}): JSX.Element {
  const {
    components: { TextField, Button, IconButton, Checkbox },
    icons: { Search, Clear },
    text: { deselectAll, noResults, defaultFilter },
  } = useTheme();

  const table = useTableContext<T>();
  const columnId = useColumnContext();

  const options = table.useState(
    (state) => {
      if (providedOptions) return uniq(providedOptions);

      const column = state.activeColumns.find((column) => column.id === columnId) as InternalColumn<T, V> | undefined;
      if (!column) return [];

      return uniq(flatMap(state.items, (item) => castArray(filterBy(column.value(item), item))));
    },
    [table, columnId, providedOptions],
  );

  const [query, setQuery] = useState('');
  const filtered = options.filter((option) => !query || stringValue(option).toLowerCase().includes(query.toLowerCase()));

  const [stateValue, setStateValue] = useState(defaultValue);
  const value = controlledValue ?? stateValue;
  const debouncedValue = useDebounced(value, 500);

  function update(update: O | Set<O>) {
    let newValue;

    if (update instanceof Set) {
      newValue = update;
    } else {
      newValue = new Set(value);
      if (newValue.has(update)) newValue.delete(update);
      else newValue.add(update);
    }

    if (controlledValue === undefined) {
      setStateValue(newValue);
    }

    onChange?.(newValue);
  }

  useFilter<T, V>(
    {
      id: 'selectFilter',
      test: debouncedValue.size
        ? (value, item) => castArray(filterBy(value, item)).some((x) => [...debouncedValue].some((y) => compare(x, y)))
        : undefined,
      serialize: () => [...value],
      deserialize: (value) => new Set(value),
    },
    [debouncedValue, ...dependencies],
  );

  return (
    <div
      css={{
        padding: 'calc(var(--spacing) * 2)',
        display: 'grid',
        gap: 'var(--spacing)',
      }}
    >
      <div css={{ marginBottom: 'var(--spacing)' }}>{defaultFilter}</div>

      <TextField
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        endIcon={<IconButton onClick={() => setQuery('')}>{!query ? <Search /> : <Clear />}</IconButton>}
        css={{ marginBottom: 'var(--spacing)' }}
      />

      <Button variant="outlined" onClick={() => update(new Set())} disabled={value.size === 0}>
        {deselectAll}
      </Button>

      {filtered.map((option, index) => (
        <FormControlLabel
          key={index}
          control={<Checkbox checked={value.has(option)} onChange={() => update(option)} />}
          label={render(option)}
        ></FormControlLabel>
      ))}

      {filtered.length === 0 && <span css={{ textAlign: 'center' }}>{noResults}</span>}
    </div>
  );
}
