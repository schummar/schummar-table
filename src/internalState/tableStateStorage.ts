import { useEffect } from 'react';
import { useTableContext } from '..';
import { Queue } from '../misc/queue';

const KEYS = ['sort', 'selection', 'expanded', 'hiddenColumns'] as const;

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
  const state = useTableContext();

  // On mount: load
  useEffect(() => {
    const { storeState, debug } = state.getState().props;
    if (!storeState) return;

    let isCanceled = false;
    const q = new Queue();

    q.run(async () => {
      try {
        const { storage, id = 'table', include } = storeState;
        const json = await storage.getItem(`${id}_state`);
        if (isCanceled || !json) return;

        const data = JSON.parse(json);

        state.update((state) => {
          for (const key of KEYS) {
            if (!include || include[key]) {
              const value = key === 'sort' ? data.sort : new Set(data[key]);
              state[key] = value;
            }
          }
        });
      } catch (e) {
        debug?.('Failed to load table state:', e);
      }
    });

    state.subscribe(
      (state) => {
        if (!state.props.storeState) return;

        const data: any = {};

        for (const key of KEYS) {
          if (!state.props.storeState.include || state.props.storeState.include[key]) {
            const value = key === 'sort' ? state.sort : Array.from(state[key]);
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

        q.run(async () => {
          await storage.setItem(`${id}_state`, JSON.stringify(data));
        });
      },
    );

    return () => {
      isCanceled = true;
    };
  }, []);
}
