'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

import { Card, Input, PageShell } from '@aaska/ui';

import { cartTotal, useCartStore } from '@/lib/cart-store';
import useIsMobile from '@/hooks/useIsMobile';
import { MobileCheckoutWizard } from '@/components/checkout/MobileCheckoutWizard';

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

const WaIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const STEPS = [
  { label: 'Cart', done: true, current: false },
  { label: 'Details', done: false, current: true },
  { label: 'WhatsApp', done: false, current: false },
  { label: 'Done', done: false, current: false },
];

const TRUST_BADGES = [
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    ),
    label: 'Secure WhatsApp Checkout',
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
      />
    ),
    label: 'No Advance Payment',
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    ),
    label: 'Easy Returns',
  },
];

// Desktop form — all hooks live in this component so the Rules of Hooks
// are never violated by the isMobile conditional in the shell below.
function DesktopCheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const userName = session?.user?.name ?? '';
  const savedWhatsapp =
    (session?.user as { whatsappNumber?: string | null } | undefined)?.whatsappNumber ?? '';

  const { items, fetchCart, clearLocalCart } = useCartStore();
  const total = cartTotal(items);

  const [customerName, setCustomerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCart(token);
  }, [token, fetchCart]);

  useEffect(() => {
    if (userName) setCustomerName(userName);
  }, [userName]);

  useEffect(() => {
    if (savedWhatsapp) setWhatsapp(savedWhatsapp);
  }, [savedWhatsapp]);

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

  // ── Empty cart state ─────────────────────────────────────────────────────
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
        <Link
          href="/products"
          className="mt-6 rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
        >
          Browse products
        </Link>
      </PageShell>
    );
  }

  // ── Checkout ─────────────────────────────────────────────────────────────
  return (
    <PageShell className="space-y-6 pb-12">
      {/* Step indicator */}
      <div className="flex items-start justify-center gap-0 pt-2">
        {STEPS.map((step, i) => (
          <Fragment key={step.label}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                  step.done
                    ? 'bg-stone-800 text-white'
                    : step.current
                      ? 'bg-[#25D366] text-white shadow-md shadow-[#25D366]/30'
                      : 'bg-stone-100 text-stone-400'
                }`}
              >
                {step.done ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[11px] font-medium ${step.current ? 'text-stone-900' : 'text-stone-400'}`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1 mt-4 h-px w-10 flex-shrink-0 sm:w-14 ${step.done ? 'bg-stone-700' : 'bg-stone-200'}`}
              />
            )}
          </Fragment>
        ))}
      </div>

      {/* Page header */}
      <div className="text-center">
        <h1 className="text-2xl font-black text-stone-900 sm:text-3xl">Checkout</h1>
        <p className="mt-1 text-sm text-stone-500">Review your order and confirm via WhatsApp.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* ── Left: Contact form ── */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Contact details */}
          <Card className="space-y-5">
            <h2 className="text-base font-bold text-stone-900">Your details</h2>

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
              <p className="text-xs text-stone-400">We will confirm your order on this number.</p>
            </label>
          </Card>

          {/* Shipping / notes */}
          <Card className="space-y-5">
            <h2 className="text-base font-bold text-stone-900">
              Delivery info <span className="text-sm font-normal text-stone-400">(optional)</span>
            </h2>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-700">Shipping address</span>
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
                Notes for us <span className="font-normal text-stone-400">(optional)</span>
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Custom colour requests, gift wrapping, special instructions..."
                rows={2}
                className="w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              />
            </label>
          </Card>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* WhatsApp CTA */}
          <button
            type="submit"
            disabled={submitting}
            className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#25D366]/25 transition hover:bg-[#20ba58] active:scale-[.98] disabled:opacity-60"
          >
            <WaIcon className="h-6 w-6 flex-shrink-0" />
            {submitting ? 'Placing order...' : 'Place Order via WhatsApp'}
            {!submitting && (
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            )}
          </button>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3">
            {TRUST_BADGES.map((badge) => (
              <div
                key={badge.label}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-stone-50 px-2 py-3 text-center"
              >
                <svg
                  className="h-5 w-5 text-stone-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  {badge.icon}
                </svg>
                <span className="text-[10px] font-semibold leading-tight text-stone-600">
                  {badge.label}
                </span>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-stone-400">
            After placing your order, we will send you payment details on WhatsApp.
          </p>
        </form>

        {/* ── Right: Order summary ── */}
        <div className="space-y-4">
          <Card className="space-y-4">
            <h2 className="text-base font-bold text-stone-900">Order summary</h2>
            <ul className="divide-y divide-stone-100">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 py-3">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-stone-100">
                    {item.product.images[0] && (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-center min-w-0">
                    <p className="truncate text-sm font-semibold text-stone-900">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-stone-400">
                      {item.quantity} {'×'} {'₹'}
                      {Number(item.product.price).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-sm font-bold text-stone-900">
                    {'₹'}
                    {(Number(item.product.price) * item.quantity).toLocaleString('en-IN')}
                  </span>
                </li>
              ))}
            </ul>

            <div className="border-t border-stone-200 pt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">Subtotal</span>
                <span className="font-semibold text-stone-900">
                  {'₹'}
                  {total.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">Shipping</span>
                <span className="text-stone-400">Via WhatsApp</span>
              </div>
              <div className="flex items-center justify-between border-t border-stone-200 pt-2">
                <span className="font-bold text-stone-900">Total</span>
                <span className="text-xl font-black text-stone-900">
                  {'₹'}
                  {total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </Card>

          {/* How it works */}
          <Card className="space-y-3 bg-amber-50/60">
            <p className="text-sm font-bold text-stone-800">How it works</p>
            {[
              'Place your order with your WhatsApp number',
              'We confirm availability and share payment details on WhatsApp',
              'Make payment and your order is confirmed',
              'We handcraft and ship your piece with care',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-800">
                  {i + 1}
                </span>
                <p className="text-sm text-stone-700">{step}</p>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

// Shell — only calls useIsMobile, then delegates to the right component.
// Keeps every component's hook list stable and unconditional.
export default function CheckoutPage() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileCheckoutWizard /> : <DesktopCheckoutPage />;
}
