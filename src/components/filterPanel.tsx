import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { debounce } from '../misc/debounce';
import { toSingles, uniq } from '../misc/helpers';
import { useTableStructure } from '../state/context';
import type { InternalColumn } from '../types';

/** Renders a column's filter UI. Changes apply after the filter's `debounce`, or on unmount. */
export function FilterPanel<T>({
  column,
  close,
}: {
  column: InternalColumn<T, unknown>;
  close: () => void;
}): ReactElement | null {
  const { filterValues, items, actions } = useTableStructure<T>();
  const [draft, setDraft] = useState<{ value: unknown }>();
  const { filter } = column;
  const delay = filter?.debounce ?? 0;

  const commit = useMemo(
    () =>
      debounce((value: unknown) => {
        actions.setFilterValue(column.id, value);
        setDraft(undefined);
      }, delay),
    [actions, column.id, delay],
  );

  useEffect(() => () => commit.flush(), [commit]);

  const getValues = useMemo(() => {
    let values: unknown[] | undefined;
    return () =>
      (values ??= uniq(
        items.flatMap((item) =>
          toSingles(column.filterBy(column.value(item.value), item.value) as unknown[]),
        ),
      ));
  }, [items, column]);

  if (!filter) return null;

  function onChange(value: unknown) {
    if (delay > 0) {
      setDraft({ value });
      commit(value);
    } else {
      actions.setFilterValue(column.id, value);
    }
  }

  const { Component } = filter;

  return (
    <Component
      value={draft ? draft.value : filterValues.get(column.id)}
      onChange={onChange}
      close={close}
      options={filter.options}
      getValues={getValues}
    />
  );
}
