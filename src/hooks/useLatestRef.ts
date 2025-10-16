import { useEffect, useRef } from 'react';

export default function useLatestRef<T>(value: T) {
  const latestValue = useRef(value);

  useEffect(() => {
    latestValue.current = value;
  }, [value]);

  return latestValue;
}
