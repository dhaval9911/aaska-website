'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { cartCount, useCartStore } from '@/lib/cart-store';
import { useCategoryDrawer } from '@/components/context/CategoryDrawerContext';
import { MobileSearchOverlay } from './MobileSearchOverlay';

export function MobileTopBar() {
  const { setOpen: openCategoryDrawer } = useCategoryDrawer();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Cart state
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const { items, fetchCart, openCart } = useCartStore();
  const count = cartCount(items);

  // Hydrate cart on mount (mirrors CartIcon behaviour for mobile shell)
  useEffect(() => {
    fetchCart(token);
  }, [token, fetchCart]);

  // Deepen shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 h-14 transition-shadow duration-200 ${
          scrolled ? 'shadow-md' : 'shadow-sm'
        }`}
        style={{ backgroundColor: '#FAFAF8' }}
      >
        <div className="relative flex h-full items-center px-2">
          {/* ── Left: hamburger ── */}
          <button
            onClick={() => openCategoryDrawer(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition active:bg-stone-100"
            aria-label="Open categories menu"
          >
            <svg
              className="h-5 w-5 text-[#D4860B]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* ── Centre: logo (absolutely centred so it never shifts) ── */}
          <div className="pointer-events-none absolute inset-x-0 flex justify-center">
            <Link
              href="/"
              className="pointer-events-auto text-lg font-black tracking-wide text-bark"
              aria-label="Resin Dreams home"
            >
              Resin Dreams
            </Link>
          </div>

          {/* ── Right: search + cart ── */}
          <div className="ml-auto flex items-center gap-0.5">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl transition active:bg-stone-100"
              aria-label="Search products"
            >
              <svg
                className="h-5 w-5 text-[#D4860B]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="m21 21-4.35-4.35" />
              </svg>
            </button>

            {/* Cart */}
            <button
              onClick={openCart}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl transition active:bg-stone-100"
              aria-label={`Open cart${count > 0 ? ` — ${count} items` : ''}`}
            >
              <svg
                className="h-5 w-5 text-[#D4860B]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 11H4L5 9z"
                />
              </svg>
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <MobileSearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
