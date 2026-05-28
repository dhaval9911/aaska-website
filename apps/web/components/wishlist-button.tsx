'use client';

import { useEffect, useState } from 'react';

import { type WishlistItem, useWishlistStore } from '@/lib/wishlist-store';

interface WishlistButtonProps {
  item: WishlistItem;
  /** 'sm' = compact (product card), 'md' = standard (product detail) */
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Heart toggle button — adds/removes a product from the local wishlist.
 * Renders nothing during SSR to avoid hydration mismatch (persist store
 * initialises from localStorage only on the client).
 */
export function WishlistButton({ item, size = 'sm', className = '' }: WishlistButtonProps) {
  const [mounted, setMounted] = useState(false);
  const { toggle, hasItem } = useWishlistStore();

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const saved = hasItem(item.id);

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const btnSize = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(item);
      }}
      aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={saved}
      className={`flex items-center justify-center rounded-full border transition-all ${
        saved
          ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
          : 'border-stone-200 bg-white text-stone-400 hover:border-red-200 hover:text-red-400'
      } ${btnSize} ${className}`}
    >
      <svg
        className={iconSize}
        viewBox="0 0 24 24"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
}
