import { castDraft } from 'immer';
import { useEffect } from 'react';
import type { Store } from 'schummar-state/react';
import { overrides } from '../misc/overrides';
import type { InternalTableState } from '../types';

export function watchDisplaySize<T>(state: Store<InternalTableState<T>>): void {
  useEffect(() => {
    function onResize() {
      state.update((draft) => {
        draft.displaySizePx = window.innerWidth;
      });
    }

    onResize();
    document.defaultView?.addEventListener('resize', onResize);
    return () => document.defaultView?.removeEventListener('resize', onResize);
  }, [state]);

  useEffect(
    () =>
      state.addReaction(
        (state) => ({
          displaySizePx: state.displaySizePx,
          displaySize: state.props.displaySize,
        }),
        ({ displaySizePx, displaySize }, draft) => {
          if (displaySizePx === undefined) {
            return;
          }

          if (typeof displaySize === 'object') {
            const entry = Object.entries(displaySize).find(
              ([, maxWidth]) => maxWidth !== undefined && maxWidth >= displaySizePx,
            );
            draft.displaySize = entry?.[0];
          } else {
            draft.displaySize = displaySize;
          }
        },
      ),
    [state],
  );

  useEffect(
    () =>
      state.addReaction(
        (state) => ({
          props: state.normalizedProps,
          displaySize: state.displaySize,
        }),
        ({ props, displaySize }, draft) => {
          draft.props = castDraft(
            overrides(props, displaySize ? props.displaySizeOverrides?.[displaySize] : undefined),
          );
        },
      ),
    [state],
  );
}
