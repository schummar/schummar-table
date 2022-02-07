import React, { useEffect, useState } from 'react';
import { asString } from '../misc/helpers';
import { textMatch } from '../misc/textMatch';
import { InternalColumn } from '../types';
import { Filter } from './filterComponent';
import { useColumnContext, useTableContext } from './table';

export class TextFilter<T> implements Filter<T> {
  constructor(public readonly query: string, public readonly filter: (item: T) => boolean) {}
}

export function TextFilterComponent<T, V>({
  filterBy = asString,
  compare = textMatch,
}: {
  filterBy?: (value: V, item: T) => string;
  compare?: (a: string, b: string) => boolean;
}): JSX.Element {
  const state = useTableContext<T>();
  const columnId = useColumnContext();
  const TextField = state.useState((state) => state.theme.components.TextField);
  const IconButton = state.useState((state) => state.theme.components.IconButton);
  const SearchIcon = state.useState((state) => state.theme.icons.Search);
  const ClearIcon = state.useState((state) => state.theme.icons.Clear);

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
    <div
      css={{
        padding: `calc(var(--spacing) * 2)`,
        display: 'grid',
      }}
    >
      <TextField
        value={input ?? filter?.query ?? ''}
        onChange={(e) => setInput(e.target.value)}
        endIcon={<IconButton onClick={() => setInput('')}>{!(input ?? filter?.query) ? <SearchIcon /> : <ClearIcon />}</IconButton>}
      />
    </div>
  );
}
