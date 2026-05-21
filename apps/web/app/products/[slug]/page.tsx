import { notFound } from 'next/navigation';
import Link from 'next/link';

import { Button, Card, PageShell } from '@aaska/ui';

import { apiFetch } from '@/lib/api';

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
  createdAt: string;
}

export const revalidate = 60;

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await apiFetch<Product>(`/products/${slug}`).catch(() => null);
  if (!product) notFound();

  const inStock = product.stock > 0;

  return (
    <PageShell className="space-y-8">
      <nav className="flex items-center gap-2 text-sm text-stone-400">
        <Link href="/products" className="transition hover:text-stone-700">
          Products
        </Link>
        <span>/</span>
        <span className="text-stone-600">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-3">
          {product.images.length > 0 ? (
            <>
              <img
                src={product.images[0]}
                alt={product.name}
                className="aspect-square w-full rounded-3xl object-cover"
              />
              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {product.images.slice(1).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-square w-full rounded-3xl bg-stone-100" />
          )}
        </div>

        <div className="space-y-6">
          <div>
            <Link
              href={`/products?category=${product.category.slug}`}
              className="text-sm font-medium uppercase tracking-wider text-stone-400 transition hover:text-bark"
            >
              {product.category.name}
            </Link>
            <h1 className="mt-2 text-3xl font-black text-stone-900">{product.name}</h1>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-stone-900">
              ₹{Number(product.price).toLocaleString('en-IN')}
            </span>
            <span className="text-sm text-stone-400">/ {product.unit}</span>
          </div>

          <Card className="space-y-2 bg-stone-50">
            <p className="text-sm text-stone-600">{product.description}</p>
          </Card>

          <div className="flex items-center gap-3 text-sm">
            <span
              className={`rounded-full px-3 py-1 font-medium ${
                inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
              }`}
            >
              {inStock ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>

          <div className="space-y-3">
            <Button className="w-full" disabled={!inStock}>
              {inStock ? 'Add to cart' : 'Out of stock'}
            </Button>
            <Button variant="outline" className="w-full">
              Contact for bulk order
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
