import { notFound } from 'next/navigation';
import Link from 'next/link';

import { appConfig } from '@aaska/config';
import { Card, PageShell } from '@aaska/ui';

import { auth } from '@/lib/auth';
import { StatusForm } from './status-form';

const SERVER_API = process.env.API_BASE_URL ?? 'http://localhost:4000/api';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  images: string[];
  unit: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  whatsappNumber: string;
  items: OrderItem[];
  totalAmount: string;
  status: string;
  shippingAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const token = session?.accessToken ?? '';

  const res = await fetch(`${SERVER_API}/orders/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) notFound();
  const order: Order = await res.json();

  const total = Number(order.totalAmount);

  // Build WhatsApp message customer link
  const waMessage = encodeURIComponent(
    `Hi ${order.customerName}! This is Aaska regarding your order *${order.orderNumber}*. `,
  );
  const waLink = `https://wa.me/${appConfig.businessWhatsapp.startsWith('91') ? '' : '91'}${order.whatsappNumber}?text=${waMessage}`;

  return (
    <PageShell className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/orders"
            className="mb-2 inline-flex items-center gap-1 text-xs text-stone-400 transition hover:text-stone-600"
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
          <h1 className="text-2xl font-black text-stone-900">{order.orderNumber}</h1>
          <p className="mt-0.5 text-sm text-stone-500">
            Placed{' '}
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}{' '}
            at{' '}
            {new Date(order.createdAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <span
          className={`mt-1 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[order.status] ?? 'bg-stone-100 text-stone-600'}`}
        >
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Items */}
          <Card className="space-y-4">
            <h2 className="font-bold text-stone-900">Items</h2>
            <ul className="divide-y divide-stone-100">
              {order.items.map((item, i) => (
                <li key={i} className="flex gap-3 py-3">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-stone-100">
                    {item.images[0] && (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="text-sm font-semibold text-stone-900">{item.name}</p>
                    <p className="text-xs text-stone-400">
                      {item.quantity} x Rs {item.price.toLocaleString('en-IN')} / {item.unit}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-sm font-bold text-stone-900">
                    Rs {(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-stone-200 pt-3 space-y-1">
              <div className="flex justify-between text-sm text-stone-500">
                <span>Subtotal</span>
                <span>Rs {total.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm text-stone-500">
                <span>Shipping</span>
                <span>Via WhatsApp</span>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-2 font-black text-stone-900">
                <span>Total</span>
                <span>Rs {total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </Card>

          {/* Customer */}
          <Card className="space-y-4">
            <h2 className="font-bold text-stone-900">Customer</h2>
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Name
                </p>
                <p className="mt-1 text-stone-900">{order.customerName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  WhatsApp
                </p>
                <p className="mt-1 text-stone-900">+{order.whatsappNumber}</p>
              </div>
              {order.shippingAddress && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Shipping address
                  </p>
                  <p className="mt-1 whitespace-pre-line text-stone-900">{order.shippingAddress}</p>
                </div>
              )}
              {order.notes && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Notes
                  </p>
                  <p className="mt-1 text-stone-900">{order.notes}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Status update */}
          <Card>
            <StatusForm orderId={order.id} currentStatus={order.status} token={token} />
          </Card>

          {/* WhatsApp quick action */}
          <Card className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Quick actions
            </p>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#20ba58]"
            >
              <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Message Customer
            </a>
            <Link
              href={`/order-confirmation/${order.id}`}
              target="_blank"
              className="flex w-full items-center justify-center rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
            >
              View customer receipt
            </Link>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
