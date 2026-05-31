import Link from 'next/link';

import { businessCategories } from '@aaska/config';
import { Card, PageShell } from '@aaska/ui';

import { apiFetch } from '@/lib/api';

interface FeaturedCategory {
  id: string;
  name: string;
  slug: string;
  homeTileImage: string | null;
  description: string | null;
  featuredOnHome: boolean;
  homeDisplayOrder: number;
  _count: { products: number };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  images: string[];
  category: Category;
}

export const revalidate = 60;

/** Tailwind grid-cols class based on number of featured tiles. */
function tilesGridClass(count: number): string {
  if (count === 2) return 'sm:grid-cols-2';
  if (count === 3) return 'sm:grid-cols-3';
  if (count >= 4) return 'sm:grid-cols-2 lg:grid-cols-3';
  return ''; // 0 or 1 — full width, no columns class needed
}

export default async function HomePage() {
  const [products, allCategories] = await Promise.all([
    apiFetch<Product[]>('/products').catch(() => [] as Product[]),
    apiFetch<FeaturedCategory[]>('/categories').catch(() => [] as FeaturedCategory[]),
  ]);

  const featured = products.slice(0, 3);

  const featuredTiles = allCategories
    .filter((c) => c.featuredOnHome)
    .sort((a, b) => a.homeDisplayOrder - b.homeDisplayOrder);

  return (
    <>
      {/* ── Brand header (full-width, cream) ───────────────────────────── */}
      <div className="w-full bg-[#FAF8F5] px-4 py-14 text-center">
        <h1 className="font-serif text-5xl font-bold tracking-tight text-stone-900 sm:text-6xl lg:text-7xl">
          Aaska
        </h1>
        <p className="mt-3 text-base text-stone-500 sm:text-lg">
          Handcrafted Resin Art &amp; Raw Materials
        </p>
      </div>

      <PageShell className="space-y-12">
        {/* ── Category tiles ─────────────────────────────────────────────── */}
        {featuredTiles.length > 0 && (
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-stone-900">Shop by Category</h2>
            <div className={`grid gap-4 ${tilesGridClass(featuredTiles.length)}`}>
              {featuredTiles.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="group relative block h-[200px] overflow-hidden rounded-2xl sm:h-[320px]"
                >
                  {/* Background layer — zooms on hover */}
                  <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-105">
                    {cat.homeTileImage ? (
                      <img
                        src={cat.homeTileImage}
                        alt={cat.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-amber-400 to-orange-500" />
                    )}
                  </div>

                  {/* Gradient overlay — stays in place */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Text — stays in place */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                    <h3 className="text-xl font-bold text-white sm:text-2xl">{cat.name}</h3>
                    {cat.description && (
                      <p className="mt-1 line-clamp-1 text-sm text-white/80">{cat.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Featured products ───────────────────────────────────────────── */}
        {featured.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-stone-900">Featured products</h2>
              <Link
                href="/products"
                className="text-sm font-medium text-stone-500 transition hover:text-stone-900"
              >
                View all →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <Link key={p.id} href={`/products/${p.slug}`} className="group">
                  <Card className="h-full space-y-3 transition group-hover:shadow-md">
                    {p.images[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="aspect-square w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="aspect-square w-full rounded-xl bg-stone-100" />
                    )}
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-stone-900 group-hover:text-bark">{p.name}</h3>
                      <span className="font-black text-stone-700">
                        ₹{Number(p.price).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Category browse cards ───────────────────────────────────────── */}
        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="text-2xl font-bold text-stone-900">Finished products</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {businessCategories.finishedProducts.map((item) => (
                <div
                  className="rounded-2xl border border-stone-200 px-4 py-4 text-sm text-stone-700"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="text-2xl font-bold text-stone-900">Raw materials</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {businessCategories.rawMaterialCategories.map((item) => (
                <div
                  className="rounded-2xl border border-stone-200 px-4 py-4 text-sm text-stone-700"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </section>
      </PageShell>
    </>
  );
}
