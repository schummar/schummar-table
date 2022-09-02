import { useEffect, useState } from 'react';
import { Store } from 'schummar-state/react';
import { Queue } from '../misc/queue';
import { InternalTableState, SerializableValue } from '../types';

const KEYS = ['sort', 'selection', 'expanded', 'hiddenColumns', 'filterValues', 'columnWidths', 'columnOrder'] as const;

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

function stringify(value: SerializableValue) {
  function prepare(value: SerializableValue): any {
    if (value instanceof Date) {
      return { __date: value.toJSON() };
    }

    if (value instanceof Set) {
      return { __set: Array.from(value).map(prepare) };
    }

    if (value instanceof Map) {
      return { __map: Array.from(value.entries()).map((entry) => entry.map(prepare)) };
    }

    if (value instanceof Array) {
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

        table.update((state) => {
          for (const key of KEYS) {
            if (
              //
              (!include || include.includes(key)) &&
              !exclude?.includes(key) &&
              key in data
            ) {
              if (key === 'filterValues') {
                for (const [id, value] of data[key]) {
                  if (state.filters.get(id)?.persist ?? state.filters.get(id)?.value === undefined) {
                    state.filterValues.set(id, value);
                  }
                }
              } else {
                if (key === 'expanded' || key === 'hiddenColumns' || key === 'selection' || key === 'sort') {
                  if (state.props[key] !== undefined) {
                    continue;
                  }

                  state.props[`on${(key.slice(0, 1).toUpperCase() + key.slice(1)) as Capitalize<typeof key>}Change`]?.(data[key]);
                }

                state[key] = data[key];
              }
            }
          }
        });
      } catch (e) {
        console.error('Failed to load table state:', e);
      } finally {
        setIsHydrated(true);
      }
    })();

    return () => {
      isCanceled = true;
    };
  }, []);

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
                key === 'expanded' ||
                key === 'hiddenColumns' ||
                key === 'selection' ||
                (key === 'sort' && state.props[key] !== undefined)
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
  }, [isHydrated]);

  async function clear() {
    await q.run(async () => {
      const persist = table.getState().props.persist;
      if (!persist) {
        return;
      }

      const { storage } = persist;
      const keys =
        'keys' in storage
          ? await storage.keys()
          : await Promise.all(
              Array(storage.length)
                .fill(0)
                .map((_x, i) => storage.key(i)),
            );

      for (const key of keys) {
        if (key !== null) {
          await storage.removeItem(key);
        }
      }

      q.clear();
    });
  }

  return [isHydrated, clear] as const;
}
