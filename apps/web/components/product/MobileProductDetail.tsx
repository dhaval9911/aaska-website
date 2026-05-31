'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { appConfig } from '@aaska/config';

import { useCartStore } from '@/lib/cart-store';
import { WishlistButton } from '@/components/wishlist-button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface MobileProductDetailProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: string;
    stock: number;
    unit: string;
    images: string[];
    category: Category;
    createdAt: string;
  };
}

// ---------------------------------------------------------------------------
// Image carousel (CSS scroll-snap, no library)
// ---------------------------------------------------------------------------

function ImageCarousel({
  images,
  name,
  onBack,
}: {
  images: string[];
  name: string;
  onBack: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.offsetWidth);
    setActiveIdx(idx);
  }

  function scrollTo(idx: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.offsetWidth, behavior: 'smooth' });
  }

  const imgs = images.length > 0 ? images : [null];

  return (
    <div className="relative w-full">
      {/* Scroll container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-scroll"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {imgs.map((src, i) => (
          <div key={i} className="min-w-full snap-center" style={{ scrollSnapAlign: 'center' }}>
            {src ? (
              <img
                src={src}
                alt={i === 0 ? name : ''}
                className="aspect-square w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="aspect-square w-full bg-stone-100" />
            )}
          </div>
        ))}
      </div>

      {/* Overlaid: back button (top-left) */}
      <button
        onClick={onBack}
        className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-stone-700 shadow backdrop-blur-sm transition active:bg-white"
        aria-label="Go back"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Dot indicators (bottom center) */}
      {imgs.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5">
          {imgs.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`Image ${i + 1}`}
              className={`rounded-full transition-all duration-200 ${
                i === activeIdx ? 'h-2 w-5 bg-white shadow' : 'h-2 w-2 bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Accordion item
// ---------------------------------------------------------------------------

function AccordionItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-stone-100">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-3.5 text-left text-sm font-semibold text-stone-800"
      >
        {title}
        <svg
          className={`h-4 w-4 flex-shrink-0 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="pb-4 text-sm text-stone-500 leading-relaxed">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MobileProductDetail({ product }: MobileProductDetailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const [qty, setQty] = useState(1);
  const [descExpanded, setDescExpanded] = useState(false);
  const [cartState, setCartState] = useState<'idle' | 'loading' | 'done'>('idle');

  const inStock = product.stock > 0;
  const maxQty = 10;
  const price = Number(product.price);

  // Build WhatsApp order link
  const waText = encodeURIComponent(
    `Hi Resin Dreams! I'd like to order *${product.name}* (Qty: ${qty}) — ₹${(price * qty).toLocaleString('en-IN')}. Can you help?`,
  );
  const waLink = `https://wa.me/${appConfig.businessWhatsapp}?text=${waText}`;

  async function handleAddToCart() {
    if (cartState === 'loading' || !inStock) return;
    setCartState('loading');
    try {
      await addItem(product.id, qty, token);
      setCartState('done');
      openCart();
      setTimeout(() => setCartState('idle'), 2000);
    } catch {
      setCartState('idle');
    }
  }

  const wishlistItem = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    images: product.images,
    unit: product.unit,
  };

  const isLongDesc = product.description?.length > 160;

  return (
    /* Main scroll area — bottom is padded for the sticky action bar */
    <div className="pb-36">
      {/* ── 1. Image carousel ── */}
      <ImageCarousel images={product.images} name={product.name} onBack={() => router.back()} />

      {/* ── 2. Product info ── */}
      <div className="space-y-4 px-4 pt-4">
        {/* Category breadcrumb */}
        <Link
          href={`/products?category=${product.category.slug}`}
          className="text-xs font-semibold uppercase tracking-wider text-[#D4860B]"
        >
          {product.category.name}
        </Link>

        {/* Name */}
        <h1 className="text-2xl font-black leading-tight text-stone-900">{product.name}</h1>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-stone-900">
            ₹{price.toLocaleString('en-IN')}
          </span>
          <span className="text-sm text-stone-400">/ {product.unit}</span>
        </div>

        {/* Stock badge */}
        <div>
          {inStock ? (
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              {product.stock <= 5 ? `Only ${product.stock} left!` : 'In Stock'}
            </span>
          ) : (
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
              Out of Stock
            </span>
          )}
        </div>

        {/* ── 3. Quantity stepper ── */}
        {inStock && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-stone-700">Qty</span>
            <div className="flex items-center overflow-hidden rounded-xl border border-stone-200">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="flex h-9 w-9 items-center justify-center text-stone-500 transition active:bg-stone-100 disabled:opacity-30"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
              </button>
              <span className="w-8 select-none text-center text-sm font-bold text-stone-900">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                disabled={qty >= maxQty}
                className="flex h-9 w-9 items-center justify-center text-stone-500 transition active:bg-stone-100 disabled:opacity-30"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── 4. Description ── */}
        {product.description && (
          <div className="space-y-1">
            <p
              className={`text-sm text-stone-600 leading-relaxed ${
                !descExpanded && isLongDesc ? 'line-clamp-3' : ''
              }`}
            >
              {product.description}
            </p>
            {isLongDesc && (
              <button
                onClick={() => setDescExpanded((v) => !v)}
                className="text-xs font-semibold text-[#D4860B]"
              >
                {descExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {/* ── 5. Accordions ── */}
        <div className="rounded-2xl border border-stone-100 bg-white px-4 pt-1">
          <AccordionItem title="Product details">
            <ul className="space-y-1">
              <li>Unit: {product.unit}</li>
              <li>Stock: {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}</li>
              <li>Category: {product.category.name}</li>
            </ul>
          </AccordionItem>
          <AccordionItem title="Shipping & handling">
            Orders are shipped within 3–5 business days. Custom and bulk orders may take longer —
            contact us on WhatsApp for an ETA.
          </AccordionItem>
          <AccordionItem title="Care instructions">
            Keep resin products away from direct sunlight and extreme heat. Wipe with a soft dry
            cloth. Do not soak in water.
          </AccordionItem>
        </div>

        {/* ── 6. Reviews placeholder ── */}
        <div className="rounded-2xl border border-stone-100 bg-white px-4 py-5">
          <p className="text-sm font-semibold text-stone-800">Reviews</p>
          <p className="mt-2 text-sm text-stone-400">
            No reviews yet. Be the first to share your experience!
          </p>
        </div>
      </div>

      {/* ── 7. Sticky bottom action bar ── */}
      <div
        className="fixed left-0 right-0 z-[44] border-t border-stone-100 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur-sm"
        style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {inStock ? (
          <div className="space-y-2.5">
            {/* Row 1: Wishlist + Add to cart */}
            <div className="flex gap-2">
              <WishlistButton
                item={wishlistItem}
                size="md"
                className="!h-12 !w-12 flex-shrink-0 rounded-xl"
              />
              <button
                onClick={handleAddToCart}
                disabled={cartState === 'loading'}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-sm transition active:scale-[.98] ${
                  cartState === 'done' ? 'bg-green-500' : 'bg-[#D4860B] hover:bg-[#b8720a]'
                }`}
              >
                {cartState === 'loading' && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {cartState === 'done'
                  ? '✓ Added to cart'
                  : cartState === 'loading'
                    ? 'Adding…'
                    : `Add to cart — ₹${(price * qty).toLocaleString('en-IN')}`}
              </button>
            </div>
            {/* Row 2: WhatsApp order */}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[.98] hover:bg-[#20ba58]"
            >
              <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Order via WhatsApp
            </a>
          </div>
        ) : (
          /* Out of stock */
          <div className="space-y-2.5">
            <button
              disabled
              className="flex w-full items-center justify-center rounded-xl bg-stone-200 py-3 text-sm font-bold text-stone-500"
            >
              Out of Stock — Notify Me
            </button>
            <a
              href={`https://wa.me/${appConfig.businessWhatsapp}?text=${encodeURIComponent(`Hi Resin Dreams! I'm interested in *${product.name}* but it shows out of stock. Can you let me know when it's available?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white"
            >
              <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Ask on WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
