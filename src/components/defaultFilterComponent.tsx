import { Button, Checkbox, FormControlLabel, IconButton, makeStyles, TextField } from '@material-ui/core';
import { Clear, Search } from '@material-ui/icons';
import React, { ReactNode, useCallback, useState } from 'react';
import { asString, defaultEquals, flatMap, orderBy, uniq } from '../misc/helpers';
import { useColumnContext, useTableContext } from './table';
import { InternalColumn } from '../types';
import { Filter } from './filterComponent';

export class DefaultFilter<T, O> implements Filter<T> {
  constructor(public readonly values: Set<O>, public readonly filter: (item: T) => boolean) {}
}

const useClasses = makeStyles((theme) => ({
  view: {
    padding: theme.spacing(2),
    display: 'grid',

    '& > :first-child': {
      marginBottom: theme.spacing(2),
    },
  },
}));

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
  const classes = useClasses();
  const state = useTableContext<T>();
  const columnId = useColumnContext();

  const filterBy: (value: V, item: T) => O[] = useCallback(
    (value, item) => {
      const values = _filterBy ? _filterBy(value, item) : (value as unknown as O);
      return values instanceof Array ? values : [values];
    },
    [_filterBy],
  );

  const { text, options, filter } = state.useState(
    (state) => {
      const column = state.activeColumns.find((column) => column.id === columnId) as InternalColumn<T, V> | undefined;
      const _filter = state.filters.get(columnId);
      const filter = _filter instanceof DefaultFilter ? _filter : undefined;
      let options = _options ?? orderBy(uniq(flatMap(state.items, (item) => (column ? filterBy(column.value(item), item) : []))));
      if (filter) options = options.concat([...filter.values].filter((value) => !options.includes(value)));

      return { text: state.props.text, options, filter };
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
    <div className={classes.view}>
      <TextField
        value={input}
        onChange={(e) => setInput(e.target.value)}
        InputProps={{
          endAdornment: input ? (
            <IconButton onClick={() => setInput('')}>
              <Clear />
            </IconButton>
          ) : (
            <Search />
          ),
        }}
      />

      <Button variant="outlined" onClick={deselectAll} disabled={!filter}>
        {text?.deselectAll ?? 'Deselect all'}
      </Button>

      {filtered.map((value, index) => (
        <FormControlLabel
          key={index}
          control={<Checkbox checked={filter?.values.has(value) ?? false} onChange={() => toggle(value)} />}
          label={render(value)}
        />
      ))}
    </div>
  );
}
