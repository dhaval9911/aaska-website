'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

import { cartCount, useCartStore } from '@/lib/cart-store';

export function CartIcon() {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;

  const { items, fetchCart, openCart } = useCartStore();
  const count = cartCount(items);

  // Hydrate cart on mount
  useEffect(() => {
    fetchCart(token);
  }, [token, fetchCart]);

  return (
    <button
      onClick={openCart}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
      aria-label={`Open cart${count > 0 ? ` (${count} items)` : ''}`}
    >
      <svg
        className="h-4.5 w-4.5"
        fill="none"
        viewBox="0 0 24 24"
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
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-bark px-0.5 text-[10px] font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
