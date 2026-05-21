import Link from 'next/link';

import { businessCategories } from '@aaska/config';
import { Button, Card, PageShell } from '@aaska/ui';

import { apiFetch } from '@/lib/api';
import { auth } from '@/lib/auth';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  images: string[];
  category: Category;
}

export const revalidate = 60;

export default async function HomePage() {
  const [session, products] = await Promise.all([
    auth(),
    apiFetch<Product[]>('/products').catch(() => [] as Product[]),
  ]);
  const featured = products.slice(0, 3);

  return (
    <PageShell className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <Card className="overflow-hidden bg-stone-950 text-white">
          <div className="space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_28%)] p-8 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-300">
              Resin art, delivered
            </p>
            <h1 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
              Handcrafted resin art for your home, gifting, and workspace.
            </h1>
            <p className="max-w-2xl text-base text-stone-300">
              Every piece is hand-poured and unique. Browse our collection of frames, trays,
              coasters, jewellery, and raw materials.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products">
                <Button className="bg-white text-stone-950 hover:bg-stone-100">Shop now</Button>
              </Link>
              {!session && (
                <Link href="/register">
                  <Button
                    variant="outline"
                    className="border-stone-600 text-white hover:bg-stone-900"
                  >
                    Create account
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>

        <Card className="bg-white/80">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-clay">Why Aaska</p>
          <div className="mt-4 grid gap-4">
            {[
              'All pieces handcrafted to order',
              'Premium epoxy resin & pigments',
              'Custom sizes and colour requests',
              'Raw material kits for artists',
            ].map((item) => (
              <div
                className="rounded-2xl bg-stone-100 px-4 py-4 text-sm font-medium text-stone-700"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </Card>
      </section>

      {featured.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-stone-900">Featured products</h2>
            <Link
              href="/products"
              className="text-sm font-medium text-stone-500 transition hover:text-stone-900"
            >
              View all →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <Link key={p.id} href={`/products/${p.slug}`} className="group">
                <Card className="h-full space-y-3 transition group-hover:shadow-md">
                  {p.images[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="aspect-square w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="aspect-square w-full rounded-xl bg-stone-100" />
                  )}
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-stone-900 group-hover:text-bark">{p.name}</h3>
                    <span className="font-black text-stone-700">
                      ₹{Number(p.price).toLocaleString('en-IN')}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-2xl font-bold text-stone-900">Finished products</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {businessCategories.finishedProducts.map((item) => (
              <div
                className="rounded-2xl border border-stone-200 px-4 py-4 text-sm text-stone-700"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-2xl font-bold text-stone-900">Raw materials</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {businessCategories.rawMaterialCategories.map((item) => (
              <div
                className="rounded-2xl border border-stone-200 px-4 py-4 text-sm text-stone-700"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </Card>
      </section>
    </PageShell>
  );
}
