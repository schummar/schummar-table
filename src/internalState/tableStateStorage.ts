import { useEffect, useState } from 'react';
import { useTableContext } from '..';
import { orderBy } from '../misc/helpers';
import { Queue } from '../misc/queue';

const KEYS = ['sort', 'selection', 'expanded', 'hiddenColumns', 'filters', 'columnWidths', 'columnOrder'] as const;

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

export function useTableStateStorage() {
  const table = useTableContext();
  const [isHydrated, setIsHydrated] = useState(false);

  // On mount: load
  useEffect(() => {
    const { storeState } = table.getState().props;
    if (!storeState) {
      setIsHydrated(true);
      return;
    }

    let isCanceled = false;

    (async () => {
      try {
        const { storage, id = 'table', include } = storeState;
        const json = await storage.getItem(`${id}_state`);
        if (isCanceled || !json) return;

        const data = JSON.parse(json);
        table.getState().props.debug?.('load', data);

        table.update((state) => {
          for (const key of KEYS) {
            if (!include || include[key]) {
              let value;
              if (key === 'sort' || key === 'columnOrder') {
                value = data[key];
              } else if (key === 'columnWidths') {
                value = new Map(data[key]);
              } else if (key === 'filters') {
                continue;
              } else {
                value = new Set(data[key]);
              }

              state[key] = value;
            }
          }
        });

        for (const [columId, filter] of table.getState().filters) {
          const serialized = data.filters?.find((x: any) => x.columnId === columId && x.filterId === filter.id);

          if (serialized) {
            table.getState().filters.get(columId)?.deserialize?.(serialized.value);
          }
        }
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

    const q = new Queue();

    return table.subscribe(
      (state) => {
        if (!state.props.storeState) return;

        const data: any = {};

        for (const key of KEYS) {
          if (!state.props.storeState.include || state.props.storeState.include[key]) {
            let value;
            if (key === 'sort' || key === 'columnOrder') {
              value = state[key];
            } else if (key === 'columnWidths') {
              value = [...state[key].entries()];
            } else if (key === 'filters') {
              value = [...state[key].entries()]
                .map(
                  ([columnId, { id, serialize }]) =>
                    serialize && {
                      columnId,
                      filterId: id,
                      value: serialize?.(),
                    },
                )
                .filter(Boolean);
              value = orderBy(value, [(x) => x?.columnId]);
            } else {
              [...state[key]];
            }
            data[key] = value;
          }
        }

        return {
          storage: state.props.storeState.storage,
          id: state.props.storeState.id,
          data,
        };
      },
      (props) => {
        if (!props) return;
        const { storage, id = 'table', data } = props;

        table.getState().props.debug?.('save', data);
        q.run(async () => {
          await storage.setItem(`${id}_state`, JSON.stringify(data));
        }, true);
      },
      { throttle: 1000 },
    );
  }, [isHydrated]);

  return isHydrated;
}
