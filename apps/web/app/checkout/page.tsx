'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

import { Button, Card, Input, PageShell } from '@aaska/ui';

import { cartTotal, useCartStore } from '@/lib/cart-store';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

function getSessionId() {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('cart_session');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('cart_session', id);
  }
  return id;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const userName = session?.user?.name ?? '';

  const { items, fetchCart, clearLocalCart } = useCartStore();
  const total = cartTotal(items);

  const [customerName, setCustomerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate cart and pre-fill name
  useEffect(() => {
    fetchCart(token);
  }, [token, fetchCart]);

  useEffect(() => {
    if (userName) setCustomerName(userName);
  }, [userName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const digits = whatsapp.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Enter a valid 10-digit WhatsApp number.');
      return;
    }
    if (!customerName.trim()) {
      setError('Please enter your name.');
      return;
    }

    setSubmitting(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-cart-session': getSessionId(),
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customerName: customerName.trim(),
          whatsappNumber: digits,
          shippingAddress: address.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? 'Something went wrong.');
      }

      const order = await res.json();
      clearLocalCart();
      router.push(`/order-confirmation/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <PageShell className="flex flex-col items-center py-24 text-center">
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
        <h1 className="text-2xl font-bold text-stone-900">Your cart is empty</h1>
        <p className="mt-2 text-stone-500">Add some products before checking out.</p>
        <Link href="/products" className="mt-6">
          <Button>Browse products</Button>
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-stone-900">Checkout</h1>
        <p className="mt-1 text-stone-500">Review your order and confirm via WhatsApp.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* ── Left: Contact form ── */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="space-y-5">
            <h2 className="text-lg font-bold text-stone-900">Your details</h2>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Full name</span>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">WhatsApp number</span>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-xl border border-r-0 border-stone-200 bg-stone-50 px-3 text-sm font-medium text-stone-500">
                  +91
                </span>
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  inputMode="numeric"
                  className="rounded-l-none"
                  required
                />
              </div>
              <p className="text-xs text-stone-400">
                We'll send your order confirmation to this number.
              </p>
            </label>
          </Card>

          <Card className="space-y-5">
            <h2 className="text-lg font-bold text-stone-900">
              Shipping address{' '}
              <span className="text-sm font-normal text-stone-400">(optional)</span>
            </h2>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Address</span>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Flat / House no, Street, City, State, PIN"
                rows={3}
                className="w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">
                Notes for us <span className="text-stone-400">(optional)</span>
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Custom colour requests, gift wrapping, special instructions…"
                rows={2}
                className="w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              />
            </label>
          </Card>

          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          {/* ── WhatsApp CTA ── */}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 py-4 text-base font-bold text-white shadow-md transition hover:bg-[#20ba58] disabled:opacity-60"
          >
            {/* WhatsApp icon */}
            <svg className="h-6 w-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {submitting ? 'Placing order…' : 'Place Order via WhatsApp'}
          </button>

          <p className="text-center text-xs text-stone-400">
            After placing your order, you will receive a WhatsApp message from us to confirm details
            and share payment information.
          </p>
        </form>

        {/* ── Right: Order summary ── */}
        <div className="space-y-4">
          <Card className="space-y-4">
            <h2 className="text-lg font-bold text-stone-900">Order summary</h2>
            <ul className="divide-y divide-stone-100">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 py-3">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-stone-100">
                    {item.product.images[0] && (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="text-sm font-semibold text-stone-900">{item.product.name}</p>
                    <p className="text-xs text-stone-400">
                      {item.quantity} × ₹{Number(item.product.price).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-sm font-bold text-stone-900">
                    ₹{(Number(item.product.price) * item.quantity).toLocaleString('en-IN')}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-stone-200 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500">Subtotal</span>
                <span className="font-bold text-stone-900">₹{total.toLocaleString('en-IN')}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm text-stone-500">Shipping</span>
                <span className="text-sm text-stone-400">Calculated via WhatsApp</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-stone-200 pt-3">
                <span className="text-base font-bold text-stone-900">Total</span>
                <span className="text-xl font-black text-stone-900">
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </Card>

          <Card className="space-y-3 bg-stone-50">
            <p className="text-sm font-semibold text-stone-700">How it works</p>
            {[
              'Place your order with your WhatsApp number',
              'We confirm availability & share payment details on WhatsApp',
              'Make payment and your order is confirmed',
              'We prepare &amp; ship your handcrafted piece with care.',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-600">
                  {i + 1}
                </span>
                <p className="text-sm text-stone-600">{step}</p>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
