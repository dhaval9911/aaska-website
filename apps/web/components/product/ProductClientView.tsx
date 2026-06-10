'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { Button, PageShell } from '@aaska/ui';
import { appConfig } from '@aaska/config';

import useIsMobile from '@/hooks/useIsMobile';
import { AddToCart } from '@/components/add-to-cart';
import { WishlistButton } from '@/components/wishlist-button';
import { MobileProductDetail } from './MobileProductDetail';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface ProductVariant {
  id: string;
  label: string;
  price: string;
  compareAtPrice: string | null;
  showComparePrice: boolean;
  stock: number;
  isDefault: boolean;
  displayOrder: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface ProductClientViewProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: string;
    compareAtPrice: string | null;
    showComparePrice: boolean;
    stock: number;
    unit: string;
    images: string[];
    category: Category;
    createdAt: string;
    hasVariants: boolean;
    variants: ProductVariant[];
    showStock: boolean;
  };
}

// ---------------------------------------------------------------------------
// Lightbox — shared between desktop and mobile
// ---------------------------------------------------------------------------

export function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(i + 1, images.length - 1));
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(i - 1, 0));
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, images.length]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Main image */}
      <img
        src={images[idx]}
        alt=""
        className="max-h-[88vh] max-w-[88vw] rounded-xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Prev */}
      {idx > 0 && (
        <button
          aria-label="Previous"
          onClick={(e) => {
            e.stopPropagation();
            setIdx((i) => i - 1);
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/25"
        >
          ‹
        </button>
      )}

      {/* Next */}
      {idx < images.length - 1 && (
        <button
          aria-label="Next"
          onClick={(e) => {
            e.stopPropagation();
            setIdx((i) => i + 1);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/25"
        >
          ›
        </button>
      )}

      {/* Dot strip */}
      {images.length > 1 && (
        <div className="absolute bottom-5 flex items-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              aria-label={`Image ${i + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                setIdx(i);
              }}
              className={`rounded-full transition-all ${
                i === idx ? 'h-2 w-6 bg-white' : 'h-2 w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop gallery — vertical thumbnail strip + main image
// ---------------------------------------------------------------------------

function DesktopGallery({ images, name }: { images: string[]; name: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const imgs = images.length > 0 ? images : [];
  const hasImages = imgs.length > 0;

  return (
    <>
      <div className="flex gap-3">
        {/* Vertical thumbnail strip — only when more than 1 image */}
        {imgs.length > 1 && (
          <div
            className="flex w-[76px] flex-shrink-0 flex-col gap-2 overflow-y-auto"
            style={{ maxHeight: '520px' }}
          >
            {imgs.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`aspect-square w-full overflow-hidden rounded-xl border-2 transition-all ${
                  i === activeIdx
                    ? 'border-[#D4860B] opacity-100'
                    : 'border-transparent opacity-70 hover:opacity-100 hover:border-stone-200'
                }`}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Main image */}
        <div className="min-w-0 flex-1">
          {hasImages ? (
            <button
              className="group relative block w-full cursor-zoom-in"
              onClick={() => setLightboxIdx(activeIdx)}
              aria-label="View full size"
            >
              <img
                src={imgs[activeIdx]}
                alt={name}
                className="aspect-square w-full rounded-3xl object-cover transition-opacity duration-200"
              />
              <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-stone-500 opacity-0 shadow transition-opacity group-hover:opacity-100">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803zM10.5 7.5v6m3-3h-6"
                  />
                </svg>
              </div>
            </button>
          ) : (
            <div className="aspect-square w-full rounded-3xl bg-stone-100" />
          )}
        </div>
      </div>

      {lightboxIdx !== null && (
        <Lightbox images={imgs} initialIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Price display — handles compare/sale price
// ---------------------------------------------------------------------------

export function PriceDisplay({
  price,
  compareAtPrice,
  showComparePrice,
  unit,
}: {
  price: string;
  compareAtPrice: string | null;
  showComparePrice: boolean;
  unit: string;
}) {
  const selling = Number(price);
  const original = compareAtPrice ? Number(compareAtPrice) : null;
  const isSale = showComparePrice && original !== null && original > selling;
  const save = isSale ? original! - selling : 0;
  const pct = isSale ? Math.round((save / original!) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {isSale && (
          <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">
            SALE
          </span>
        )}
        <span className={`text-4xl font-black ${isSale ? 'text-[#D4860B]' : 'text-stone-900'}`}>
          ₹{selling.toLocaleString('en-IN')}
        </span>
        {isSale && (
          <span className="text-xl text-stone-400 line-through">
            ₹{original!.toLocaleString('en-IN')}
          </span>
        )}
        <span className="text-sm text-stone-400">/ {unit}</span>
      </div>
      {isSale && (
        <p className="text-sm font-semibold text-green-600">
          You save ₹{save.toLocaleString('en-IN')} ({pct}% off)
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ProductClientView({ product }: ProductClientViewProps) {
  const isMobile = useIsMobile();

  // Variant selection (desktop). Pre-select the default variant.
  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0] ?? null;
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.hasVariants ? defaultVariant : null,
  );

  if (isMobile) {
    return <MobileProductDetail product={product} />;
  }

  // Effective price/stock — variant overrides base product when hasVariants=true
  const effectivePrice = selectedVariant ? selectedVariant.price : product.price;
  const effectiveCompareAt = selectedVariant
    ? selectedVariant.compareAtPrice
    : product.compareAtPrice;
  const effectiveShowCompare = selectedVariant
    ? selectedVariant.showComparePrice
    : product.showComparePrice;
  const effectiveStock = selectedVariant ? selectedVariant.stock : product.stock;
  const inStock = effectiveStock > 0;

  const waText = encodeURIComponent(
    `Hi Resin Dreams! I'd like to order *${product.name}*${
      selectedVariant ? ` (${selectedVariant.label})` : ''
    } — ₹${Number(effectivePrice).toLocaleString('en-IN')}. Can you help?`,
  );
  const waLink = `https://wa.me/${appConfig.businessWhatsapp}?text=${waText}`;

  return (
    <PageShell className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-stone-400">
        <Link href="/" className="transition hover:text-stone-700">
          Home
        </Link>
        <span>/</span>
        <Link href="/products" className="transition hover:text-stone-700">
          Products
        </Link>
        <span>/</span>
        <Link
          href={`/categories/${product.category.slug}`}
          className="transition hover:text-stone-700"
        >
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-stone-600">{product.name}</span>
      </nav>

      {/* Shopify-style layout: gallery left, info right */}
      <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
        {/* Left: gallery */}
        <DesktopGallery images={product.images} name={product.name} />

        {/* Right: product info */}
        <div className="space-y-6">
          {/* Category + Name */}
          <div>
            <Link
              href={`/categories/${product.category.slug}`}
              className="text-sm font-semibold uppercase tracking-wider text-[#D4860B] transition hover:opacity-80"
            >
              {product.category.name}
            </Link>
            <h1 className="mt-2 text-3xl font-black leading-tight text-stone-900">
              {product.name}
            </h1>
          </div>

          {/* Price — updates when variant is selected */}
          <PriceDisplay
            price={effectivePrice}
            compareAtPrice={effectiveCompareAt}
            showComparePrice={effectiveShowCompare}
            unit={product.unit}
          />

          {/* ── Variant selector pills ── */}
          {product.hasVariants && product.variants.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
                Size / Option
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const active = selectedVariant?.id === v.id;
                  const outOfStock = v.stock === 0;
                  return (
                    <button
                      key={v.id}
                      onClick={() => !outOfStock && setSelectedVariant(v)}
                      disabled={outOfStock}
                      className={`relative rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-all ${
                        active
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : outOfStock
                            ? 'cursor-not-allowed border-stone-200 text-stone-300 line-through'
                            : 'border-stone-200 text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {v.label}
                      {outOfStock && (
                        <span className="absolute -right-1.5 -top-1.5 rounded-full bg-stone-400 px-1 text-[9px] font-bold text-white">
                          sold
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Unit pill (shown for non-variant products only) */}
          {!product.hasVariants && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
                Unit
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg border-2 border-stone-900 bg-stone-900 px-4 py-2 text-sm font-semibold text-white">
                  {product.unit}
                </span>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
            <p className="whitespace-pre-line text-sm leading-relaxed text-stone-600">
              {product.description}
            </p>
          </div>

          {/* Stock badge — only shown when showStock is true or product is out of stock */}
          {(product.showStock || !inStock) && (
            <div>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}
              >
                {inStock
                  ? effectiveStock <= 5
                    ? `Only ${effectiveStock} left!`
                    : `${effectiveStock} in stock`
                  : 'Out of stock'}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {product.hasVariants && !selectedVariant ? (
                <Button disabled className="flex-1">
                  Select a size
                </Button>
              ) : (
                <AddToCart
                  productId={product.id}
                  variantId={selectedVariant?.id}
                  stock={effectiveStock}
                  className="flex-1"
                />
              )}
              <WishlistButton
                item={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: effectivePrice,
                  images: product.images,
                  unit: product.unit,
                }}
                size="md"
              />
            </div>

            {/* WhatsApp */}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#25D366] py-3 text-sm font-semibold text-[#1a9e4e] transition hover:bg-[#f0fdf4]"
            >
              <svg className="h-4 w-4 fill-[#25D366]" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Order via WhatsApp
            </a>

            <Button variant="outline" className="w-full">
              Contact for bulk order
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
