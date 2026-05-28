import Link from 'next/link';

import { Card, PageShell } from '@aaska/ui';

import { apiFetch } from '@/lib/api';
import { AddToCart } from '@/components/add-to-cart';
import { WishlistButton } from '@/components/wishlist-button';

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
  stock: number;
  unit: string;
  images: string[];
  category: Category;
}

export const revalidate = 60;

export default async function ProductsPage() {
  const products = await apiFetch<Product[]>('/products').catch(() => [] as Product[]);

  return (
    <PageShell className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-stone-900">All products</h1>
        <p className="mt-1 text-stone-500">{products.length} items available</p>
      </div>

      {products.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-stone-400">No products available yet. Check back soon.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.slug}`} className="group">
              <Card className="h-full space-y-3 transition group-hover:shadow-md">
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
                  <div className="absolute right-2 top-2">
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
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
                    {p.category.name}
                  </p>
                  <h2 className="mt-1 font-bold text-stone-900 group-hover:text-bark">{p.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-stone-500">{p.description}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg font-black text-stone-900">
                    ₹{Number(p.price).toLocaleString('en-IN')}
                  </span>
                  <AddToCart productId={p.id} stock={p.stock} size="sm" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
