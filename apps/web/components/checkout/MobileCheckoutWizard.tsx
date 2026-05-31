'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

import { cartTotal, useCartStore } from '@/lib/cart-store';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('cart_session');
  if (!id) {
    id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    localStorage.setItem('cart_session', id);
  }
  return id;
}

const WaIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

function StepBar({ step, onBack }: { step: number; onBack?: () => void }) {
  const labels = ['Cart', 'Details', 'Review'];
  return (
    <div className="sticky top-14 z-30 flex items-center gap-3 border-b border-stone-100 bg-white/95 px-4 py-3 backdrop-blur-sm">
      {/* Back button */}
      <div className="w-8 flex-shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition active:bg-stone-100"
            aria-label="Go back"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Step dots */}
      <div className="flex flex-1 items-center justify-center gap-1.5">
        {labels.map((label, i) => {
          const s = i + 1;
          const done = s < step;
          const current = s === step;
          return (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  done
                    ? 'bg-stone-800 text-white'
                    : current
                      ? 'bg-[#D4860B] text-white shadow-sm shadow-[#D4860B]/40'
                      : 'bg-stone-100 text-stone-400'
                }`}
              >
                {done ? (
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              <span
                className={`text-[10px] font-medium ${current ? 'text-stone-900' : 'text-stone-400'}`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step counter */}
      <span className="w-12 flex-shrink-0 text-right text-xs text-stone-400">{step} of 3</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Cart Review
// ---------------------------------------------------------------------------

function Step1({ token, onNext }: { token?: string; onNext: () => void }) {
  const { items, updateItem, removeItem } = useCartStore();
  const total = cartTotal(items);
  const [couponOpen, setCouponOpen] = useState(false);
  const [coupon, setCoupon] = useState('');

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100">
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
        <p className="font-bold text-stone-900">Your cart is empty</p>
        <p className="text-sm text-stone-500">Add some products first.</p>
        <Link
          href="/products"
          className="mt-2 rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className="px-4 pt-4">
        <h1 className="text-xl font-black text-stone-900">Your Cart</h1>
        <p className="mt-0.5 text-sm text-stone-500">
          {items.length} {items.length === 1 ? 'item' : 'items'} · ₹{total.toLocaleString('en-IN')}
        </p>
      </div>

      {/* Item list */}
      <ul className="mt-4 divide-y divide-stone-100 bg-white">
        {items.map((item) => (
          <li key={item.id} className="flex gap-3 px-4 py-4">
            {/* Thumbnail */}
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-stone-100">
              {item.product.images[0] ? (
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full" />
              )}
            </div>

            {/* Details */}
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-sm font-semibold text-stone-900">
                  {item.product.name}
                </p>
                <button
                  onClick={() => removeItem(item.id, token)}
                  className="ml-1 flex-shrink-0 rounded-lg p-1 text-stone-300 transition active:bg-red-50 active:text-red-400"
                  aria-label="Remove item"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between">
                {/* Qty stepper */}
                <div className="flex items-center overflow-hidden rounded-lg border border-stone-200">
                  <button
                    onClick={() =>
                      item.quantity <= 1
                        ? removeItem(item.id, token)
                        : updateItem(item.id, item.quantity - 1, token)
                    }
                    className="flex h-7 w-7 items-center justify-center text-stone-500 transition active:bg-stone-100"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="w-7 select-none text-center text-sm font-semibold text-stone-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateItem(item.id, item.quantity + 1, token)}
                    className="flex h-7 w-7 items-center justify-center text-stone-500 transition active:bg-stone-100"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                <span className="text-sm font-bold text-stone-900">
                  ₹{(Number(item.product.price) * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Coupon — collapsible */}
      <div className="mx-4 mt-3 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <button
          onClick={() => setCouponOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-semibold text-stone-700"
        >
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z"
              />
            </svg>
            Have a coupon code?
          </span>
          <svg
            className={`h-4 w-4 text-stone-400 transition-transform ${couponOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {couponOpen && (
          <div className="border-t border-stone-100 px-4 pb-4 pt-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-mono uppercase tracking-widest text-stone-900 placeholder-stone-300 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
              />
              <button className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition active:bg-stone-700">
                Apply
              </button>
            </div>
            <p className="mt-2 text-xs text-stone-400">
              Coupons are applied at confirmation on WhatsApp.
            </p>
          </div>
        )}
      </div>

      {/* Order subtotal */}
      <div className="mx-4 mt-3 rounded-2xl border border-stone-100 bg-white px-4 py-4">
        <div className="flex items-center justify-between text-sm text-stone-500">
          <span>Subtotal</span>
          <span className="font-semibold text-stone-900">₹{total.toLocaleString('en-IN')}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm text-stone-400">
          <span>Shipping</span>
          <span>Confirmed via WhatsApp</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
          <span className="font-bold text-stone-900">Total</span>
          <span className="text-lg font-black text-stone-900">
            ₹{total.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pt-4">
        <button
          onClick={onNext}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 text-sm font-bold text-white shadow-sm transition active:scale-[.98]"
        >
          Continue to Details
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Your Details
// ---------------------------------------------------------------------------

function Step2({
  customerName,
  setCustomerName,
  whatsapp,
  setWhatsapp,
  address,
  setAddress,
  notes,
  setNotes,
  isLoggedIn,
  onNext,
}: {
  customerName: string;
  setCustomerName: (v: string) => void;
  whatsapp: string;
  setWhatsapp: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  isLoggedIn: boolean;
  onNext: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  function handleContinue() {
    setError(null);
    if (!customerName.trim()) {
      setError('Please enter your name.');
      return;
    }
    const digits = whatsapp.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Enter a valid 10-digit WhatsApp number (without +91).');
      return;
    }
    onNext();
  }

  return (
    <div className="pb-6">
      <div className="px-4 pt-4">
        <h1 className="text-xl font-black text-stone-900">Your Details</h1>
        <p className="mt-0.5 text-sm text-stone-500">
          {isLoggedIn
            ? 'Confirm your contact details below.'
            : 'Enter your details to place the order.'}
        </p>
      </div>

      <div className="mt-4 space-y-3 px-4">
        {/* Name */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <label className="block px-4 pb-3 pt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Full Name
            </span>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              className="mt-1.5 w-full border-none bg-transparent p-0 text-base font-semibold text-stone-900 placeholder-stone-300 outline-none"
            />
          </label>
        </div>

        {/* WhatsApp */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <label className="block px-4 pb-3 pt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              WhatsApp Number
            </span>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-sm font-semibold text-stone-500">
                +91
              </span>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                inputMode="numeric"
                autoComplete="tel-national"
                className="flex-1 border-none bg-transparent p-0 text-base font-semibold text-stone-900 placeholder-stone-300 outline-none"
              />
              {whatsapp.replace(/\D/g, '').length === 10 && (
                <svg
                  className="h-4 w-4 flex-shrink-0 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <p className="mt-1.5 text-xs text-stone-400">
              We'll confirm your order on this number.
            </p>
          </label>
        </div>

        {/* Delivery address */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <label className="block px-4 pb-3 pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Delivery Address
              </span>
              <span className="text-[10px] text-stone-400">Optional</span>
            </div>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Flat / House no, Street, City, PIN"
              rows={3}
              className="mt-1.5 w-full resize-none border-none bg-transparent p-0 text-sm text-stone-900 placeholder-stone-300 outline-none"
            />
            <p className="mt-1 text-[10px] text-stone-400">
              For reference only — final delivery details confirmed via WhatsApp.
            </p>
          </label>
        </div>

        {/* Notes */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <label className="block px-4 pb-3 pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Notes for us
              </span>
              <span className="text-[10px] text-stone-400">Optional</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Colour requests, gift wrapping, special instructions..."
              rows={2}
              className="mt-1.5 w-full resize-none border-none bg-transparent p-0 text-sm text-stone-900 placeholder-stone-300 outline-none"
            />
          </label>
        </div>

        {/* Error */}
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

        {/* CTA */}
        <button
          onClick={handleContinue}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 text-sm font-bold text-white shadow-sm transition active:scale-[.98]"
        >
          Review Order
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Review & Place Order
// ---------------------------------------------------------------------------

function Step3({
  customerName,
  whatsapp,
  address,
  notes,
  submitting,
  error,
  onSubmit,
}: {
  customerName: string;
  whatsapp: string;
  address: string;
  notes: string;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
}) {
  const { items } = useCartStore();
  const total = cartTotal(items);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="pb-10">
      <div className="px-4 pt-4">
        <h1 className="text-xl font-black text-stone-900">Review &amp; Place Order</h1>
        <p className="mt-0.5 text-sm text-stone-500">
          Everything look right? Tap below to confirm.
        </p>
      </div>

      <div className="mt-4 space-y-3 px-4">
        {/* Order summary card */}
        <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            Order Summary
          </p>
          {/* Item thumbnails strip */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {items.map((item) => (
              <div
                key={item.id}
                className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-stone-100"
              >
                {item.product.images[0] && (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                )}
                {item.quantity > 1 && (
                  <span className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 text-[9px] font-bold text-white">
                    {item.quantity}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
            <span className="text-sm text-stone-500">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
            <span className="text-lg font-black text-stone-900">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Contact details */}
        <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            Contact Details
          </p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <svg
                className="h-4 w-4 flex-shrink-0 text-stone-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
              <span className="font-semibold text-stone-900">{customerName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <svg
                className="h-4 w-4 flex-shrink-0 text-[#25D366]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span className="font-semibold text-stone-900">+91 {whatsapp}</span>
            </div>
            {address && (
              <div className="flex items-start gap-2 text-sm">
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-stone-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
                <span className="whitespace-pre-line text-stone-600">{address}</span>
              </div>
            )}
            {notes && (
              <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                📝 {notes}
              </div>
            )}
          </div>
        </div>

        {/* Error */}
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

        {/* Place Order CTA */}
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] py-4 text-base font-bold text-white shadow-lg shadow-[#25D366]/25 transition active:scale-[.98] disabled:opacity-60"
        >
          {submitting ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Placing order…
            </>
          ) : (
            <>
              <WaIcon className="h-5 w-5 flex-shrink-0" />
              Place Order via WhatsApp
            </>
          )}
        </button>

        {/* Post-CTA copy */}
        <p className="text-center text-xs text-stone-400">
          You'll receive an order confirmation on WhatsApp.{' '}
          <span className="font-semibold text-stone-600">
            No advance payment required to confirm.
          </span>
        </p>

        {/* Trust row */}
        <div className="flex items-center justify-center gap-6 py-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
            <span>🔒</span> Secure
          </div>
          <div className="h-3 w-px bg-stone-200" />
          <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
            <span>✅</span> No spam
          </div>
          <div className="h-3 w-px bg-stone-200" />
          <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
            <span>🤝</span> No advance
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main wizard
// ---------------------------------------------------------------------------

export function MobileCheckoutWizard() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const userName = session?.user?.name ?? '';
  const savedWhatsapp =
    (session?.user as { whatsappNumber?: string | null } | undefined)?.whatsappNumber ?? '';

  const { fetchCart, clearLocalCart } = useCartStore();

  // Form state shared across steps
  const [customerName, setCustomerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cart on mount
  useEffect(() => {
    fetchCart(token);
  }, [token, fetchCart]);

  // Pre-fill from session
  useEffect(() => {
    if (userName) setCustomerName(userName);
  }, [userName]);
  useEffect(() => {
    if (savedWhatsapp) setWhatsapp(savedWhatsapp);
  }, [savedWhatsapp]);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  async function handleSubmit() {
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F0' }}>
      {/* Step progress bar */}
      <StepBar
        step={step}
        onBack={step === 2 ? () => setStep(1) : step === 3 ? () => setStep(2) : undefined}
      />

      {/* Step content */}
      {step === 1 && <Step1 token={token} onNext={() => setStep(2)} />}
      {step === 2 && (
        <Step2
          customerName={customerName}
          setCustomerName={setCustomerName}
          whatsapp={whatsapp}
          setWhatsapp={setWhatsapp}
          address={address}
          setAddress={setAddress}
          notes={notes}
          setNotes={setNotes}
          isLoggedIn={!!session}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <Step3
          customerName={customerName}
          whatsapp={whatsapp}
          address={address}
          notes={notes}
          submitting={submitting}
          error={error}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
