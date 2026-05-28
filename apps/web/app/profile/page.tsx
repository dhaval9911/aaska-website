import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

import { PageShell } from '@aaska/ui';

import { auth } from '@/lib/auth';
import { SignOutButton } from './sign-out-button';
import { WishlistCountStat } from './wishlist-count-stat';

export const metadata: Metadata = { title: 'My Account — Resin Dreams' };

const SERVER_API = process.env.API_BASE_URL ?? 'http://localhost:4000/api';

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect('/login?callbackUrl=/profile');

  const user = session.user!;
  const token = (session as { accessToken?: string }).accessToken;
  const name = user.name ?? user.email ?? 'You';
  const initial = name.charAt(0).toUpperCase();
  const role = (user as { role?: string }).role ?? 'CUSTOMER';

  // Fetch order count
  let orderCount = 0;
  try {
    const res = await fetch(`${SERVER_API}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const orders: unknown[] = await res.json();
      orderCount = orders.length;
    }
  } catch {
    // show 0 on failure
  }

  return (
    <PageShell className="max-w-2xl space-y-5">
      {/* ── Avatar + name ── */}
      <div className="flex items-center gap-5 rounded-3xl border border-stone-100 bg-white px-6 py-6 shadow-sm">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-black text-white"
          style={{ backgroundColor: '#D4860B' }}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-black text-stone-900">{name}</h1>
          <p className="truncate text-sm text-stone-500">{user.email}</p>
          {role === 'ADMIN' && (
            <span className="mt-1.5 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              Admin
            </span>
          )}
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Orders */}
        <Link
          href="/orders"
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-stone-100 bg-white px-4 py-5 shadow-sm transition hover:shadow-md active:scale-[.98]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <svg
              className="h-5 w-5 text-[#D4860B]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 11H4L5 9z"
              />
            </svg>
          </span>
          <span className="text-2xl font-black text-stone-900">{orderCount}</span>
          <span className="text-xs font-medium text-stone-500">Orders</span>
        </Link>

        {/* Wishlist (client-side count) */}
        <Link
          href="/wishlist"
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-stone-100 bg-white px-4 py-5 shadow-sm transition hover:shadow-md active:scale-[.98]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </span>
          <WishlistCountStat />
        </Link>
      </div>

      {/* ── Nav links ── */}
      <div className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm divide-y divide-stone-100">
        {[
          {
            href: '/orders',
            label: 'My Orders',
            sublabel: 'Track and view past orders',
            icon: (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 11H4L5 9z"
                />
              </svg>
            ),
          },
          {
            href: '/wishlist',
            label: 'Wishlist',
            sublabel: 'Your saved products',
            icon: (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            ),
          },
          {
            href: '/contact',
            label: 'Contact Us',
            sublabel: 'WhatsApp, Instagram & store locations',
            icon: (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                />
              </svg>
            ),
          },
          ...(role === 'ADMIN'
            ? [
                {
                  href: '/admin',
                  label: 'Admin Panel',
                  sublabel: 'Manage products, orders & more',
                  icon: (
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                      />
                    </svg>
                  ),
                },
              ]
            : []),
        ].map(({ href, icon, label, sublabel }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 px-5 py-4 transition hover:bg-stone-50 active:bg-stone-100"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
              {icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-stone-900">{label}</p>
              <p className="text-xs text-stone-400">{sublabel}</p>
            </div>
            <svg
              className="h-4 w-4 shrink-0 text-stone-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      {/* ── Sign out ── */}
      <SignOutButton />

      <p className="pb-6 text-center text-xs text-stone-400">
        Resin Dreams &bull; Signed in as {user.email}
      </p>
    </PageShell>
  );
}
