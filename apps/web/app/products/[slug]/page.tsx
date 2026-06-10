import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { apiFetch } from '@/lib/api';
import { ProductClientView } from '@/components/product/ProductClientView';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface ProductVariant {
  id: string;
  label: string;
  price: string;
  compareAtPrice: string | null;
  showComparePrice: boolean;
  stock: number;
  isDefault: boolean;
  displayOrder: number;
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
  hasVariants: boolean;
  variants: ProductVariant[];
  showStock: boolean;
}

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await apiFetch<Product>(`/products/${slug}`).catch(() => null);
  if (!product) return {};
  const description = product.description.replace(/<[^>]+>/g, '').slice(0, 155);
  return {
    title: `${product.name} | Resin Dreams`,
    description,
    openGraph: {
      title: `${product.name} | Resin Dreams`,
      description,
      images: product.images[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await apiFetch<Product>(`/products/${slug}`).catch(() => null);
  if (!product) notFound();

  // Layout (PageShell vs full-bleed) is handled inside ProductClientView
  // so mobile gets an edge-to-edge carousel while desktop keeps the container.
  return <ProductClientView product={product} />;
}
