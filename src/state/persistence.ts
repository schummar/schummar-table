import { useEffect, useRef, useState } from 'react';
import { Queue } from '../misc/queue';
import type { Id, TableProps } from '../types';

export const PERSIST_KEYS = [
  'sort',
  'selection',
  'expanded',
  'hiddenColumns',
  'filterValues',
  'columnWidths',
] as const;

export type PersistKey = (typeof PERSIST_KEYS)[number];
export type PersistedData = Partial<Record<PersistKey, any>>;

const storageName = (id: string) => `schummar-table_state-v1_${id}`;

export type TableStateStorage = {
  getItem: (key: string) => string | null | Promise<string | null>;
  /** May return a promise. */
  setItem: (key: string, value: string) => unknown;
  /** May return a promise. */
  removeItem: (key: string) => unknown;
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

/** A persisted key, or `{ filterValues: [...] }` for the values of some filters only. */
export type PersistEntry = PersistKey | { filterValues: readonly Id[] };

type Persist = NonNullable<TableProps<any>['persist']>;

const filterIds = (entries: readonly PersistEntry[] | undefined) =>
  entries?.flatMap((entry) => (typeof entry === 'object' ? entry.filterValues : []));

export function isPersisted(persist: Persist, key: PersistKey) {
  const isIncluded =
    !persist.include ||
    persist.include.includes(key) ||
    (key === 'filterValues' && filterIds(persist.include)!.length > 0);
  return isIncluded && !persist.exclude?.includes(key);
}

export function isFilterValuePersisted(persist: Persist, columnId: Id) {
  if (!isPersisted(persist, 'filterValues')) return false;
  const included = persist.include?.includes('filterValues')
    ? undefined
    : filterIds(persist.include);
  return (
    (included === undefined || included.includes(columnId)) &&
    !filterIds(persist.exclude)?.includes(columnId)
  );
}

/**
 * Loads the persisted state once on mount and saves `data` (at most once per second) after that.
 * `data` must already be reduced to what should be saved.
 */
export function usePersistence(
  persist: TableProps<any>['persist'],
  data: PersistedData,
  restore: (data: PersistedData) => void,
  debug?: (...output: any) => void,
) {
  const [isHydrated, setIsHydrated] = useState(!persist);
  const [queue] = useState(() => new Queue());
  const latest = useRef({ persist, data, restore, debug });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastSave = useRef(0);

  useEffect(() => {
    latest.current = { persist, data, restore, debug };
  });

  useEffect(() => {
    const { persist } = latest.current;
    if (!persist) return;

    let isCanceled = false;

    void (async () => {
      try {
        const json = await persist.storage.getItem(storageName(persist.id));
        if (isCanceled || !json) return;

        const data = parse(json);
        latest.current.debug?.('load', json, data);
        latest.current.restore(
          Object.fromEntries(
            PERSIST_KEYS.filter((key) => key in data && isPersisted(persist, key)).map((key) => [
              key,
              data[key],
            ]),
          ),
        );
      } catch (error) {
        console.error('Failed to load table state:', error);
      } finally {
        if (!isCanceled) setIsHydrated(true);
      }
    })();

    return () => {
      isCanceled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated || !latest.current.persist || timer.current) return;

    timer.current = setTimeout(
      () => {
        timer.current = undefined;
        lastSave.current = Date.now();

        const { persist, data, debug } = latest.current;
        if (!persist) return;

        const json = stringify(data);
        debug?.('save', data, json);
        void queue.run(async () => {
          await persist.storage.setItem(storageName(persist.id), json);
        }, true);
      },
      Math.max(0, lastSave.current + 1000 - Date.now()),
    );
  }, [isHydrated, data, queue]);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function clear() {
    clearTimeout(timer.current);
    timer.current = undefined;

    const { persist } = latest.current;
    if (!persist) return;

    await queue.run(async () => {
      await persist.storage.removeItem(storageName(persist.id));
    }, true);
  }

  return [isHydrated, clear] as const;
}
