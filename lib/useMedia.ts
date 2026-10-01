'use client';
// Matches a list of media queries to values (from React Bits Masonry, kept after the wall moved to a grid).
import { useLayoutEffect, useState } from 'react';

export const useMedia = (queries: string[], values: number[], defaultValue: number): number => {
  const get = () => {
    if (typeof window === 'undefined') return defaultValue;
    return values[queries.findIndex(q => matchMedia(q).matches)] ?? defaultValue;
  };

  const [value, setValue] = useState<number>(defaultValue);

  useLayoutEffect(() => {
    const handler = () => setValue(get);
    handler();
    queries.forEach(q => matchMedia(q).addEventListener('change', handler));
    return () => queries.forEach(q => matchMedia(q).removeEventListener('change', handler));
  }, [queries]); // eslint-disable-line react-hooks/exhaustive-deps

  return value;
};
