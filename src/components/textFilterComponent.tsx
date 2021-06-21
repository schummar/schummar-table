import { IconButton, makeStyles, TextField } from '@material-ui/core';
import { Clear, Search } from '@material-ui/icons';
import React, { useEffect, useState } from 'react';
import { subStringMatch } from '../misc/helpers';
import { useColumnContext, useTableContext } from '../table';
import { Filter } from './filterComponent';

export class TextFilter<T> implements Filter<T> {
  constructor(public readonly query: string, public readonly filter: (item: T) => boolean) {}
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

export function TextFilterComponent<T, V>({
  filterBy = String,
  compare = subStringMatch,
}: {
  filterBy?: (value: V, item: T) => string;
  compare?: (a: string, b: string) => boolean;
}): JSX.Element {
  const classes = useClasses();
  const state = useTableContext<T>();
  const column = useColumnContext<T, V>();

  const _filter = state.useState((state) => state.filters.get(column.id), [column.id]) ?? column.defaultFilter;
  const filter = _filter instanceof TextFilter ? _filter : undefined;
  const [input, setInput] = useState<string>();

  useEffect(() => {
    if (input === undefined) return;

    const handle = setTimeout(() => {
      const newFilter = input
        ? new TextFilter<T>(input, (item) => {
            const itemValue = filterBy(column.value(item), item);
            return compare(itemValue, input);
          })
        : undefined;

      if (!column.filter) {
        state.update((state) => {
          if (newFilter) state.filters.set(column.id, newFilter);
          else state.filters.delete(column.id);
        });
      }

      column.onFilterChange?.(newFilter);

      setInput(undefined);
    }, 500);
    return () => clearTimeout(handle);
  }, [input]);

  return (
    <div className={classes.view}>
      <TextField
        value={input ?? filter?.query ?? ''}
        onChange={(e) => setInput(e.target.value)}
        InputProps={{
          endAdornment: filter?.query ? (
            <IconButton onClick={() => setInput('')}>
              <Clear />
            </IconButton>
          ) : (
            <Search />
          ),
        }}
      />
    </div>
  );
}
