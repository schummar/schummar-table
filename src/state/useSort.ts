import { useMemo } from 'react';
import type { InternalColumn, InternalTableProps } from '../types';
import { useControllableState, useNormalized } from './useControllableState';

type Criterion<T> = {
  key: (item: T) => unknown;
  direction: 1 | -1;
  collator: Intl.Collator;
};

const collators = new Map<string, Intl.Collator>();

function getCollator(locale: string | undefined, options: Intl.CollatorOptions | undefined) {
  const cacheKey = `${locale}|${JSON.stringify(options)}`;
  let collator = collators.get(cacheKey);
  if (!collator) {
    collator = new Intl.Collator(locale, options);
    collators.set(cacheKey, collator);
  }
  return collator;
}

export function useSort<T>(
  props: InternalTableProps<T>,
  activeColumns: InternalColumn<T, unknown>[],
) {
  const [value, setSort, setSortInternal] = useControllableState(
    props.sort,
    () => props.defaultSort ?? [],
    props.onSortChange,
  );

  const normalized = useMemo(() => {
    const filtered = value.filter((s) => activeColumns.some((column) => column.id === s.columnId));
    return filtered.length === value.length ? value : filtered;
  }, [value, activeColumns]);

  const sort = useNormalized(value, normalized, setSort);

  const criteria = useMemo(() => {
    if (props.externalSort) return [];

    return sort.flatMap((s): Criterion<T>[] => {
      const column = activeColumns.find((column) => column.id === s.columnId);
      if (!column) return [];

      return column.sortBy.map((sortBy) => ({
        key: (item: T) => sortBy(column.value(item), item),
        direction: s.direction === 'desc' ? -1 : 1,
        collator: getCollator(s.locale ?? props.locale, s.options),
      }));
    });
  }, [sort, activeColumns, props.externalSort, props.locale]);

  return { sort, setSort, setSortInternal, criteria };
}

/** Stable sort that evaluates each sort key once per item instead of once per comparison. */
export function sortBy<R>(records: R[], criteria: Criterion<any>[], getValue: (record: R) => any) {
  if (criteria.length === 0) return records;

  const keys = criteria.map((criterion) =>
    records.map((record) => criterion.key(getValue(record))),
  );
  const indices = records.map((_, index) => index);

  indices.sort((a, b) => {
    for (let i = 0; i < criteria.length; i++) {
      const { direction, collator } = criteria[i]!;
      const x = keys[i]![a];
      const y = keys[i]![b];

      if (typeof x === 'string' && typeof y === 'string') {
        const result = collator.compare(x, y);
        if (result !== 0) return result * direction;
        continue;
      }

      if ((x as any) > (y as any)) return direction;
      if ((x as any) < (y as any)) return -direction;
    }
    return a - b;
  });

  return indices.map((index) => records[index]!);
}
