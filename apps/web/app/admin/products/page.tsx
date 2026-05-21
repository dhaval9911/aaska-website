import Link from 'next/link';

import { PageShell } from '@aaska/ui';

import { apiFetch } from '@/lib/api';
import { auth } from '@/lib/auth';
import { DeleteButton } from '@/components/admin/delete-button';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  stock: number;
  unit: string;
  category: Category;
}

export default async function AdminProductsPage() {
  const session = await auth();
  const products = await apiFetch<Product[]>('/products', {
    token: session?.accessToken ?? '',
  }).catch(() => [] as Product[]);

  return (
    <PageShell className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-stone-900">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700"
        >
          Add product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 py-16 text-center">
          <p className="text-stone-500">No products yet.</p>
          <Link
            href="/admin/products/new"
            className="mt-4 inline-block text-sm font-semibold text-stone-700 underline"
          >
            Create your first product
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100 bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-400">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-left">Unit</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {products.map((p) => (
                <tr key={p.id} className="transition hover:bg-stone-50">
                  <td className="px-4 py-3 font-medium text-stone-900">{p.name}</td>
                  <td className="px-4 py-3 text-stone-500">{p.category.name}</td>
                  <td className="px-4 py-3 text-right text-stone-700">
                    ₹{Number(p.price).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right text-stone-700">{p.stock}</td>
                  <td className="px-4 py-3 text-stone-500">{p.unit}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="text-stone-500 transition hover:text-stone-900"
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        id={p.id}
                        name={p.name}
                        endpoint="/products"
                        redirectPath="/admin/products"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
