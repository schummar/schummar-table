import { castDraft } from 'immer';
import { useEffect } from 'react';
import type { Store } from 'schummar-state/react';
import { overrides } from '../misc/overrides';
import type { InternalTableState } from '../types';

const DEFAULT_DISPLAY_SIZES = {
  mobile: 400,
  desktop: Infinity,
};

export function watchDisplaySize<T>(state: Store<InternalTableState<T>>): void {
  useEffect(
    () =>
      state.addReaction(
        (state) => ({
          displaySizePx: state.displaySizePx,
          displaySize: state.props.displaySize,
        }),
        ({ displaySizePx, displaySize = DEFAULT_DISPLAY_SIZES }, draft) => {
          if (displaySizePx === undefined) {
            return;
          }

          if (typeof displaySize === 'object') {
            const entry = Object.entries(displaySize).find(
              ([, maxWidth]) => maxWidth >= displaySizePx,
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
