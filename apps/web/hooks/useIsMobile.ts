'use client';

import { useEffect, useState } from 'react';

const MOBILE_QUERY = '(max-width: 768px)';

/**
 * SSR-safe hook that returns true when the viewport is mobile-width.
 * Uses window.matchMedia with a change listener so it reacts to resize
 * without a ResizeObserver on every element.
 * Returns false on the server and during the initial hydration pass,
 * then syncs to the real value after mount.
 */
export default function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false); // SSR-safe default

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    setIsMobile(mql.matches); // sync after hydration

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
