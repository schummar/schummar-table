import { useEffect, useState } from 'react';
import { useTheme } from '../hooks/useTheme';

export function TableLoadingState({ isHydrated }: { isHydrated: boolean }) {
  const [showLoading, setShowLoading] = useState(false);
  const loadingText = useTheme((t) => t.text.loading);

  useEffect(() => {
    const handle = setTimeout(() => setShowLoading(true), 500);
    return () => clearTimeout(handle);
  }, []);

  return !isHydrated && showLoading ? <div>{loadingText}</div> : null;
}
