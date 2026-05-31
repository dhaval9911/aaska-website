import { notFound } from 'next/navigation';

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
  compareAtPrice: string | null;
  showComparePrice: boolean;
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

  // Layout (PageShell vs full-bleed) is handled inside ProductClientView
  // so mobile gets an edge-to-edge carousel while desktop keeps the container.
  return <ProductClientView product={product} />;
}
