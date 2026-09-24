import { useEffect, useRef, useState } from 'react';

/**
 * State that can be controlled through a prop. Setting it reports the new value and only stores
 * it when uncontrolled, like a React <input>.
 */
export function useControllableState<V>(
  controlled: V | undefined,
  initial: () => V,
  onChange: ((value: V) => void) | undefined,
) {
  const [internal, setInternal] = useState(initial);
  const value = controlled ?? internal;

  const latest = useRef({ controlled, onChange });
  useEffect(() => {
    latest.current = { controlled, onChange };
  });

  const [set] = useState(() => (next: V) => {
    latest.current.onChange?.(next);
    if (latest.current.controlled === undefined) {
      setInternal(next);
    }
  });

  return [value, set, setInternal] as const;
}

/**
 * Keeps a state normalized: renders use the normalized value right away, and an effect writes it
 * back (reporting it like any other change) when it differs. `normalize` must return its input
 * unchanged when there is nothing to fix, or this loops.
 */
export function useNormalized<V>(value: V, normalized: V, set: (value: V) => void) {
  useEffect(() => {
    if (normalized !== value) {
      set(normalized);
    }
  }, [value, normalized, set]);

  return normalized;
}
