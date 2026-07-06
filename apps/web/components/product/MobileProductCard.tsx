'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { useCartStore } from '@/lib/cart-store';
import { WishlistButton } from '@/components/wishlist-button';

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  price: string;
  /** Set to show a struck-through original price (sale) */
  originalPrice?: string;
  images: string[];
  unit: string;
  stock: number;
  /** If true, tapping "+" navigates to product page to pick a variant */
  hasVariants?: boolean;
  /** Show "NEW" badge */
  isNew?: boolean;
}

export function MobileProductCard({ product }: { product: ProductCardData }) {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  const [cartState, setCartState] = useState<'idle' | 'loading' | 'done'>('idle');

  const isOnSale = !!product.originalPrice;
  const outOfStock = product.stock === 0;

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;

    // Product has variants — send user to product page to pick one
    if (product.hasVariants) {
      router.push(`/products/${product.slug}`);
      return;
    }

    if (cartState !== 'idle') return;
    setCartState('loading');
    try {
      await addItem(product.id, 1, token);
      setCartState('done');
      setTimeout(() => setCartState('idle'), 1400);
    } catch {
      setCartState('idle');
    }
  }

  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col">
      {/* ── Image ── */}
      <div className="relative w-full">
        <div className="aspect-square w-full overflow-hidden rounded-xl bg-stone-100">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-active:scale-[0.97]"
            />
          ) : (
            <div className="h-full w-full bg-stone-100" />
          )}
        </div>

        {/* NEW / SALE badge — top-left */}
        {(product.isNew || isOnSale) && (
          <span
            className={`absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none tracking-wide text-white ${
              isOnSale ? 'bg-red-500' : 'bg-[#D4860B]'
            }`}
          >
            {isOnSale ? 'SALE' : 'NEW'}
          </span>
        )}

        {/* Out-of-stock dim overlay */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60">
            <span className="rounded-full bg-stone-700/80 px-2.5 py-1 text-[10px] font-bold tracking-wider text-white">
              SOLD OUT
            </span>
          </div>
        )}

        {/* Wishlist — top-right */}
        <div className="absolute right-1.5 top-1.5">
          <WishlistButton
            item={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              images: product.images,
              unit: product.unit,
            }}
            size="sm"
          />
        </div>
      </div>

      {/* ── Info + Add to Cart ── */}
      <div className="mt-2 flex flex-1 flex-col">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-stone-800">
          {product.name}
        </p>

        <div className="mt-1.5 flex items-center justify-between gap-1">
          {/* Price */}
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold text-stone-900">
              ₹{Number(product.price).toLocaleString('en-IN')}
            </span>
            {isOnSale && (
              <span className="mt-0.5 text-[11px] text-stone-400 line-through">
                ₹{Number(product.originalPrice).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Compact add-to-cart / choose options */}
          <button
            onClick={handleAddToCart}
            disabled={outOfStock || cartState === 'loading'}
            aria-label={
              outOfStock ? 'Out of stock' : product.hasVariants ? 'Choose options' : 'Add to cart'
            }
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-150 ${
              outOfStock
                ? 'cursor-not-allowed bg-stone-200 text-stone-400'
                : cartState === 'done'
                  ? 'scale-110 bg-green-500 text-white'
                  : product.hasVariants
                    ? 'bg-stone-800 text-white active:scale-90'
                    : 'bg-[#D4860B] text-white hover:bg-[#b8720a] active:scale-90'
            }`}
          >
            {cartState === 'done' ? (
              /* Checkmark */
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : product.hasVariants ? (
              /* Options arrow */
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              /* Plus */
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
