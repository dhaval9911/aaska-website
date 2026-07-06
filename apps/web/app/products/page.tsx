import type { Metadata } from 'next';

import { PageShell } from '@aaska/ui';

import { apiFetch } from '@/lib/api';
import { ProductsClient } from '@/components/product/ProductsClient';
import type { SortOrder } from '@/components/product/MobileFilterSheet';

export const metadata: Metadata = {
  title: 'All Products | Resin Dreams',
  description: 'Browse our full collection of resin art products and raw materials.',
};

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

export const revalidate = 60;

const VALID_SORTS: SortOrder[] = ['newest', 'price-asc', 'price-desc', 'popular'];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; search?: string }>;
}) {
  const params = await searchParams;
  const products = await apiFetch<Product[]>('/products').catch(() => [] as Product[]);

  const initialCategory = params.category ?? undefined;
  const initialSort: SortOrder = VALID_SORTS.includes(params.sort as SortOrder)
    ? (params.sort as SortOrder)
    : 'newest';

  return (
    <PageShell className="space-y-6">
      {/* Header — always shown */}
      <div>
        <h1 className="text-3xl font-black text-stone-900">All products</h1>
        <p className="mt-1 text-stone-500">{products.length} items available</p>
      </div>

      <ProductsClient
        products={products}
        initialCategory={initialCategory}
        initialSort={initialSort}
      />
    </PageShell>
  );
}
