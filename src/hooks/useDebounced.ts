import { useEffect, useState } from 'react';

export function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), ms);
    return () => {
      clearTimeout(handle);
    };
  }, [value]);

  return debounced;
}
