'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { appConfig } from '@aaska/config';
import { useCategoryDrawer } from '@/components/context/CategoryDrawerContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
}

// ---------------------------------------------------------------------------
// Emoji mapping — matched against slug + name (lowercase substring)
// ---------------------------------------------------------------------------

const EMOJI_MAP: [string, string][] = [
  ['resin', '\u{1F9EA}'], // 🧪
  ['pigment', '\u{1F3A8}'], // 🎨
  ['colour', '\u{1F3A8}'], // 🎨
  ['color', '\u{1F3A8}'], // 🎨
  ['decoration', '\u{1F338}'], // 🌸
  ['flower', '\u{1F338}'], // 🌸
  ['tool', '\u{1F527}'], // 🔧
  ['mold', '\u{1F527}'], // 🔧
  ['frame', '\u{1F5BC}'], // 🖼️
  ['craft', '\u{1F5BC}'], // 🖼️
  ['packaging', '\u{1F4E6}'], // 📦
  ['diy', '\u{1F381}'], // 🎁
  ['kit', '\u{1F381}'], // 🎁
  ['starter', '\u{1F381}'], // 🎁
];

function categoryEmoji(name: string, slug: string): string {
  const key = (name + ' ' + slug).toLowerCase();
  for (const [pattern, emoji] of EMOJI_MAP) {
    if (key.includes(pattern)) return emoji;
  }
  return '\u{1F537}'; // 🔷 fallback
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

// ---------------------------------------------------------------------------
// Shared icon helpers (inline SVG, no icon library needed)
// ---------------------------------------------------------------------------

function GridIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      className="h-3.5 w-3.5 text-stone-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CategoryDrawer() {
  const { isOpen, setOpen } = useCategoryDrawer();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);

  const isAuthed = status === 'authenticated' && !!session;
  const userName = session?.user?.name ?? session?.user?.email ?? '';
  const initial = userName.charAt(0).toUpperCase();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fetch categories once
  useEffect(() => {
    fetch(`${API}/categories`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Category[]) => setCategories(data))
      .catch(() => {});
  }, []);

  function close() {
    setOpen(false);
  }

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        aria-hidden="true"
        onClick={close}
        className={`fixed inset-0 z-[90] bg-black/50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* ── Drawer panel ── */}
      <aside
        aria-label="Category navigation"
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 left-0 z-[100] flex w-[80vw] max-w-[320px] flex-col overflow-hidden shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: '#FAFAF8' }}
      >
        {/* ── 1. Header ── */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-stone-200 px-4">
          <span className="text-base font-bold tracking-wide text-bark">Browse</span>
          <button
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-500 transition active:bg-stone-100"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* ── 2. Auth section ── */}
          <div className="px-4 py-4">
            {isAuthed ? (
              <Link
                href="/orders"
                onClick={close}
                className="flex items-center gap-3 rounded-2xl bg-sand px-3 py-3 transition hover:bg-stone-100"
              >
                {/* Avatar circle */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay text-sm font-bold text-white">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-stone-800">{userName}</p>
                  <p className="text-xs text-[#D4860B]">View profile &rarr;</p>
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={close}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D4860B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b8720a] active:scale-[.98]"
              >
                Login / Register
              </Link>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="mx-4 border-t border-stone-200" />

          {/* ── 3. All Products ── */}
          <div className="px-3 pt-3 pb-1">
            <Link
              href="/products"
              onClick={close}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#D4860B]/10 text-[#D4860B]">
                <GridIcon />
              </span>
              All Products
              <ChevronRight />
            </Link>
          </div>

          {/* ── 4. Category list ── */}
          <div className="px-3 pb-1">
            {categories.length === 0 ? (
              <div className="space-y-1 py-1">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="mx-3 h-9 animate-pulse rounded-xl bg-stone-100" />
                ))}
              </div>
            ) : (
              categories.map((cat) => {
                const emoji = categoryEmoji(cat.name, cat.slug);
                return (
                  <Link
                    key={cat.id}
                    href={`/products?category=${cat.slug}`}
                    onClick={close}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-stone-700 transition hover:bg-stone-100"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-base leading-none">
                      {emoji}
                    </span>
                    <span className="flex-1">{cat.name}</span>
                    <ChevronRight />
                  </Link>
                );
              })
            )}
          </div>

          {/* ── Divider ── */}
          <div className="mx-4 my-2 border-t border-stone-200" />

          {/* ── 5. Quick links ── */}
          <div className="px-3 pb-2">
            <p className="px-3 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
              Quick links
            </p>

            {[
              { label: 'My Orders', emoji: '\u{1F4E6}', href: '/orders', authOnly: true },
              { label: 'Wishlist', emoji: '❤️', href: '/wishlist', authOnly: false },
              { label: 'Contact Us', emoji: '\u{1F4DE}', href: '/contact', authOnly: false },
              { label: 'Track Order', emoji: '\u{1F69A}', href: '/orders', authOnly: false },
            ].map((item) => {
              if (item.authOnly && !isAuthed) return null;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={close}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-stone-700 transition hover:bg-stone-100"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-base leading-none">
                    {item.emoji}
                  </span>
                  {item.label}
                  <ChevronRight />
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── 6. WhatsApp support (pinned to bottom) ── */}
        <div className="shrink-0 border-t border-stone-200 p-4">
          <a
            href={`https://wa.me/${appConfig.businessWhatsapp}?text=Hi%20Aaska!%20I%20need%20some%20help.`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-[#25D366]/30 transition hover:bg-[#20ba58] active:scale-[.98]"
          >
            {/* WhatsApp logo SVG */}
            <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Chat with us on WhatsApp
          </a>
        </div>
      </aside>
    </>
  );
}
