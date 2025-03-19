import { castDraft } from 'immer';
import { nanoid } from 'nanoid';
import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FilterControlContext } from '../components/filterControl';
import { debounce } from '../misc/debounce';
import { useColumnContext, useTableContext } from '../misc/tableContext';
import type { FilterImplementation } from '../types';
import { useTableMemo } from './useTableMemo';

export function useFilter<TItem, TColumnValue, TFilterBy, TFilterValue>(
  impl: FilterImplementation<TItem, TColumnValue, TFilterBy, TFilterValue>,
) {
  const table = useTableContext<TItem>();
  const columnId = useColumnContext();
  const cache = useTableMemo();
  const cacheId = useMemo(() => nanoid(), []);
  const filterBy = impl.filterBy && cache(cacheId, impl.filterBy);

  // On mount and reset: Fire onChange
  useEffect(() => {
    if (impl.value === undefined) {
      impl.onChange?.(impl.defaultValue);
    }
  }, [table]);

  // Update implementation
  useEffect(() => {
    table.update((state) => {
      if (impl.defaultValue !== undefined) {
        state.filterValues.set(columnId, impl.defaultValue);
      }
    });
  }, [table]);

  useEffect(() => {
    table.update((state) => {
      state.filters.set(columnId, castDraft({ ...impl, filterBy }));

      if (impl.value !== undefined) {
        state.filterValues.set(columnId, impl.value);
      }
    });

    return () => {
      table.update((state) => {
        state.filters.delete(columnId);
      });
    };
  }, [table, columnId, impl]);

  // Track local value and update it globally after delay
  const value = table.useState(
    (state) => state.filterValues.get(columnId) as TFilterValue | undefined,
  );
  const [dirtyValue, setDirtyValue] = useState<TFilterValue>();
  const implRef = useRef(impl);

  useLayoutEffect(() => {
    implRef.current = impl;
  });

  const delayedUpdate = useMemo(
    () =>
      debounce((value?: TFilterValue) => {
        const { value: controlledValue, onChange } = implRef.current;

        if (controlledValue === undefined) {
          table.update((state) => {
            state.filterValues.set(columnId, value);
          });
        }

        onChange?.(value);
        setDirtyValue(undefined);
      }, 500),
    [table],
  );

  function onChange(value?: TFilterValue) {
    setDirtyValue(value);
    delayedUpdate(value);
  }

  useEffect(() => delayedUpdate.flush(), [delayedUpdate]);

  const context = useContext(FilterControlContext);

  return {
    value: dirtyValue ?? value,
    onChange,
    filterBy: filterBy ?? ((x) => x as unknown as TFilterBy | TFilterBy[]),
    ...context,
  };
}
