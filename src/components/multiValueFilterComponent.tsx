import { Button, Checkbox, FormControlLabel, IconButton, makeStyles, TextField } from '@material-ui/core';
import { Clear, Search } from '@material-ui/icons';
import React, { useState } from 'react';
import { flatMap, orderBy, uniq } from '../misc/helpers';
import { useColumnContext, useTableContext } from '../table';
import { Filter } from './filterComponent';

export class MultiValueFilter<V> extends Set<V> implements Filter<V[]> {
  filter(values: V[]): boolean {
    return this.size === 0 || values.some((value) => this.has(value));
  }

  isActive(): boolean {
    return this.size > 0;
  }
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

export function MultiValueFilterComponent<T, V>({ options: _options }: { options?: V[] }): JSX.Element {
  const classes = useClasses();
  const state = useTableContext<T>();
  const column = useColumnContext<T, V[]>();
  const { text, options, filter } = state.useState(
    (state) => {
      const _filter = state.filters.get(column.id);
      const filter = _filter instanceof MultiValueFilter ? _filter : undefined;
      let options = _options ?? orderBy(uniq(flatMap(state.items, column.value).filter((x) => x !== undefined)));
      options = options.concat([...(filter ?? [])].filter((value) => !options.includes(value)));

      return { text: state.props.text, options, filter };
    },
    [_options, column],
  );
  const [input, setInput] = useState('');

  const filtered = options.filter((value) => {
    return !input || column.stringValue([value]).toLowerCase().includes(input.toLowerCase());
  });

  function toggle(value: V) {
    const newFilter = new MultiValueFilter(filter);
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
    const newFilter = new MultiValueFilter();
    if (!column.filter) {
      state.update((state) => {
        state.filters.set(column.id, newFilter);
      });
    }

    column.onFilterChange?.(newFilter);
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

      <Button variant="outlined" onClick={deselectAll} disabled={!filter?.size}>
        {text?.deselectAll ?? 'Deselect all'}
      </Button>

      {filtered.map((value, index) => (
        <FormControlLabel
          key={index}
          control={<Checkbox checked={filter?.has(value) ?? false} onChange={() => toggle(value)} />}
          label={column.renderValue([value])}
        />
      ))}
    </div>
  );
}
