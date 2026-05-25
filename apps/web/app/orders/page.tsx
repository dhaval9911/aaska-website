import { redirect } from 'next/navigation';
import Link from 'next/link';

import { Button, Card, PageShell } from '@aaska/ui';

import { auth } from '@/lib/auth';

export const metadata = { title: 'My Orders — Aaska' };

const SERVER_API = process.env.API_BASE_URL ?? 'http://localhost:4000/api';

interface OrderSummary {
  id: string;
  orderNumber: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

const statusColour: Record<string, string> = {
  PENDING_WHATSAPP: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  PAYMENT_PENDING: 'bg-orange-50 text-orange-700',
  PAID: 'bg-green-50 text-green-700',
  PROCESSING: 'bg-purple-50 text-purple-700',
  SHIPPED: 'bg-indigo-50 text-indigo-700',
  DELIVERED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-600',
};

const statusLabel: Record<string, string> = {
  PENDING_WHATSAPP: 'Awaiting WhatsApp',
  CONFIRMED: 'Confirmed',
  PAYMENT_PENDING: 'Payment pending',
  PAID: 'Paid',
  PROCESSING: 'Being prepared',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default async function OrdersPage() {
  const session = await auth();
  if (!session) redirect('/login?callbackUrl=/orders');

  const token = (session as { accessToken?: string }).accessToken;

  let orders: OrderSummary[] = [];
  try {
    const res = await fetch(`${SERVER_API}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) orders = await res.json();
  } catch {
    // show empty state on fetch failure
  }

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
            When you place an order it will appear here.
          </p>
          <Link href="/products" className="mt-6">
            <Button>Browse products</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/order-confirmation/${order.id}`} className="group block">
              <Card className="transition group-hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-bold tracking-wider text-stone-900">{order.orderNumber}</p>
                    <p className="text-sm text-stone-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-stone-400">
                      {order.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-lg font-black text-stone-900">
                      ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColour[order.status] ?? 'bg-stone-100 text-stone-600'}`}
                    >
                      {statusLabel[order.status] ?? order.status}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
