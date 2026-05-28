'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { useWishlistStore } from '@/lib/wishlist-store';
import { useCartStore } from '@/lib/cart-store';
import { useSession } from 'next-auth/react';

export default function WishlistPage() {
  const [mounted, setMounted] = useState(false);
  const { items, removeItem, clear } = useWishlistStore();
  const { addItem: addToCart } = useCartStore();
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900">Wishlist</h1>
          <p className="mt-0.5 text-sm text-stone-500">
            {items.length === 0
              ? 'No saved items yet'
              : `${items.length} saved item${items.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={clear}
            className="text-xs text-stone-400 underline-offset-2 hover:text-stone-600 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-stone-100 bg-white py-20 text-center shadow-sm">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <svg
              className="h-8 w-8 text-red-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-stone-800">Nothing saved yet</h2>
          <p className="mt-2 max-w-xs text-sm text-stone-500">
            Tap the heart on any product to save it here for later.
          </p>
          <Link
            href="/products"
            className="mt-6 rounded-2xl bg-[#D4860B] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b8720a]"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-2xl border border-stone-100 bg-white p-3 shadow-sm"
            >
              {/* Image */}
              <Link href={`/products/${item.slug}`} className="shrink-0">
                {item.images[0] ? (
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-stone-100" />
                )}
              </Link>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <Link href={`/products/${item.slug}`}>
                  <p className="truncate font-semibold text-stone-900 hover:text-[#D4860B]">
                    {item.name}
                  </p>
                </Link>
                <p className="mt-0.5 text-sm font-bold text-stone-700">
                  ₹{Number(item.price).toLocaleString('en-IN')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 flex-col items-end gap-2">
                <button
                  onClick={() => addToCart(item.id, 1, token).catch(() => {})}
                  className="rounded-xl bg-[#D4860B] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#b8720a]"
                >
                  Add to cart
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-xs text-stone-400 hover:text-red-500"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {/* Sticky CTA */}
          <div className="pt-2">
            <Link
              href="/products"
              className="flex w-full items-center justify-center rounded-2xl border border-stone-200 bg-white py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
