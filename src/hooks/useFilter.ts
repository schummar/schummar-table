import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FilterControlContext } from '../components/filterControl';
import { debounce } from '../misc/debounce';
import { useColumnContext, useTableStructure } from '../state/context';
import type { FilterImplementation } from '../types';

const identity = (x: unknown) => x;

export function useFilter<TItem, TColumnValue, TFilterBy, TFilterValue>(
  impl: FilterImplementation<TItem, TColumnValue, TFilterBy, TFilterValue>,
) {
  const { filterValues, actions } = useTableStructure<TItem>();
  const columnId = useColumnContext();

  const implRef = useRef(impl);
  useLayoutEffect(() => {
    implRef.current = impl;
  });

  // Before registering: registration may apply a persisted value and report it, which must win.
  useEffect(() => {
    if (impl.value === undefined) {
      impl.onChange?.(impl.defaultValue);
    }
  }, [actions]);

  // Registering renders the table, which renders this component again: register once with a
  // stable proxy instead of the per-render impl, or this loops.
  useEffect(() => {
    const proxy: FilterImplementation<TItem, TColumnValue, TFilterBy, TFilterValue> = {
      get id() {
        return implRef.current.id;
      },
      get value() {
        return implRef.current.value;
      },
      get defaultValue() {
        return implRef.current.defaultValue;
      },
      get external() {
        return implRef.current.external;
      },
      get persist() {
        return implRef.current.persist;
      },
      get classNames() {
        return implRef.current.classNames;
      },
      get filterBy() {
        return implRef.current.filterBy;
      },
      isActive: (filterValue) => implRef.current.isActive(filterValue),
      test: (filterValue, value) => implRef.current.test(filterValue, value),
      onChange: (value) => implRef.current.onChange?.(value),
    };

    return actions.registerFilter(columnId, proxy);
  }, [actions, columnId]);

  useEffect(() => {
    actions.syncControlledFilterValue(columnId, impl.value);
  }, [actions, columnId, impl.value]);

  const value = filterValues.get(columnId) as TFilterValue | undefined;
  const [dirtyValue, setDirtyValue] = useState<TFilterValue>();

  const delayedUpdate = useMemo(
    () =>
      debounce((value?: TFilterValue) => {
        actions.setFilterValue(columnId, value);
        setDirtyValue(undefined);
      }, 500),
    [actions, columnId],
  );

  function onChange(value?: TFilterValue) {
    setDirtyValue(value);
    delayedUpdate(value);
  }

  useEffect(() => () => delayedUpdate.flush(), [delayedUpdate]);

  const context = useContext(FilterControlContext);

  return {
    value: dirtyValue ?? value,
    onChange,
    filterBy: impl.filterBy ?? (identity as (value: TColumnValue) => TFilterBy | TFilterBy[]),
    ...context,
  };
}
