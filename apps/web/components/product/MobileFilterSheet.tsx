'use client';

import { useEffect, useRef } from 'react';

export type SortOrder = 'newest' | 'price-asc' | 'price-desc' | 'popular';

export interface FilterState {
  minPrice: number;
  maxPrice: number;
  categories: string[];
  sort: SortOrder;
}

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** All available categories */
  categories: CategoryOption[];
  /** Absolute price bounds derived from products */
  priceBounds: { min: number; max: number };
  /** Current filter values */
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onApply: () => void;
  onClear: () => void;
}

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most popular' },
];

// ---------------------------------------------------------------------------
// Dual-range price slider
// ---------------------------------------------------------------------------

function PriceRangeSlider({
  min,
  max,
  minVal,
  maxVal,
  onMinChange,
  onMaxChange,
}: {
  min: number;
  max: number;
  minVal: number;
  maxVal: number;
  onMinChange: (v: number) => void;
  onMaxChange: (v: number) => void;
}) {
  const range = max - min || 1;
  const minPct = ((minVal - min) / range) * 100;
  const maxPct = ((maxVal - min) / range) * 100;

  return (
    <div className="px-1">
      {/* Labels */}
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="rounded-lg bg-stone-100 px-2.5 py-1 font-semibold text-stone-700">
          ₹{minVal.toLocaleString('en-IN')}
        </span>
        <span className="text-xs text-stone-400">–</span>
        <span className="rounded-lg bg-stone-100 px-2.5 py-1 font-semibold text-stone-700">
          ₹{maxVal.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Slider track */}
      <div className="relative h-6 w-full">
        {/* Background track */}
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-stone-200" />
        {/* Active range fill */}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#D4860B]"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={Math.max(1, Math.floor(range / 100))}
          value={minVal}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), maxVal - 1);
            onMinChange(v);
          }}
          className="price-range-thumb"
        />
        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={Math.max(1, Math.floor(range / 100))}
          value={maxVal}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), minVal + 1);
            onMaxChange(v);
          }}
          className="price-range-thumb"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main sheet
// ---------------------------------------------------------------------------

export function MobileFilterSheet({
  isOpen,
  onClose,
  categories,
  priceBounds,
  filters,
  onFiltersChange,
  onApply,
  onClear,
}: MobileFilterSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  function update(partial: Partial<FilterState>) {
    onFiltersChange({ ...filters, ...partial });
  }

  function toggleCategory(slug: string) {
    const next = filters.categories.includes(slug)
      ? filters.categories.filter((s) => s !== slug)
      : [...filters.categories, slug];
    update({ categories: next });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[95] bg-black/50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet panel */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filter products"
        className={`fixed inset-x-0 bottom-0 z-[96] flex max-h-[85dvh] flex-col rounded-t-3xl bg-white transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pb-2 pt-3">
          <div className="h-1 w-10 rounded-full bg-stone-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <h2 className="text-lg font-black text-stone-900">Filters</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200"
            aria-label="Close filters"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4">
          {/* ── Sort By ── */}
          <section className="mb-6">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-stone-500">
              Sort By
            </h3>
            <div className="space-y-1">
              {SORT_OPTIONS.map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                    filters.sort === value ? 'bg-amber-50' : 'hover:bg-stone-50'
                  }`}
                >
                  {/* Custom radio */}
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      filters.sort === value ? 'border-[#D4860B] bg-[#D4860B]' : 'border-stone-300'
                    }`}
                  >
                    {filters.sort === value && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>
                  <input
                    type="radio"
                    name="sort"
                    value={value}
                    checked={filters.sort === value}
                    onChange={() => update({ sort: value })}
                    className="sr-only"
                  />
                  <span
                    className={`text-sm ${filters.sort === value ? 'font-semibold text-stone-900' : 'text-stone-600'}`}
                  >
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* ── Price Range ── */}
          <section className="mb-6">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-stone-500">
              Price Range
            </h3>
            <PriceRangeSlider
              min={priceBounds.min}
              max={priceBounds.max}
              minVal={filters.minPrice}
              maxVal={filters.maxPrice}
              onMinChange={(v) => update({ minPrice: v })}
              onMaxChange={(v) => update({ maxPrice: v })}
            />
          </section>

          {/* ── Categories ── */}
          {categories.length > 0 && (
            <section className="mb-2">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-stone-500">
                Categories
              </h3>
              <div className="space-y-1">
                {categories.map((cat) => {
                  const checked = filters.categories.includes(cat.slug);
                  return (
                    <label
                      key={cat.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                        checked ? 'bg-amber-50' : 'hover:bg-stone-50'
                      }`}
                    >
                      {/* Custom checkbox */}
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                          checked ? 'border-[#D4860B] bg-[#D4860B]' : 'border-stone-300'
                        }`}
                      >
                        {checked && (
                          <svg
                            className="h-3 w-3 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCategory(cat.slug)}
                        className="sr-only"
                      />
                      <span
                        className={`text-sm ${checked ? 'font-semibold text-stone-900' : 'text-stone-600'}`}
                      >
                        {cat.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* ── Sticky bottom actions ── */}
        <div
          className="border-t border-stone-100 px-5 pb-safe pt-4"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onClear}
              className="text-sm font-semibold text-stone-500 underline-offset-2 hover:text-stone-700 hover:underline"
            >
              Clear all
            </button>
            <button
              onClick={() => {
                onApply();
                onClose();
              }}
              className="flex-1 rounded-2xl bg-[#D4860B] py-3 text-sm font-bold text-white transition hover:bg-[#b8720a] active:scale-[0.98]"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
