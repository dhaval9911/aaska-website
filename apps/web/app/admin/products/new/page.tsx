import { PageShell } from '@aaska/ui';

import { apiFetch } from '@/lib/api';
import { auth } from '@/lib/auth';
import { ProductForm } from '@/components/admin/product-form';

interface Category {
  id: string;
  name: string;
}

export default async function NewProductPage() {
  const session = await auth();
  const categories = await apiFetch<Category[]>('/categories', {
    token: session?.accessToken ?? '',
  }).catch(() => [] as Category[]);

  return (
    <PageShell className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-black text-stone-900">New product</h1>
      <ProductForm categories={categories} token={session?.accessToken ?? ''} />
    </PageShell>
  );
}
