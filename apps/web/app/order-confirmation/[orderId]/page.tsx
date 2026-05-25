import { notFound } from 'next/navigation';
import Link from 'next/link';

import { appConfig } from '@aaska/config';
import { Card, PageShell } from '@aaska/ui';

import { WhatsAppButton } from './whatsapp-button';

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
}

const STATUS_LABEL: Record<string, string> = {
  PENDING_WHATSAPP: 'Awaiting WhatsApp confirmation',
  CONFIRMED: 'Confirmed',
  PAYMENT_PENDING: 'Payment pending',
  PAID: 'Paid',
  PROCESSING: 'Being prepared',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const res = await fetch(`${SERVER_API}/orders/${orderId}`, { cache: 'no-store' });
  if (!res.ok) notFound();
  const order: Order = await res.json();

  const total = Number(order.totalAmount);

  // Build WhatsApp deep-link message
  const itemLines = order.items
    .map((i) => `- ${i.name} x${i.quantity} = Rs ${(i.price * i.quantity).toLocaleString('en-IN')}`)
    .join('\n');

  const waText = encodeURIComponent(
    [
      `Hi Aaska! I would like to confirm my order *${order.orderNumber}*.`,
      '',
      '*Items:*',
      itemLines,
      '',
      `*Total:* Rs ${total.toLocaleString('en-IN')}`,
      '',
      `Name: ${order.customerName}`,
      `WhatsApp: +${order.whatsappNumber}`,
      order.shippingAddress ? `\nShipping to:\n${order.shippingAddress}` : '',
      order.notes ? `\nNotes: ${order.notes}` : '',
      '',
      'Please confirm my order. Thank you!',
    ]
      .filter((l) => l !== undefined)
      .join('\n'),
  );

  const waLink = `https://wa.me/${appConfig.businessWhatsapp}?text=${waText}`;

  return (
    <PageShell className="mx-auto max-w-xl space-y-6 pb-12">
      {/* ── Success hero ─────────────────────────────────────────────── */}
      <div className="flex flex-col items-center pt-8 pb-2 text-center">
        {/* Animated checkmark ring */}
        <div className="relative mb-5 flex h-24 w-24 items-center justify-center">
          {/* Outer pulse ring */}
          <div className="absolute h-24 w-24 animate-ping rounded-full bg-green-200 opacity-30" />
          {/* Middle ring */}
          <div className="absolute h-20 w-20 rounded-full bg-green-100" />
          {/* Inner circle with check */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-black text-stone-900">Order Placed!</h1>
        <p className="mt-2 text-stone-500">
          Thank you, <span className="font-semibold text-stone-800">{order.customerName}</span>.
          Your order has been received.
        </p>

        {/* Order number pill */}
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-stone-100 px-5 py-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-stone-500">
            Order
          </span>
          <span className="font-black tracking-wider text-stone-900">{order.orderNumber}</span>
        </div>
      </div>

      {/* ── WhatsApp CTA card ─────────────────────────────────────────── */}
      <Card className="space-y-4 border-[#25D366]/20 bg-gradient-to-br from-[#f0fdf4] to-white">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#25D366]">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-stone-900">One step left — open WhatsApp</p>
            <p className="mt-0.5 text-sm text-stone-600">
              Your order details are pre-filled. Just tap Send and we will confirm shortly.
            </p>
          </div>
        </div>
        <WhatsAppButton href={waLink} />
      </Card>

      {/* ── Order summary ─────────────────────────────────────────────── */}
      <Card className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-stone-900">Order summary</h2>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
        </div>

        <ul className="divide-y divide-stone-100">
          {order.items.map((item, i) => (
            <li key={i} className="flex gap-3 py-3">
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-stone-100">
                {item.images[0] && (
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col justify-center min-w-0">
                <p className="truncate text-sm font-semibold text-stone-900">{item.name}</p>
                <p className="text-xs text-stone-400">
                  {item.quantity} {'×'} {'₹'}
                  {item.price.toLocaleString('en-IN')} / {item.unit}
                </p>
              </div>
              <span className="flex-shrink-0 text-sm font-bold text-stone-900">
                {'₹'}
                {(item.price * item.quantity).toLocaleString('en-IN')}
              </span>
            </li>
          ))}
        </ul>

        <div className="space-y-1.5 border-t border-stone-100 pt-4">
          <div className="flex justify-between text-sm text-stone-500">
            <span>Subtotal</span>
            <span>
              {'₹'}
              {total.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between text-sm text-stone-500">
            <span>Shipping</span>
            <span className="text-stone-400">Via WhatsApp</span>
          </div>
          <div className="flex justify-between border-t border-stone-200 pt-2 font-black text-stone-900">
            <span>Total</span>
            <span>
              {'₹'}
              {total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {order.shippingAddress && (
          <div className="rounded-xl bg-stone-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Ship to</p>
            <p className="mt-1 whitespace-pre-line text-sm text-stone-700">
              {order.shippingAddress}
            </p>
          </div>
        )}
      </Card>

      {/* ── What happens next ─────────────────────────────────────────── */}
      <Card className="space-y-3 border-amber-100 bg-amber-50/50">
        <p className="text-sm font-bold text-stone-800">What happens next?</p>
        {[
          'Open WhatsApp and send the pre-filled message above',
          'We reply with payment details within a few hours',
          'Make payment — your order is then confirmed',
          'We handcraft your piece and ship it with care',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-800">
              {i + 1}
            </span>
            <p className="text-sm text-stone-700">{step}</p>
          </div>
        ))}
      </Card>

      {/* ── Footer actions ────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3">
        <Link
          href="/orders"
          className="text-sm font-medium text-stone-600 underline underline-offset-4 transition hover:text-stone-900"
        >
          View all my orders
        </Link>
        <Link href="/products" className="text-sm text-stone-400 transition hover:text-stone-600">
          Continue shopping
        </Link>
      </div>
    </PageShell>
  );
}
