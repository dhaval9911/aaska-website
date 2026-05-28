'use client';

import { useEffect, useRef } from 'react';

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface CategoryFilterBarProps {
  categories: CategoryOption[];
  activeCategory: string | null;
  onCategoryChange: (slug: string | null) => void;
  onFilterOpen: () => void;
  /** Count of non-default filters active (price, sort, etc.) */
  activeFilterCount?: number;
}

export function CategoryFilterBar({
  categories,
  activeCategory,
  onCategoryChange,
  onFilterOpen,
  activeFilterCount = 0,
}: CategoryFilterBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep active pill visible after category changes
  useEffect(() => {
    const el = scrollRef.current?.querySelector('[data-active="true"]') as HTMLElement | null;
    el?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
  }, [activeCategory]);

  return (
    <div className="sticky top-14 z-40 border-b border-stone-100 bg-white/95 shadow-sm backdrop-blur-sm">
      <div
        ref={scrollRef}
        className="no-scrollbar flex items-center gap-2 overflow-x-auto px-3 py-2.5"
      >
        {/* All pill */}
        <button
          data-active={activeCategory === null ? 'true' : 'false'}
          onClick={() => onCategoryChange(null)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
            activeCategory === null
              ? 'bg-[#D4860B] text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 active:scale-95'
          }`}
        >
          All
        </button>

        {categories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.id}
              data-active={isActive ? 'true' : 'false'}
              onClick={() => onCategoryChange(isActive ? null : cat.slug)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#D4860B] text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 active:scale-95'
              }`}
            >
              {cat.name}
            </button>
          );
        })}

        {/* Visual divider */}
        <span className="mx-1 h-5 w-px shrink-0 bg-stone-200" />

        {/* Filters button */}
        <button
          onClick={onFilterOpen}
          className={`relative shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
            activeFilterCount > 0
              ? 'bg-stone-900 text-white'
              : 'border border-stone-300 text-stone-600 hover:bg-stone-50 active:scale-95'
          }`}
        >
          {/* Filter icon */}
          <svg
            className="h-3 w-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 9h10M11 14h2" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#D4860B] text-[9px] font-bold leading-none text-white">
              {activeFilterCount > 9 ? '9+' : activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
