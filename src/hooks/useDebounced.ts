import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  const ref = useRef(value);

  useLayoutEffect(() => {
    ref.current = value;
  });

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebounced(value);
    }, ms);
    return () => {
      clearTimeout(handle);
    };
  }, [value]);

  const flush = useCallback(() => {
    setDebounced(ref.current);
  }, []);

  return [debounced, flush] as const;
}
