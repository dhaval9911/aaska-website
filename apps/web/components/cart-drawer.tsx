'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { Button } from '@aaska/ui';

import { cartTotal, useCartStore } from '@/lib/cart-store';

export function CartDrawer() {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;

  const { items, isOpen, loading, closeCart, fetchCart, updateItem, removeItem } = useCartStore();

  // Fetch cart whenever drawer opens
  useEffect(() => {
    if (isOpen) fetchCart(token);
  }, [isOpen, token, fetchCart]);

  const total = cartTotal(items);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={closeCart}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <h2 className="text-lg font-bold text-stone-900">
            Cart{items.length > 0 ? ` (${items.length})` : ''}
          </h2>
          <button
            onClick={closeCart}
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
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-bark border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">
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
              <p className="font-semibold text-stone-700">Your cart is empty</p>
              <p className="text-sm text-stone-400">
                Browse our collection and add something beautiful.
              </p>
              <Button onClick={closeCart} variant="outline" className="mt-2">
                <Link href="/products">Browse products</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  {/* Thumbnail */}
                  <Link href={`/products/${item.product.slug}`} onClick={closeCart}>
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-stone-100">
                      {item.product.images[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                  </Link>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${item.product.slug}`}
                        onClick={closeCart}
                        className="text-sm font-semibold text-stone-900 leading-snug hover:text-bark"
                      >
                        {item.product.name}
                      </Link>
                      <button
                        onClick={() => removeItem(item.id, token)}
                        className="flex-shrink-0 text-stone-300 transition hover:text-red-500"
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
                      <div className="flex items-center gap-1 rounded-lg border border-stone-200 p-0.5">
                        <button
                          onClick={() =>
                            item.quantity <= 1
                              ? removeItem(item.id, token)
                              : updateItem(item.id, item.quantity - 1, token)
                          }
                          className="flex h-6 w-6 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-100"
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
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateItem(item.id, item.quantity + 1, token)}
                          disabled={item.quantity >= item.product.stock}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-100 disabled:opacity-30"
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
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-stone-100 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500">Subtotal</span>
              <span className="text-lg font-black text-stone-900">
                ₹{total.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-stone-400">Shipping calculated at checkout.</p>
            <Link href="/checkout" onClick={closeCart} className="block">
              <Button className="w-full">Proceed to checkout</Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
