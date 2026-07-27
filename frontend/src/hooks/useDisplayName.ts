import { useCallback, useState } from 'react';

const STORAGE_KEY = 'wts_display_name';

export function useDisplayName() {
  const [displayName, setDisplayNameState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  );

  const setDisplayName = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 30);
    if (!trimmed) return;
    localStorage.setItem(STORAGE_KEY, trimmed);
    setDisplayNameState(trimmed);
  }, []);

  const clearDisplayName = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setDisplayNameState(null);
  }, []);

  return { displayName, setDisplayName, clearDisplayName };
}
