'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSearchOverlay({ isOpen, onClose }: MobileSearchOverlayProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/products?search=${encodeURIComponent(q)}`);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ backgroundColor: '#FAFAF8' }}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      {/* Header row */}
      <div className="flex h-14 shrink-0 items-center gap-3 px-4 shadow-sm">
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-500"
          aria-label="Close search"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <form onSubmit={handleSubmit} className="flex flex-1 items-center">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="h-10 w-full rounded-2xl border border-stone-200 bg-white py-2 pl-9 pr-4 text-sm outline-none transition focus:border-[#D4860B] focus:ring-2 focus:ring-[#D4860B]/20"
            />
          </div>
          {query && (
            <button
              type="submit"
              className="ml-2 shrink-0 rounded-xl bg-[#D4860B] px-4 py-2 text-sm font-semibold text-white"
            >
              Go
            </button>
          )}
        </form>
      </div>

      {/* Quick links */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
          Browse
        </p>
        <div className="space-y-1">
          {[
            { label: 'All Products', href: '/products' },
            { label: 'New Arrivals', href: '/products?sort=newest' },
            { label: 'Best Sellers', href: '/products?sort=popular' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
            >
              <svg
                className="h-4 w-4 text-stone-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
