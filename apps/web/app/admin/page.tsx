import Link from 'next/link';

import { Card, PageShell } from '@aaska/ui';

import { apiFetch } from '@/lib/api';
import { auth } from '@/lib/auth';

interface Stats {
  products: number;
  categories: number;
}

async function getStats(token: string): Promise<Stats> {
  const [products, categories] = await Promise.all([
    apiFetch<unknown[]>('/products', { token }).catch(() => []),
    apiFetch<unknown[]>('/categories', { token }).catch(() => []),
  ]);
  return { products: products.length, categories: categories.length };
}

export default async function AdminDashboard() {
  const session = await auth();
  const stats = await getStats(session?.accessToken ?? '');

  const tiles = [
    { label: 'Total Products', value: stats.products, href: '/admin/products' },
    { label: 'Categories', value: stats.categories, href: '/admin/categories' },
  ];

  return (
    <PageShell className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-stone-900">Dashboard</h1>
        <p className="mt-1 text-stone-500">Welcome back, {session?.user?.name}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link href={tile.href} key={tile.href}>
            <Card className="transition hover:shadow-md">
              <p className="text-sm font-medium text-stone-500">{tile.label}</p>
              <p className="mt-2 text-4xl font-black text-stone-900">{tile.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="font-bold text-stone-900">Quick actions</h2>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/admin/products/new"
              className="rounded-xl bg-stone-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-stone-700"
            >
              Add new product
            </Link>
            <Link
              href="/admin/categories"
              className="rounded-xl border border-stone-200 px-4 py-2.5 text-center text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              Manage categories
            </Link>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
