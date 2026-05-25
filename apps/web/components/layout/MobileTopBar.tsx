'use client';

import Link from 'next/link';

import { CartIcon } from '@/components/cart-icon';

/**
 * Slim top bar for mobile viewports.
 * Intentionally simple: logo + cart only.
 * Navigation lives in BottomTabBar; account actions live there too.
 */
export function MobileTopBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b border-stone-200/80 bg-white/90 px-4 backdrop-blur-xl">
      <Link
        href="/"
        className="text-xl font-black tracking-[0.2em] text-bark"
        aria-label="Aaska home"
      >
        AASKA
      </Link>

      <div className="flex items-center gap-1">
        <CartIcon />
      </div>
    </header>
  );
}
