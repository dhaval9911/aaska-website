import { redirect } from 'next/navigation';
import Link from 'next/link';

import { Card, PageShell, Button } from '@aaska/ui';

import { auth } from '@/lib/auth';

export const metadata = { title: 'My Orders — Aaska' };

export default async function OrdersPage() {
  const session = await auth();

  if (!session) {
    redirect('/login?callbackUrl=/orders');
  }

  // Orders feature coming soon — API endpoint not yet built
  const orders: never[] = [];

  return (
    <PageShell className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-stone-900">My Orders</h1>
        <p className="text-sm text-stone-500">
          Logged in as <span className="font-medium text-stone-700">{session.user?.email}</span>
        </p>
      </div>

      {orders.length === 0 ? (
        <Card className="flex flex-col items-center py-20 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100">
            <svg
              className="h-8 w-8 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 11H4L5 9z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-stone-900">No orders yet</h2>
          <p className="mt-2 max-w-sm text-sm text-stone-500">
            When you place an order it will appear here. Browse our collection and find something
            you love.
          </p>
          <Link href="/products" className="mt-6">
            <Button>Browse products</Button>
          </Link>
        </Card>
      ) : null}
    </PageShell>
  );
}
