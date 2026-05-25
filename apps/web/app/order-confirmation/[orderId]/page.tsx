import { notFound } from 'next/navigation';
import Link from 'next/link';

import { appConfig } from '@aaska/config';
import { Button, Card, PageShell } from '@aaska/ui';

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
      `Hi Aaska! I'd like to confirm my order *${order.orderNumber}*.`,
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

  const statusLabel: Record<string, string> = {
    PENDING_WHATSAPP: 'Awaiting WhatsApp confirmation',
    CONFIRMED: 'Confirmed',
    PAYMENT_PENDING: 'Payment pending',
    PAID: 'Paid',
    PROCESSING: 'Being prepared',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  };

  return (
    <PageShell className="max-w-2xl mx-auto space-y-8">
      {/* Success banner */}
      <div className="flex flex-col items-center py-10 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-stone-900">Order placed!</h1>
        <p className="mt-2 text-stone-500">
          Thank you, <span className="font-semibold text-stone-700">{order.customerName}</span>.
          Your order has been received.
        </p>
        <div className="mt-4 rounded-full bg-stone-100 px-5 py-2 text-sm font-bold tracking-widest text-stone-700">
          {order.orderNumber}
        </div>
      </div>

      {/* WhatsApp CTA */}
      <Card className="space-y-4 border-[#25D366]/30 bg-[#f0fdf4]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#25D366]">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-stone-900">Open WhatsApp to confirm</p>
            <p className="text-sm text-stone-600">
              Tap the button below to open WhatsApp with your order details pre-filled. Send the
              message and we'll confirm your order shortly.
            </p>
          </div>
        </div>
        <WhatsAppButton href={waLink} />
      </Card>

      {/* Order details */}
      <Card className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">Order details</h2>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            {statusLabel[order.status] ?? order.status}
          </span>
        </div>

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
                  {item.quantity} × ₹{item.price.toLocaleString('en-IN')} / {item.unit}
                </p>
              </div>
              <span className="flex-shrink-0 text-sm font-bold text-stone-900">
                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
              </span>
            </li>
          ))}
        </ul>

        <div className="border-t border-stone-200 pt-4 space-y-1">
          <div className="flex justify-between text-sm text-stone-500">
            <span>Subtotal</span>
            <span>₹{total.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm text-stone-500">
            <span>Shipping</span>
            <span className="text-stone-400">Via WhatsApp</span>
          </div>
          <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-black text-stone-900">
            <span>Total</span>
            <span>₹{total.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {order.shippingAddress && (
          <div className="rounded-xl bg-stone-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Ship to</p>
            <p className="mt-1 text-sm text-stone-700 whitespace-pre-line">
              {order.shippingAddress}
            </p>
          </div>
        )}
      </Card>

      {/* What next */}
      <Card className="space-y-3 bg-stone-50">
        <p className="text-sm font-semibold text-stone-700">What happens next?</p>
        {[
          'Open WhatsApp and send the pre-filled message above',
          "We'll reply with payment details within a few hours",
          'Make payment to confirm your order',
          'We handcraft your piece and ship it with love and care.',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-600">
              {i + 1}
            </span>
            <p className="text-sm text-stone-600">{step}</p>
          </div>
        ))}
      </Card>

      <div className="flex justify-center">
        <Link href="/products">
          <Button variant="outline">Continue shopping</Button>
        </Link>
      </div>
    </PageShell>
  );
}
