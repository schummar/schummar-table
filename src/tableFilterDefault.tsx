import { Button, Checkbox, FormControlLabel, IconButton, styled, TextField } from '@material-ui/core';
import { Clear, Search } from '@material-ui/icons';
import React, { useState } from 'react';
import { InternalColumn, InternalTableProps, TableScope } from './table';
import { Filter } from './tableFilter';

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

export function DefaultFilterComponent<T, V>({ text, column }: InternalTableProps<T> & { column: InternalColumn<T, V> }): JSX.Element {
  const state = TableScope.useStore();
  const _filter = state.useState((state) => state.filters.get(column.id), [column.id]) ?? column.defaultFilter;
  const filter = _filter instanceof DefaultFilter ? _filter : undefined;

  const [input, setInput] = useState('');

  const filtered = column.filterOptions.filter((value) => {
    return !input || column.stringValue(value).toLowerCase().includes(input.toLowerCase());
  });

  function toggle(value: V) {
    state.update((state) => {
      const newFilter = new DefaultFilter(filter);
      if (newFilter?.has(value)) newFilter.delete(value);
      else newFilter?.add(value);
      state.filters.set(column.id, newFilter);
    });
  }

  function deselectAll() {
    state.update((state) => {
      state.filters.set(column.id, new DefaultFilter());
    });
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
