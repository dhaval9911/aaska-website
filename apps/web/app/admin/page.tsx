import Link from 'next/link';

import { Card, PageShell } from '@aaska/ui';

import { apiFetch } from '@/lib/api';
import { auth } from '@/lib/auth';

interface CatalogStats {
  products: number;
  categories: number;
}

interface OrderStats {
  todayOrders: number;
  pendingConfirmations: number;
  monthlyRevenue: number;
}

async function getStats(token: string): Promise<CatalogStats & OrderStats> {
  const [products, categories, orderStats] = await Promise.all([
    apiFetch<unknown[]>('/products', { token }).catch(() => []),
    apiFetch<unknown[]>('/categories', { token }).catch(() => []),
    apiFetch<OrderStats>('/orders/admin/stats', { token }).catch(
      () => ({ todayOrders: 0, pendingConfirmations: 0, monthlyRevenue: 0 }) as OrderStats,
    ),
  ]);
  return {
    products: products.length,
    categories: categories.length,
    ...orderStats,
  };
}

export default async function AdminDashboard() {
  const session = await auth();
  const stats = await getStats(session?.accessToken ?? '');

  const orderTiles = [
    {
      label: "Today's Orders",
      value: stats.todayOrders,
      href: '/admin/orders',
      accent: 'text-indigo-700',
    },
    {
      label: 'Pending WhatsApp',
      value: stats.pendingConfirmations,
      href: '/admin/orders?status=PENDING_WHATSAPP',
      accent: stats.pendingConfirmations > 0 ? 'text-amber-600' : 'text-stone-900',
    },
    {
      label: 'Revenue This Month',
      value: `Rs ${stats.monthlyRevenue.toLocaleString('en-IN')}`,
      href: '/admin/orders',
      accent: 'text-emerald-700',
    },
  ];

  const catalogTiles = [
    {
      label: 'Total Products',
      value: stats.products,
      href: '/admin/products',
      accent: 'text-stone-900',
    },
    {
      label: 'Categories',
      value: stats.categories,
      href: '/admin/categories',
      accent: 'text-stone-900',
    },
  ];

  return (
    <PageShell className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-stone-900">Dashboard</h1>
        <p className="mt-1 text-stone-500">Welcome back, {session?.user?.name}.</p>
      </div>

      {/* Order stats */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
          Orders
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {orderTiles.map((tile) => (
            <Link href={tile.href} key={tile.label}>
              <Card className="transition hover:shadow-md">
                <p className="text-sm font-medium text-stone-500">{tile.label}</p>
                <p className={`mt-2 text-3xl font-black ${tile.accent}`}>{tile.value}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Catalog stats */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
          Catalogue
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {catalogTiles.map((tile) => (
            <Link href={tile.href} key={tile.label}>
              <Card className="transition hover:shadow-md">
                <p className="text-sm font-medium text-stone-500">{tile.label}</p>
                <p className={`mt-2 text-4xl font-black ${tile.accent}`}>{tile.value}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="font-bold text-stone-900">Quick actions</h2>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/admin/orders"
              className="rounded-xl bg-stone-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-stone-700"
            >
              View all orders
            </Link>
            <Link
              href="/admin/products/new"
              className="rounded-xl border border-stone-200 px-4 py-2.5 text-center text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
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
