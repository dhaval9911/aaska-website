import { notFound } from 'next/navigation';

import { PageShell } from '@aaska/ui';

import { apiFetch } from '@/lib/api';
import { auth } from '@/lib/auth';
import { ProductForm } from '@/components/admin/product-form';

interface Category {
  id: string;
  name: string;
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
  categoryId: string;
  category: Category;
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const token = session?.accessToken ?? '';

  const [product, categories] = await Promise.all([
    apiFetch<Product>(`/products/${id}`, { token }).catch(() => null),
    apiFetch<Category[]>('/categories', { token }).catch(() => [] as Category[]),
  ]);

  if (!product) notFound();

  return (
    <PageShell className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-black text-stone-900">Edit: {product.name}</h1>
      <ProductForm
        categories={categories}
        token={token}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: Number(product.price),
          stock: product.stock,
          unit: product.unit as
            | 'KG'
            | 'LITRE'
            | 'ML'
            | 'METER'
            | 'PACK'
            | 'PIECE'
            | 'BOTTLE'
            | 'COMBO_KIT',
          images: product.images,
          categoryId: product.categoryId,
        }}
      />
    </PageShell>
  );
}
