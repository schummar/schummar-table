import { IconButton, makeStyles, TextField } from '@material-ui/core';
import { Clear, Search } from '@material-ui/icons';
import React, { useEffect, useState } from 'react';
import { asString } from '../misc/helpers';
import { textMatch } from '../misc/textMatch';
import { useColumnContext, useTableContext } from '../table';
import { InternalColumn } from '../types';
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
  filterBy = asString,
  compare = textMatch,
}: {
  filterBy?: (value: V, item: T) => string;
  compare?: (a: string, b: string) => boolean;
}): JSX.Element {
  const classes = useClasses();
  const state = useTableContext<T>();
  const columnId = useColumnContext();

  const _filter = state.useState(
    (state) => {
      const column = state.activeColumns.find((column) => column.id === columnId);
      return state.filters.get(columnId) ?? column?.defaultFilter;
    },
    [columnId],
  );
  const filter = _filter instanceof TextFilter ? _filter : undefined;
  const [input, setInput] = useState<string>();

  useEffect(() => {
    if (input === undefined) return;

    const handle = setTimeout(() => {
      const column = state.getState().activeColumns.find((column) => column.id === columnId) as InternalColumn<T, V> | undefined;
      if (!column) return;

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
            '🔍'
          ),
        }}
      />
    </div>
  );
}
