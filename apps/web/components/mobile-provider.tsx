'use client';

import { createContext, useContext, type ReactNode } from 'react';

import useBreakpoint, { type Breakpoint } from '@/hooks/useBreakpoint';

interface MobileContextValue {
  breakpoint: Breakpoint;
  isMobile: boolean; // xs | sm  (≤ 768px)
  isTablet: boolean; // md       (768–1023px)
  isDesktop: boolean; // lg | xl  (≥ 1024px)
}

const MobileContext = createContext<MobileContextValue>({
  breakpoint: 'lg',
  isMobile: false,
  isTablet: false,
  isDesktop: true,
});

export function MobileProvider({ children }: { children: ReactNode }) {
  const breakpoint = useBreakpoint();

  const value: MobileContextValue = {
    breakpoint,
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl',
  };

  return <MobileContext.Provider value={value}>{children}</MobileContext.Provider>;
}

/** Consume breakpoint state anywhere in the client tree. */
export function useMobile(): MobileContextValue {
  return useContext(MobileContext);
}
