import { Button, Checkbox, FormControlLabel, IconButton, styled, TextField } from '@material-ui/core';
import { Clear, Search } from '@material-ui/icons';
import React, { useState } from 'react';
import { orderBy, uniq } from '../misc/helpers';
import { useColumnContext, useTableContext } from '../table';
import { Filter } from './filterComponent';

export class DefaultFilter<V> extends Set<V> implements Filter<V> {
  filter(value: V): boolean {
    return this.size === 0 || this.has(value);
  }

  isActive(): boolean {
    return this.size > 0;
  }
}

const View = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'grid',

  '& > :first-child': {
    marginBottom: theme.spacing(2),
  },
}));

export function DefaultFilterComponent<T, V>({ options }: { options?: V[] }): JSX.Element {
  const state = useTableContext<T>();
  const column = useColumnContext<T, V>();
  const text = state.useState('props.text');
  const items = state.useState('items');
  const _filter = state.useState((state) => state.filters.get(column.id), [column.id]);
  const filter = _filter instanceof DefaultFilter ? _filter : undefined;
  const [input, setInput] = useState('');

  if (!options) {
    console.log(items);
    options = orderBy(uniq(items.map(column.value).filter((x) => x !== undefined)));
  }
  options = options.concat([...(filter ?? [])].filter((value) => !options?.includes(value)));

  const filtered = options.filter((value) => {
    return !input || column.stringValue(value).toLowerCase().includes(input.toLowerCase());
  });

  function toggle(value: V) {
    const newFilter = new DefaultFilter(filter);
    if (newFilter?.has(value)) newFilter.delete(value);
    else newFilter?.add(value);

    if (!column.filter) {
      state.update((state) => {
        state.filters.set(column.id, newFilter);
      });
    }

    column.onFilterChange?.(newFilter);
  }

  function deselectAll() {
    const newFilter = new DefaultFilter();
    if (!column.filter) {
      state.update((state) => {
        state.filters.set(column.id, newFilter);
      });
    }

    column.onFilterChange?.(newFilter);
  }

  return (
    <View>
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

      <Button variant="outlined" onClick={deselectAll} disabled={!filter?.size}>
        {text?.deselectAll ?? 'Deselect all'}
      </Button>

      {filtered.map((value, index) => {
        return (
          <FormControlLabel
            key={index}
            control={<Checkbox checked={filter?.has(value) ?? false} onChange={() => toggle(value)} />}
            label={column.renderValue(value)}
          />
        );
      })}
    </View>
  );
}
