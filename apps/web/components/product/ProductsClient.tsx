'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { Card } from '@aaska/ui';
import useIsMobile from '@/hooks/useIsMobile';
import { AddToCart } from '@/components/add-to-cart';
import { WishlistButton } from '@/components/wishlist-button';

import { MobileProductCard } from './MobileProductCard';
import { CategoryFilterBar } from './CategoryFilterBar';
import { MobileFilterSheet, type FilterState, type SortOrder } from './MobileFilterSheet';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
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
  hasVariants: boolean;
  category: Category;
}

interface ProductsClientProps {
  products: Product[];
  /** Pre-selected category slug from server searchParams */
  initialCategory?: string;
  /** Pre-selected sort order from server searchParams */
  initialSort?: SortOrder;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deriveCategories(products: Product[]) {
  const seen = new Set<string>();
  const cats: Category[] = [];
  for (const p of products) {
    if (!seen.has(p.category.id)) {
      seen.add(p.category.id);
      cats.push(p.category);
    }
  }
  return cats.sort((a, b) => a.name.localeCompare(b.name));
}

function priceBoundsOf(products: Product[]) {
  if (products.length === 0) return { min: 0, max: 5000 };
  const prices = products.map((p) => Number(p.price));
  return {
    min: Math.floor(Math.min(...prices)),
    max: Math.ceil(Math.max(...prices)),
  };
}

function sortProducts(products: Product[], sort: SortOrder): Product[] {
  const arr = [...products];
  switch (sort) {
    case 'price-asc':
      return arr.sort((a, b) => Number(a.price) - Number(b.price));
    case 'price-desc':
      return arr.sort((a, b) => Number(b.price) - Number(a.price));
    case 'newest':
    case 'popular':
    default:
      return arr; // API order is already newest/popular
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductsClient({
  products,
  initialCategory,
  initialSort = 'newest',
}: ProductsClientProps) {
  const isMobile = useIsMobile();

  // ── Derived constants (stable across renders) ──
  const allCategories = useMemo(() => deriveCategories(products), [products]);
  const priceBounds = useMemo(() => priceBoundsOf(products), [products]);

  // ── Filter state ──
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory ?? null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    minPrice: priceBounds.min,
    maxPrice: priceBounds.max,
    categories: initialCategory ? [initialCategory] : [],
    sort: initialSort,
  });

  // ── Applied filters (committed on "Apply") ──
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(filters);

  function handleApply() {
    setAppliedFilters(filters);
    // Sync category pill bar to sheet categories
    setActiveCategory(filters.categories[0] ?? null);
  }

  function handleClear() {
    const reset: FilterState = {
      minPrice: priceBounds.min,
      maxPrice: priceBounds.max,
      categories: [],
      sort: 'newest',
    };
    setFilters(reset);
    setAppliedFilters(reset);
    setActiveCategory(null);
  }

  // Sync pill bar category change back to filter sheet
  function handleCategoryPillChange(slug: string | null) {
    setActiveCategory(slug);
    setFilters((f) => ({ ...f, categories: slug ? [slug] : [] }));
    setAppliedFilters((f) => ({ ...f, categories: slug ? [slug] : [] }));
  }

  // ── Filtered + sorted products ──
  const displayed = useMemo(() => {
    let list = products;

    // Category filter (from pill bar / sheet)
    const cats = appliedFilters.categories;
    if (cats.length > 0) {
      list = list.filter((p) => cats.includes(p.category.slug));
    }

    // Price filter
    list = list.filter((p) => {
      const price = Number(p.price);
      return price >= appliedFilters.minPrice && price <= appliedFilters.maxPrice;
    });

    return sortProducts(list, appliedFilters.sort);
  }, [products, appliedFilters]);

  // Count non-default sheet filters (price + sort)
  const sheetFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.sort !== 'newest') count++;
    if (appliedFilters.minPrice > priceBounds.min) count++;
    if (appliedFilters.maxPrice < priceBounds.max) count++;
    return count;
  }, [appliedFilters, priceBounds]);

  // ── Empty state ──
  const isEmpty = displayed.length === 0;

  // =========================================================================
  // Mobile layout
  // =========================================================================

  if (isMobile) {
    return (
      <>
        {/* Category filter bar — sticky under MobileTopBar */}
        <CategoryFilterBar
          categories={allCategories}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryPillChange}
          onFilterOpen={() => {
            setFilters(appliedFilters); // reset sheet to applied state
            setIsFilterOpen(true);
          }}
          activeFilterCount={sheetFilterCount}
        />

        {/* Product count */}
        <p className="px-3 pb-1 pt-3 text-xs text-stone-400">
          {displayed.length} {displayed.length === 1 ? 'item' : 'items'}
        </p>

        {/* Grid */}
        {isEmpty ? (
          <div className="flex flex-col items-center px-4 py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">
              <svg
                className="h-7 w-7 text-stone-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"
                />
              </svg>
            </div>
            <p className="font-semibold text-stone-700">No products match</p>
            <p className="mt-1 text-sm text-stone-400">Try adjusting your filters</p>
            <button
              onClick={handleClear}
              className="mt-4 rounded-xl bg-[#D4860B] px-5 py-2 text-sm font-semibold text-white"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-3">
            {displayed.map((p) => (
              <MobileProductCard
                key={p.id}
                product={{
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  price: p.price,
                  images: p.images,
                  unit: p.unit,
                  stock: p.stock,
                  hasVariants: p.hasVariants,
                }}
              />
            ))}
          </div>
        )}

        {/* Filter sheet */}
        <MobileFilterSheet
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          categories={allCategories}
          priceBounds={priceBounds}
          filters={filters}
          onFiltersChange={setFilters}
          onApply={handleApply}
          onClear={handleClear}
        />
      </>
    );
  }

  // =========================================================================
  // Desktop layout — preserves existing look + adds category filter pills
  // =========================================================================

  return (
    <div className="space-y-6">
      {/* Desktop category filter row */}
      {allCategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleCategoryPillChange(null)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
              activeCategory === null
                ? 'bg-[#D4860B] text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All
          </button>
          {allCategories.map((cat) => {
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryPillChange(isActive ? null : cat.slug)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#D4860B] text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat.name}
              </button>
            );
          })}

          <span className="ml-auto text-sm text-stone-400">{displayed.length} items</span>
        </div>
      )}

      {isEmpty ? (
        <div className="rounded-3xl border border-stone-100 bg-white py-16 text-center">
          <p className="text-stone-400">No products match the selected filters.</p>
          <button
            onClick={handleClear}
            className="mt-3 text-sm font-semibold text-[#D4860B] underline-offset-2 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayed.map((p) => (
            <Card
              key={p.id}
              className="group flex h-full flex-col space-y-3 transition hover:shadow-md"
            >
              {/* Clickable image + info area */}
              <Link href={`/products/${p.slug}`} className="block">
                <div className="relative">
                  {p.images[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="aspect-square w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="aspect-square w-full rounded-xl bg-stone-100" />
                  )}
                  <div className="absolute right-2 top-2" onClick={(e) => e.preventDefault()}>
                    <WishlistButton
                      item={{
                        id: p.id,
                        name: p.name,
                        slug: p.slug,
                        price: p.price,
                        images: p.images,
                        unit: p.unit,
                      }}
                      size="sm"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
                    {p.category.name}
                  </p>
                  <h2 className="mt-1 font-bold text-stone-900 group-hover:text-bark">{p.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-stone-500">{p.description}</p>
                </div>
              </Link>

              {/* Price + action buttons — NOT inside the Link */}
              <div className="mt-auto pt-1">
                <div className="mb-3 flex items-baseline gap-2">
                  <span className="text-lg font-black text-stone-900">
                    ₹{Number(p.price).toLocaleString('en-IN')}
                  </span>
                  {p.showComparePrice &&
                    p.compareAtPrice &&
                    Number(p.compareAtPrice) > Number(p.price) && (
                      <span className="text-sm text-stone-400 line-through">
                        ₹{Number(p.compareAtPrice).toLocaleString('en-IN')}
                      </span>
                    )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/products/${p.slug}`}
                    className="flex flex-1 items-center justify-center rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
                  >
                    View
                  </Link>
                  {p.hasVariants ? (
                    <Link
                      href={`/products/${p.slug}`}
                      className="flex flex-1 items-center justify-center rounded-lg bg-stone-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
                    >
                      Choose Options
                    </Link>
                  ) : (
                    <div className="flex-1">
                      <AddToCart productId={p.id} stock={p.stock} className="w-full" />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
