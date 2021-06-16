import { IconButton, styled, TextField } from '@material-ui/core';
import { Clear, Search } from '@material-ui/icons';
import React from 'react';
import { Filter } from './filterComponent';
import { useColumnContext } from './table';

export class TextFilter<V> implements Filter<V> {
  constructor(public readonly query: string) {}

  filter(_value: V, stringValue: string): boolean {
    return !this.query || stringValue.toLocaleLowerCase().includes(this.query.toLowerCase());
  }

  isActive(): boolean {
    return !!this.query;
  }
}

const View = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'grid',

  '& > :first-child': {
    marginBottom: theme.spacing(2),
  },
}));

export function TextFilterComponent<T, V>(): JSX.Element {
  const { state, column } = useColumnContext<T, V>();
  const _filter = state.useState((state) => state.filters.get(column.id), [column.id]) ?? column.defaultFilter;
  const filter = _filter instanceof TextFilter ? _filter : undefined;

  function update(query: string) {
    state.update((state) => {
      const newFilter = new TextFilter(query);
      state.filters.set(column.id, newFilter);
    });
  }

  return (
    <View>
      <TextField
        value={filter?.query ?? ''}
        onChange={(e) => update(e.target.value)}
        InputProps={{
          endAdornment: filter?.query ? (
            <IconButton onClick={() => update('')}>
              <Clear />
            </IconButton>
          ) : (
            <Search />
          ),
        }}
      />
    </View>
  );
}
