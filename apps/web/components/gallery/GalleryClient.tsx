'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

import type { GalleryProduct } from '@/app/gallery/page';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GalleryTile {
  key: string;
  src: string;
  product: GalleryProduct;
}

// ---------------------------------------------------------------------------
// Lightbox
// ---------------------------------------------------------------------------

function GalleryLightbox({
  tiles,
  initialIndex,
  onClose,
}: {
  tiles: GalleryTile[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);
  const tile = tiles[idx];

  const prev = useCallback(() => setIdx((i) => Math.max(i - 1, 0)), []);
  const next = useCallback(() => setIdx((i) => Math.min(i + 1, tiles.length - 1)), [tiles.length]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, next, prev]);

  const selling = Number(tile.product.price);
  const original =
    tile.product.showComparePrice && tile.product.compareAtPrice
      ? Number(tile.product.compareAtPrice)
      : null;
  const isSale = original !== null && original > selling;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 p-4"
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

      {/* Counter */}
      <div className="absolute left-4 top-4 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
        {idx + 1} / {tiles.length}
      </div>

      {/* Image */}
      <img
        src={tile.src}
        alt={tile.product.name}
        className="max-h-[75vh] max-w-[88vw] rounded-2xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Product info card */}
      <div
        className="mt-4 flex w-full max-w-sm flex-col items-center gap-1 rounded-2xl bg-white/10 px-5 py-3 text-white backdrop-blur"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
          {tile.product.category.name}
        </p>
        <p className="text-center text-lg font-black leading-tight">{tile.product.name}</p>
        <div className="flex items-baseline gap-2">
          {isSale && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold">SALE</span>
          )}
          <span className={`text-base font-bold ${isSale ? 'text-amber-400' : 'text-white'}`}>
            ₹{selling.toLocaleString('en-IN')}
          </span>
          {isSale && (
            <span className="text-sm text-white/50 line-through">
              ₹{original!.toLocaleString('en-IN')}
            </span>
          )}
        </div>
        <Link
          href={`/products/${tile.product.slug}`}
          className="mt-1.5 rounded-xl bg-amber-500 px-5 py-1.5 text-sm font-bold text-white transition hover:bg-amber-600"
          onClick={onClose}
        >
          View Product →
        </Link>
      </div>

      {/* Prev */}
      {idx > 0 && (
        <button
          aria-label="Previous"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/25"
        >
          ‹
        </button>
      )}

      {/* Next */}
      {idx < tiles.length - 1 && (
        <button
          aria-label="Next"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/25"
        >
          ›
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Masonry tile
// ---------------------------------------------------------------------------

function MasonryTile({
  tile,
  index,
  onOpen,
}: {
  tile: GalleryTile;
  index: number;
  onOpen: (index: number) => void;
}) {
  const selling = Number(tile.product.price);
  const original =
    tile.product.showComparePrice && tile.product.compareAtPrice
      ? Number(tile.product.compareAtPrice)
      : null;
  const isSale = original !== null && original > selling;

  return (
    <div className="group relative mb-3 break-inside-avoid overflow-hidden rounded-2xl bg-stone-200 shadow-sm">
      {/* Image */}
      <img
        src={tile.src}
        alt={tile.product.name}
        loading="lazy"
        className="block w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Hover overlay */}
      <button
        onClick={() => onOpen(index)}
        aria-label={`View ${tile.product.name}`}
        className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-black/75 via-black/20 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      >
        <p className="w-full text-center text-[10px] font-bold uppercase tracking-wider text-amber-400">
          {tile.product.category.name}
        </p>
        <p className="mt-0.5 w-full text-center text-sm font-black leading-tight text-white">
          {tile.product.name}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          {isSale && (
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
              SALE
            </span>
          )}
          <span className={`text-sm font-bold ${isSale ? 'text-amber-400' : 'text-white'}`}>
            ₹{selling.toLocaleString('en-IN')}
          </span>
          {isSale && (
            <span className="text-xs text-white/60 line-through">
              ₹{original!.toLocaleString('en-IN')}
            </span>
          )}
        </div>
        <span className="mt-2 rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          View Product →
        </span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-stone-400">
      <svg
        className="h-16 w-16 opacity-30"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
        />
      </svg>
      <p className="text-lg font-semibold">No images yet</p>
      <p className="text-sm">Check back soon — new pieces are added regularly.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function GalleryClient({ tiles }: { tiles: GalleryTile[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (tiles.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="px-4 pb-4 sm:px-6 lg:px-8">
        {/* CSS columns masonry — 2 cols mobile, 3 cols tablet, 4 cols desktop */}
        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
          {tiles.map((tile, i) => (
            <MasonryTile key={tile.key} tile={tile} index={i} onOpen={setLightboxIndex} />
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <GalleryLightbox
          tiles={tiles}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
