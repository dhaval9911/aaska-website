import { notFound } from 'next/navigation';
import Link from 'next/link';

import { PageShell } from '@aaska/ui';

import { apiFetch } from '@/lib/api';
import { ProductClientView } from '@/components/product/ProductClientView';

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

  return (
    <PageShell className="space-y-8">
      {/* Breadcrumb — hidden on mobile (the mobile view has a back button in the carousel) */}
      <nav className="hidden items-center gap-2 text-sm text-stone-400 md:flex">
        <Link href="/products" className="transition hover:text-stone-700">
          Products
        </Link>
        <span>/</span>
        <span className="text-stone-600">{product.name}</span>
      </nav>

      <ProductClientView product={product} />
    </PageShell>
  );
}
