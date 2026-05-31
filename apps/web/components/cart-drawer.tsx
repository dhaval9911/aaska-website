'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { cartTotal, useCartStore } from '@/lib/cart-store';

const WaIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export function CartDrawer() {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;

  const { items, isOpen, loading, closeCart, fetchCart, updateItem, removeItem } = useCartStore();

  useEffect(() => {
    if (isOpen) fetchCart(token);
  }, [isOpen, token, fetchCart]);

  const total = cartTotal(items);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={closeCart}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-stone-900">Your Cart</h2>
            {items.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-[10px] font-bold text-white">
                {items.reduce((n, i) => n + i.quantity, 0)}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#25D366] border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100">
                <svg
                  className="h-7 w-7 text-stone-400"
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
              <div>
                <p className="font-semibold text-stone-800">Your cart is empty</p>
                <p className="mt-1 text-sm text-stone-400">
                  Browse our handcrafted resin collection.
                </p>
              </div>
              <Link
                href="/products"
                onClick={closeCart}
                className="mt-1 rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                Browse products
              </Link>
            </div>
          ) : (
            <ul className="space-y-5">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  {/* Thumbnail */}
                  <Link
                    href={`/products/${item.product.slug}`}
                    onClick={closeCart}
                    className="flex-shrink-0"
                  >
                    <div className="h-[72px] w-[72px] overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-100">
                      {item.product.images[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <svg
                            className="h-6 w-6 text-stone-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${item.product.slug}`}
                        onClick={closeCart}
                        className="truncate text-sm font-semibold leading-snug text-stone-900 hover:text-stone-600"
                      >
                        {item.product.name}
                      </Link>
                      <button
                        onClick={() => removeItem(item.id, token)}
                        aria-label="Remove item"
                        className="ml-1 flex-shrink-0 rounded-md p-0.5 text-stone-300 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Qty stepper */}
                      <div className="flex items-center gap-0 overflow-hidden rounded-lg border border-stone-200">
                        <button
                          onClick={() =>
                            item.quantity <= 1
                              ? removeItem(item.id, token)
                              : updateItem(item.id, item.quantity - 1, token)
                          }
                          className="flex h-7 w-7 items-center justify-center text-stone-500 transition hover:bg-stone-100"
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
                          className="flex h-7 w-7 items-center justify-center text-stone-500 transition hover:bg-stone-100"
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
                        {'₹'}
                        {(Number(item.product.price) * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-stone-100 bg-white px-5 pb-6 pt-4 space-y-3">
            {/* Subtotal row */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500">Subtotal</span>
              <span className="text-xl font-black text-stone-900">
                {'₹'}
                {total.toLocaleString('en-IN')}
              </span>
            </div>

            {/* CTA */}
            <Link href="/checkout" onClick={closeCart} className="block">
              <button className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#20ba58] active:scale-[.98]">
                <WaIcon className="h-4 w-4 flex-shrink-0" />
                Proceed to Checkout
              </button>
            </Link>

            {/* Trust micro-copy */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-stone-400">
              <svg
                className="h-3.5 w-3.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
              No advance payment needed
            </div>
          </div>
        )}
      </div>
    </>
  );
}
