import { castDraft } from 'immer';
import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useColumnContext, useTableContext } from '..';
import { FilterControlContext } from '../components/filterControl';
import { debounce } from '../misc/debounce';
import { FilterImplementation, SerializableValue } from '../types';
import { useMemoMap } from './useMemoMap';

export function useFilter<T, V, F, S extends SerializableValue>(impl: FilterImplementation<T, V, F, S>) {
  const table = useTableContext<T>();
  const columnId = useColumnContext();
  const cache = useMemoMap();
  const filterBy = impl.filterBy && cache('', impl.filterBy);

  // Update implementation
  useEffect(() => {
    table.update((state) => {
      if (impl.defaultValue !== undefined) {
        state.filterValues.set(columnId, impl.defaultValue);
      }
    });
  }, []);

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
  const value = table.useState((state) => state.filterValues.get(columnId) as S | undefined);
  const [dirtyValue, setDirtyValue] = useState<S>();
  const implRef = useRef(impl);

  useLayoutEffect(() => {
    implRef.current = impl;
  });

  const delayedUpdate = useMemo(
    () =>
      debounce((value?: S) => {
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

  function onChange(value?: S) {
    setDirtyValue(value);
    delayedUpdate(value);
  }

  useEffect(() => delayedUpdate.flush(), [delayedUpdate]);

  return {
    value: dirtyValue ?? value,
    onChange,
    close: useContext(FilterControlContext),
    filterBy: filterBy ?? ((x) => x as unknown as F | F[]),
  };
}
