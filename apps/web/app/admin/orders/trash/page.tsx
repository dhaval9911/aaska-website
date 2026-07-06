import Link from 'next/link';

import { PageShell } from '@aaska/ui';

import { apiFetch } from '@/lib/api';
import { auth } from '@/lib/auth';
import { RestoreOrderButton } from './restore-button';

interface TrashedOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  whatsappNumber: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  deletedAt: string;
  items: { name: string; quantity: number }[];
}

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

export default async function OrderTrashPage() {
  const session = await auth();
  const token = session?.accessToken ?? '';
  const orders = await apiFetch<TrashedOrder[]>('/orders/admin/trash', { token }).catch(
    () => [] as TrashedOrder[],
  );

  return (
    <PageShell className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/orders"
            className="mb-1 inline-flex items-center gap-1 text-xs text-stone-400 transition hover:text-stone-600"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            All orders
          </Link>
          <h1 className="text-2xl font-black text-stone-900">Trash</h1>
        </div>
        <span className="text-sm text-stone-500">
          {orders.length} deleted order{orders.length !== 1 ? 's' : ''}
        </span>
      </div>

      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Trashed orders are hidden from revenue calculations. Use Restore to bring them back.
      </p>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 py-16 text-center">
          <p className="text-stone-500">Trash is empty.</p>
        </div>
      ) : (
        <>
          {/* ── Mobile card list ── */}
          <div className="space-y-3 md:hidden">
            {orders.map((order) => {
              const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm opacity-75"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-stone-700">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs text-red-400">
                      Deleted{' '}
                      {new Date(order.deletedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="font-semibold text-stone-900">{order.customerName}</p>
                    <span
                      className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[order.status] ?? 'bg-stone-100 text-stone-600'}`}
                    >
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>
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
                  <RestoreOrderButton orderId={order.id} token={token} />
                </div>
              );
            })}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden overflow-hidden rounded-2xl border border-stone-200 bg-white md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-100 bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="px-4 py-3 text-left">Order #</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">WhatsApp</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Deleted</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((order) => (
                  <tr key={order.id} className="opacity-75 transition hover:opacity-100">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-stone-700">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-900">{order.customerName}</td>
                    <td className="px-4 py-3 text-stone-500">+{order.whatsappNumber}</td>
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
                    <td className="px-4 py-3 text-red-400">
                      {new Date(order.deletedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RestoreOrderButton orderId={order.id} token={token} />
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
