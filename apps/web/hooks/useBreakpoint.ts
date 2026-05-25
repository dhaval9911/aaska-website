'use client';

import { useEffect, useState } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Matches Tailwind default breakpoints
const THRESHOLDS: [Breakpoint, number][] = [
  ['xl', 1280],
  ['lg', 1024],
  ['md', 768],
  ['sm', 640],
  ['xs', 0],
];

function resolveBreakpoint(width: number): Breakpoint {
  for (const [bp, min] of THRESHOLDS) {
    if (width >= min) return bp;
  }
  return 'xs';
}

/**
 * SSR-safe hook that returns the current Tailwind breakpoint.
 * Defaults to 'lg' on the server / initial hydration (desktop-first),
 * then immediately corrects itself on the client after mount.
 */
export default function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');

  useEffect(() => {
    const update = () => setBreakpoint(resolveBreakpoint(window.innerWidth));
    update(); // sync after hydration

    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);

  return breakpoint;
}
