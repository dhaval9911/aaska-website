'use client';

import Link from 'next/link';

import { Button, Card } from '@aaska/ui';

import useIsMobile from '@/hooks/useIsMobile';
import { AddToCart } from '@/components/add-to-cart';
import { WishlistButton } from '@/components/wishlist-button';
import { MobileProductDetail } from './MobileProductDetail';

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
    stock: number;
    unit: string;
    images: string[];
    category: Category;
    createdAt: string;
  };
}

export function ProductClientView({ product }: ProductClientViewProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileProductDetail product={product} />;
  }

  // ── Desktop layout (original) ──
  const inStock = product.stock > 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      {/* Left: image gallery */}
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

      {/* Right: product info */}
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
          <div className="flex items-center gap-3">
            <AddToCart productId={product.id} stock={product.stock} className="flex-1" />
            <WishlistButton
              item={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                images: product.images,
                unit: product.unit,
              }}
              size="md"
            />
          </div>
          <Button variant="outline" className="w-full">
            Contact for bulk order
          </Button>
        </div>
      </div>
    </div>
  );
}
