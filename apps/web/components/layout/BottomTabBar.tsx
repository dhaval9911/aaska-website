'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { useWishlistStore } from '@/lib/wishlist-store';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AMBER = '#D4860B';
const GRAY = '#9CA3AF';

// ---------------------------------------------------------------------------
// Icons — filled when active, outlined when inactive (24×24 viewBox)
// ---------------------------------------------------------------------------

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  );
}

function ShopIcon({ active }: { active: boolean }) {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  );
}

function WishlistIcon({ active }: { active: boolean }) {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );
}

function AccountIcon({ active }: { active: boolean }) {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

interface TabDef {
  key: string;
  label: string;
  href: string;
  /** href used when not authenticated */
  unauthHref?: string;
  /** match exactly (home) vs startsWith (all others) */
  exact?: boolean;
}

const TABS: TabDef[] = [
  { key: 'home', label: 'Home', href: '/', exact: true },
  { key: 'shop', label: 'Shop', href: '/products' },
  { key: 'wishlist', label: 'Wishlist', href: '/wishlist' },
  {
    key: 'account',
    label: 'Account',
    href: '/profile',
    unauthHref: '/login?callbackUrl=%2Fprofile',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BottomTabBar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isAuthed = status === 'authenticated' && !!session;
  const userName = session?.user?.name ?? session?.user?.email ?? '';
  const initial = userName.charAt(0).toUpperCase();

  // Wishlist count — read after hydration to avoid SSR mismatch
  const [mounted, setMounted] = useState(false);
  const wishlistItems = useWishlistStore((s) => s.items);
  useEffect(() => setMounted(true), []);
  const wishlistCount = mounted ? wishlistItems.length : 0;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex border-t border-stone-200 bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main navigation"
    >
      {TABS.map((tab) => {
        const href = tab.unauthHref && !isAuthed ? tab.unauthHref : tab.href;
        const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        const color = isActive ? AMBER : GRAY;

        return (
          <Link
            key={tab.key}
            href={href}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            // min-h-[44px] satisfies Apple HIG 44×44 pt minimum touch target
            className="relative flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 pb-1 pt-2 transition-colors"
          >
            {/* ── Active indicator: thin pill along top edge ── */}
            <span
              className={`absolute inset-x-5 top-0 h-0.5 rounded-b-full transition-opacity duration-200 ${
                isActive ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ backgroundColor: AMBER }}
            />

            {/* ── Icon ── */}
            <span style={{ color }} className="relative">
              {tab.key === 'account' && isAuthed ? (
                /* User initial circle replaces generic icon when logged in */
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: AMBER }}
                >
                  {initial}
                </span>
              ) : tab.key === 'home' ? (
                <HomeIcon active={isActive} />
              ) : tab.key === 'shop' ? (
                <ShopIcon active={isActive} />
              ) : tab.key === 'wishlist' ? (
                <>
                  <WishlistIcon active={isActive} />
                  {wishlistCount > 0 && (
                    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold leading-none text-white">
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </span>
                  )}
                </>
              ) : (
                <AccountIcon active={isActive} />
              )}
            </span>

            {/* ── Label ── */}
            <span className="text-[10px] font-semibold leading-none" style={{ color }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
