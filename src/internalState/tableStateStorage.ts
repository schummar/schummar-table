import type { Draft } from 'immer';
import { useEffect, useState } from 'react';
import type { Store } from 'schummar-state/react';
import { Queue } from '../misc/queue';
import type { InternalTableState } from '../types';

const KEYS = [
  'sort',
  'selection',
  'expanded',
  'hiddenColumns',
  'filterValues',
  'columnWidths',
  'columnOrder',
] as const;

const storageName = (id: string) => `schummar-table_state-v1_${id}`;

export type TableStateStorage = {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => unknown | Promise<unknown>;
  removeItem: (key: string) => unknown | Promise<unknown>;
} & (
  | {
      keys: () => string[] | Promise<string[]>;
    }
  | {
      length: number | (() => number | Promise<number>);
      key: (keyIndex: number) => string | null | Promise<string | null>;
    }
);

function stringify(value: unknown) {
  function prepare(value: unknown): any {
    if (value instanceof Date) {
      return { __date: value.toJSON() };
    }

    if (value instanceof Set) {
      return { __set: Array.from(value).map(prepare) };
    }

    if (value instanceof Map) {
      return { __map: Array.from(value.entries()).map((entry) => entry.map(prepare)) };
    }

    if (Array.isArray(value)) {
      return value.map(prepare);
    }

    if (value instanceof Object) {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, prepare(v)]));
    }

    return value;
  }

  return JSON.stringify(prepare(value));
}

function parse(value: string) {
  return JSON.parse(value, (_key, value) => {
    if (value instanceof Object && '__date' in value) {
      return new Date(value.__date);
    }

    if (value instanceof Object && '__set' in value) {
      return new Set(value.__set);
    }

    if (value instanceof Object && '__map' in value) {
      return new Map(value.__map);
    }

    return value;
  });
}

export function useTableStateStorage(table: Store<InternalTableState<any>>) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [q] = useState(() => new Queue());

  // On mount: load
  useEffect(() => {
    const { persist } = table.getState().props;
    if (!persist) {
      setIsHydrated(true);
      return;
    }

    let isCanceled = false;

    (async () => {
      try {
        const { storage, id, include, exclude } = persist;
        const json = await storage.getItem(storageName(id));
        if (isCanceled || !json) return;

        const data = parse(json);
        table.getState().props.debug?.('load', json, data);

        // eslint-disable-next-line no-inner-declarations
        function applyUpdate(state: Draft<InternalTableState<any>>, key: (typeof KEYS)[number]) {
          if (
            //
            (!include || include.includes(key)) &&
            !exclude?.includes(key) &&
            key in data
          ) {
            if (key === 'filterValues') {
              for (const [id, value] of data[key]) {
                const filter = state.filters.get(id);

                if (filter && (filter.persist ?? filter.value === undefined)) {
                  state.filterValues.set(id, value);
                  state.filters.get(id)?.onChange?.(value);
                }
              }
            } else {
              if (
                key === 'expanded' ||
                key === 'hiddenColumns' ||
                key === 'selection' ||
                key === 'sort'
              ) {
                if (state.props[key] !== undefined) {
                  return;
                }

                state.props[
                  `on${
                    (key.slice(0, 1).toUpperCase() + key.slice(1)) as Capitalize<typeof key>
                  }Change`
                ]?.(data[key]);
              }

              state[key] = data[key];
            }
          }
        }

        table.update((state) => {
          for (const key of KEYS.filter((key) => key !== 'filterValues')) {
            applyUpdate(state, key);
          }
        });

        // First apply other keys and wait until changes take effect. Filters cannot be applied to hidden columns.
        await new Promise((resolve) => {
          setTimeout(resolve);
        });
        table.update((state) => applyUpdate(state, 'filterValues'));
      } catch (error) {
        console.error('Failed to load table state:', error);
      } finally {
        setIsHydrated(true);
      }
    })();

    return () => {
      isCanceled = true;
    };
  }, [table]);

  // After isHydrated, watch and save state
  useEffect(() => {
    if (!isHydrated) return;

    return table.subscribe(
      (state) => {
        if (!state.props.persist) return;

        const { storage, id, include, exclude } = state.props.persist;
        const data: any = {};

        for (const key of KEYS) {
          if (
            //
            (!include || include.includes(key)) &&
            !exclude?.includes(key)
          ) {
            if (key === 'filterValues') {
              data[key] = new Map();
              for (const [id, value] of state.filterValues) {
                if (state.filters.get(id)?.persist ?? state.filters.get(id)?.value === undefined) {
                  data.filterValues.set(id, value);
                }
              }
            } else {
              if (
                (key === 'expanded' ||
                  key === 'hiddenColumns' ||
                  key === 'selection' ||
                  key === 'sort') &&
                state.props[key] !== undefined
              ) {
                continue;
              }

              data[key] = state[key];
            }
          }
        }

        return { storage, id, data };
      },
      (props) => {
        if (!props) return;
        const { storage, id, data } = props;

        table.getState().props.debug?.('save', data, stringify(data));
        q.run(async () => {
          await storage.setItem(storageName(id), stringify(data));
        }, true);
      },
      { throttle: 1000 },
    );
  }, [table, isHydrated]);

  async function clear() {
    await q.run(async () => {
      const persist = table.getState().props.persist;
      if (!persist) {
        return;
      }

      const { storage, id } = persist;
      await storage.removeItem(storageName(id));

      setIsHydrated(false);
      q.clear();
    });
  }

  return [isHydrated, clear] as const;
}
