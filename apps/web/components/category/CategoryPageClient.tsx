'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Card } from '@aaska/ui';
import useIsMobile from '@/hooks/useIsMobile';
import { AddToCart } from '@/components/add-to-cart';
import { WishlistButton } from '@/components/wishlist-button';
import { MobileProductCard } from '@/components/product/MobileProductCard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CategoryProduct {
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
  category: { id: string; name: string; slug: string; parentId: string | null };
}

export interface CategoryChild {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { products: number };
}

export interface CategoryDetail {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  bannerImage: string | null;
  description: string | null;
  children: CategoryChild[];
  products: CategoryProduct[];
}

export interface FlatCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface CategoryPageClientProps {
  category: CategoryDetail;
  /** Non-null when this is a subcategory page */
  parentCategory: FlatCategory | null;
  /** Other subcategories of the same parent (for sibling pills) */
  siblings: FlatCategory[];
  /** Pre-selected subcategory from ?sub= query param */
  initialSub?: string;
}

// ---------------------------------------------------------------------------
// Banner — full-bleed, for parent categories
// ---------------------------------------------------------------------------

function Banner({ category }: { category: CategoryDetail }) {
  return (
    <div className="relative h-52 w-full overflow-hidden sm:h-64 lg:h-80">
      {/* Background */}
      {category.bannerImage ? (
        <img
          src={category.bannerImage}
          alt={category.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-amber-400 via-orange-400 to-orange-600" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Text */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 sm:px-8 sm:pb-8 lg:px-12">
        <h1 className="text-3xl font-black text-white sm:text-4xl lg:text-5xl">{category.name}</h1>
        {category.description && (
          <p className="mt-1.5 max-w-xl text-sm text-white/80 sm:text-base">
            {category.description}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Breadcrumb — for subcategory pages
// ---------------------------------------------------------------------------

function Breadcrumb({
  category,
  parentCategory,
}: {
  category: CategoryDetail;
  parentCategory: FlatCategory | null;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-2 pt-4 sm:px-6 lg:px-8">
      <nav className="flex items-center gap-1.5 text-sm text-stone-400">
        <Link href="/" className="transition hover:text-stone-700">
          Home
        </Link>
        <span>/</span>
        {parentCategory ? (
          <>
            <Link
              href={`/categories/${parentCategory.slug}`}
              className="transition hover:text-stone-700"
            >
              {parentCategory.name}
            </Link>
            <span>/</span>
          </>
        ) : null}
        <span className="font-medium text-stone-800">{category.name}</span>
      </nav>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcategory pill bar — for parent category pages (client-side filter)
// ---------------------------------------------------------------------------

function SubcategoryPillBar({
  categoryName,
  children,
  activeSub,
  onSelect,
}: {
  categoryName: string;
  children: CategoryChild[];
  activeSub: string | null;
  onSelect: (slug: string | null) => void;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
      <div className="flex gap-2 pb-1 sm:flex-wrap">
        {/* "All" pill */}
        <button
          onClick={() => onSelect(null)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            activeSub === null
              ? 'bg-[#D4860B] text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          All {categoryName}
        </button>

        {children.map((child) => (
          <button
            key={child.id}
            onClick={() => onSelect(child.slug)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              activeSub === child.slug
                ? 'bg-[#D4860B] text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {child.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop product card
// ---------------------------------------------------------------------------

function DesktopProductCard({ product: p }: { product: CategoryProduct }) {
  const showSale = p.showComparePrice && p.compareAtPrice != null;

  return (
    <Card className="group flex h-full flex-col space-y-3 transition hover:shadow-md">
      {/* Clickable image + info */}
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
          {showSale && (
            <span className="absolute left-2 top-2 rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none tracking-wide text-white">
              SALE
            </span>
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

      {/* Price + buttons — NOT inside Link */}
      <div className="mt-auto pt-1">
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-lg font-black text-stone-900">
            ₹{Number(p.price).toLocaleString('en-IN')}
          </span>
          {showSale && (
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
  );
}

// ---------------------------------------------------------------------------
// Product grid
// ---------------------------------------------------------------------------

function ProductGrid({ products, isMobile }: { products: CategoryProduct[]; isMobile: boolean }) {
  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-stone-100 bg-white py-16 text-center">
        <p className="text-stone-400">No products in this category yet.</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {products.map((p) => (
          <MobileProductCard
            key={p.id}
            product={{
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: p.price,
              originalPrice: p.showComparePrice && p.compareAtPrice ? p.compareAtPrice : undefined,
              images: p.images,
              unit: p.unit,
              stock: p.stock,
              hasVariants: p.hasVariants,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <DesktopProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function CategoryPageClient({
  category,
  parentCategory,
  siblings,
  initialSub,
}: CategoryPageClientProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [, startTransition] = useTransition();

  const isParent = category.parentId === null && category.children.length > 0;
  const isSubcategory = category.parentId !== null;

  // Active subcategory filter slug (null = "All") — only relevant for parent pages
  const [activeSub, setActiveSub] = useState<string | null>(initialSub ?? null);

  function selectSub(slug: string | null) {
    setActiveSub(slug);
    // Sync URL without a full page navigation
    startTransition(() => {
      const params = new URLSearchParams(window.location.search);
      if (slug) params.set('sub', slug);
      else params.delete('sub');
      const search = params.toString();
      router.replace(window.location.pathname + (search ? `?${search}` : ''), { scroll: false });
    });
  }

  // Derive displayed products
  const displayed =
    isParent && activeSub
      ? category.products.filter((p) => p.category.slug === activeSub)
      : category.products;

  return (
    <>
      {/* ── Banner (parent) or Breadcrumb (subcategory) ── */}
      {isParent && <Banner category={category} />}
      {isSubcategory && <Breadcrumb category={category} parentCategory={parentCategory} />}

      {/* ── Padded content ── */}
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 pb-12 sm:px-6 lg:px-8">
        {/* Page title for subcategories (parent title is in the banner) */}
        {isSubcategory && (
          <div>
            <h1 className="text-2xl font-black text-stone-900 sm:text-3xl">{category.name}</h1>
            {category.description && <p className="mt-1 text-stone-500">{category.description}</p>}
          </div>
        )}

        {/* "Shop by Category" label for parent — below banner */}
        {isParent && (
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-stone-400">
              Shop by Category
            </p>
          </div>
        )}

        {/* ── Pill bars ── */}
        {isParent && category.children.length > 0 && (
          <SubcategoryPillBar
            categoryName={category.name}
            children={category.children}
            activeSub={activeSub}
            onSelect={selectSub}
          />
        )}

        {isSubcategory && (
          <SiblingPillBarResolved
            category={category}
            siblings={siblings}
            parentCategory={parentCategory}
          />
        )}

        {/* ── Product count ── */}
        <p className="text-sm text-stone-400">
          {displayed.length} {displayed.length === 1 ? 'item' : 'items'}
        </p>

        {/* ── Product grid ── */}
        <ProductGrid products={displayed} isMobile={isMobile} />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sibling pill bar (resolved with current category name shown as active pill)
// ---------------------------------------------------------------------------

function SiblingPillBarResolved({
  category,
  siblings,
  parentCategory,
}: {
  category: CategoryDetail;
  siblings: FlatCategory[];
  parentCategory: FlatCategory | null;
}) {
  if (siblings.length === 0 && !parentCategory) return null;

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
      <div className="flex gap-2 pb-1 sm:flex-wrap">
        {/* Back to "All" parent */}
        {parentCategory && (
          <Link
            href={`/categories/${parentCategory.slug}`}
            className="shrink-0 rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-600 transition-all hover:bg-stone-200"
          >
            ← All {parentCategory.name}
          </Link>
        )}

        {/* Current subcategory — active, not a link */}
        <span className="shrink-0 rounded-full bg-[#D4860B] px-4 py-2 text-sm font-semibold text-white shadow-sm">
          {category.name}
        </span>

        {/* Sibling links */}
        {siblings.map((s) => (
          <Link
            key={s.id}
            href={`/categories/${s.slug}`}
            className="shrink-0 rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-600 transition-all hover:bg-stone-200"
          >
            {s.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
