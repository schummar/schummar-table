import React, { ReactNode, useCallback, useState } from 'react';
import { asString, defaultEquals, flatMap, orderBy, uniq } from '../misc/helpers';
import { InternalColumn } from '../types';
import { Filter } from './filterComponent';
import { FormControlLabel } from './formControlLabel';
import { useColumnContext, useTableContext } from './table';

export class DefaultFilter<T, O> implements Filter<T> {
  constructor(public readonly values: Set<O>, public readonly filter: (item: T) => boolean) {}
}

type UnwrapArray<O> = O extends Array<infer S> ? S : O;

export function DefaultFilterComponent<V>(props: {
  options?: UnwrapArray<V>[];
  compare?: (a: UnwrapArray<V>, b: UnwrapArray<V>) => boolean;
  stringValue?: (value: UnwrapArray<V>) => string;
  render?: (value: UnwrapArray<V>) => ReactNode;
}): JSX.Element;
export function DefaultFilterComponent<T, V, O>(props: {
  filterBy?: (value: V, item: T) => O | O[];
  options?: O[];
  compare?: (a: O, b: O) => boolean;
  stringValue?: (value: O) => string;
  render?: (value: O) => ReactNode;
}): JSX.Element;
export function DefaultFilterComponent<T, V, O>({
  filterBy: _filterBy,
  options: _options,
  compare = defaultEquals,
  stringValue = asString,
  render = stringValue,
}: {
  filterBy?: (value: V, item: T) => O | O[];
  options?: O[];
  compare?: (a: O, b: O) => boolean;
  stringValue?: (value: O) => string;
  render?: (value: O) => ReactNode;
}): JSX.Element {
  const state = useTableContext<T>();
  const columnId = useColumnContext();
  const TextField = state.useState((state) => state.theme.components.TextField);
  const Button = state.useState((state) => state.theme.components.Button);
  const IconButton = state.useState((state) => state.theme.components.IconButton);
  const Checkbox = state.useState((state) => state.theme.components.Checkbox);
  const SearchIcon = state.useState((state) => state.theme.icons.Search);
  const ClearIcon = state.useState((state) => state.theme.icons.Clear);
  const deselectAllText = state.useState((state) => state.theme.text.deselectAll);
  const noResultsText = state.useState((state) => state.theme.text.noResults);
  const defaultFilterText = state.useState((state) => state.theme.text.defaultFilter);

  const filterBy: (value: V, item: T) => O[] = useCallback(
    (value, item) => {
      const values = _filterBy ? _filterBy(value, item) : (value as unknown as O);
      return values instanceof Array ? values : [values];
    },
    [_filterBy],
  );

  const { options, filter } = state.useState(
    (state) => {
      const column = state.activeColumns.find((column) => column.id === columnId) as InternalColumn<T, V> | undefined;
      const _filter = state.filters.get(columnId);
      const filter = _filter instanceof DefaultFilter ? _filter : undefined;
      let options = _options ?? orderBy(uniq(flatMap(state.items, (item) => (column ? filterBy(column.value(item), item) : []))));
      if (filter) options = options.concat([...filter.values].filter((value) => !options.includes(value)));

      return { options, filter };
    },
    [_options, columnId, filterBy],
  );

  const [input, setInput] = useState('');
  const filtered = options.filter((option) => !input || stringValue(option).toLowerCase().includes(input.toLowerCase()));

  function toggle(value: O) {
    const column = state.getState().activeColumns.find((column) => column.id === columnId) as InternalColumn<T, V> | undefined;
    if (!column) return;

    const newValues = new Set(filter?.values);
    if (newValues?.has(value)) newValues.delete(value);
    else newValues?.add(value);

    const newFilter =
      newValues.size === 0
        ? undefined
        : new DefaultFilter<T, O>(newValues, (item) => {
            const itemValues = filterBy(column.value(item), item);
            return [...newValues].some((value) => itemValues.some((itemValue) => compare(value, itemValue)));
          });

    if (!column.filter) {
      state.update((state) => {
        if (newFilter) state.filters.set(column.id, newFilter);
        else state.filters.delete(column.id);
      });
    }

    column.onFilterChange?.(newFilter);
  }

  function deselectAll() {
    const column = state.getState().activeColumns.find((column) => column.id === columnId) as InternalColumn<T, V> | undefined;
    if (!column) return;

    if (!column.filter) {
      state.update((state) => {
        state.filters.delete(column.id);
      });
    }

    column.onFilterChange?.();
  }

  return (
    <div
      css={{
        padding: 'calc(var(--spacing) * 2)',
        display: 'grid',
        gap: 'var(--spacing)',
      }}
    >
      <div css={{ marginBottom: 'var(--spacing)' }}>{defaultFilterText}</div>

      <TextField
        value={input}
        onChange={(e) => setInput(e.target.value)}
        endIcon={<IconButton onClick={() => setInput('')}>{!input ? <SearchIcon /> : <ClearIcon />}</IconButton>}
        css={{ marginBottom: 'var(--spacing)' }}
      />

      <Button variant="outlined" onClick={deselectAll} disabled={!filter}>
        {deselectAllText}
      </Button>

      {filtered.map((value, index) => (
        <FormControlLabel
          key={index}
          control={<Checkbox checked={filter?.values.has(value) ?? false} onChange={() => toggle(value)} />}
          label={render(value)}
        ></FormControlLabel>
      ))}

      {filtered.length === 0 && <span css={{ textAlign: 'center' }}>{noResultsText}</span>}
    </div>
  );
}
