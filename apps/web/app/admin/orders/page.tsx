import Link from 'next/link';

import { PageShell } from '@aaska/ui';

import { apiFetch } from '@/lib/api';
import { auth } from '@/lib/auth';
import { TrashRowButton } from './trash-row-button';

interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  whatsappNumber: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING_WHATSAPP' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Pmt Pending', value: 'PAYMENT_PENDING' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Shipped', value: 'SHIPPED' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING_WHATSAPP: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  PAYMENT_PENDING: 'bg-orange-50 text-orange-700',
  PAID: 'bg-green-50 text-green-700',
  PROCESSING: 'bg-purple-50 text-purple-700',
  SHIPPED: 'bg-indigo-50 text-indigo-700',
  DELIVERED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-600',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_WHATSAPP: 'Awaiting WhatsApp',
  CONFIRMED: 'Confirmed',
  PAYMENT_PENDING: 'Payment Pending',
  PAID: 'Paid',
  PROCESSING: 'Preparing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const session = await auth();
  const token = session?.accessToken ?? '';

  const path = status ? `/orders/admin/all?status=${encodeURIComponent(status)}` : '/orders/admin/all';
  const orders = await apiFetch<AdminOrder[]>(path, { token }).catch(() => [] as AdminOrder[]);

  return (
    <PageShell className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-stone-900">Orders</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-stone-500">
            {orders.length} order{orders.length !== 1 ? 's' : ''}
          </span>
          <Link
            href="/admin/orders/trash"
            className="flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-1 text-xs font-medium text-stone-500 transition hover:bg-stone-50"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Trash
          </Link>
        </div>
      </div>

      {/* Status filter tabs — horizontally scrollable on mobile */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
          {STATUS_TABS.map((tab) => {
            const isActive = (status ?? '') === tab.value;
            const href = tab.value ? `/admin/orders?status=${tab.value}` : '/admin/orders';
            return (
              <Link
                key={tab.value}
                href={href}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-stone-900 text-white'
                    : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 py-16 text-center">
          <p className="text-stone-500">No orders found.</p>
        </div>
      ) : (
        <>
          {/* ── Mobile card list (hidden on md+) ── */}
          <div className="space-y-3 md:hidden">
            {orders.map((order) => {
              const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
                >
                  {/* Top row: order # + date */}
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-stone-700">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs text-stone-400">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Customer name + status badge */}
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="font-semibold text-stone-900">{order.customerName}</p>
                    <span
                      className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[order.status] ?? 'bg-stone-100 text-stone-600'}`}
                    >
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>

                  {/* WhatsApp + items + total */}
                  <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                        WhatsApp
                      </p>
                      <p className="mt-0.5 text-stone-700">+{order.whatsappNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                        Items
                      </p>
                      <p className="mt-0.5 text-stone-700">{itemCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                        Total
                      </p>
                      <p className="mt-0.5 font-bold text-stone-900">
                        ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex flex-1 items-center justify-center rounded-xl bg-stone-900 py-2.5 text-sm font-semibold text-white transition active:bg-stone-700"
                    >
                      View Order →
                    </Link>
                    <TrashRowButton orderId={order.id} token={token} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Desktop table (hidden on mobile) ── */}
          <div className="hidden overflow-hidden rounded-2xl border border-stone-200 bg-white md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-100 bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="px-4 py-3 text-left">Order #</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">WhatsApp</th>
                  <th className="px-4 py-3 text-right">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((order) => (
                  <tr key={order.id} className="transition hover:bg-stone-50">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-stone-700">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-900">{order.customerName}</td>
                    <td className="px-4 py-3 text-stone-500">+{order.whatsappNumber}</td>
                    <td className="px-4 py-3 text-right text-stone-500">
                      {order.items.reduce((n, i) => n + i.quantity, 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-stone-900">
                      ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[order.status] ?? 'bg-stone-100 text-stone-600'}`}
                      >
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-400">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-sm font-medium text-stone-600 transition hover:text-stone-900"
                        >
                          View →
                        </Link>
                        <TrashRowButton orderId={order.id} token={token} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PageShell>
  );
}
