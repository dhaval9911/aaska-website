import type { Metadata } from 'next';

import { PageShell } from '@aaska/ui';

export const metadata: Metadata = {
  title: 'Contact Us — Resin Dreams',
  description:
    'Get in touch with Resin Dreams. Find us on WhatsApp, Instagram, or visit our stores in Chandkheda and Vastral, Ahmedabad.',
};

const WA_NUMBER = '919499554824';
const WA_TEXT = encodeURIComponent('Hi! I have a question about Resin Dreams.');

export default function ContactPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-3xl font-black text-stone-900">Contact Us</h1>
          <p className="mt-1 text-stone-500">
            We would love to hear from you. Reach us on WhatsApp, Instagram, or visit our stores.
          </p>
        </div>

        {/* ── WhatsApp ── */}
        <a
          href={`https://wa.me/${WA_NUMBER}?text=${WA_TEXT}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-2xl bg-[#25D366] px-5 py-4 text-white shadow-lg shadow-[#25D366]/25 transition hover:bg-[#20ba58] active:scale-[.98]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <svg className="h-6 w-6 fill-white" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-base">Chat on WhatsApp</p>
            <p className="text-sm text-white/80">+91 94995 54824 — tap to open</p>
          </div>
          <svg
            className="h-5 w-5 text-white/60 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>

        {/* ── Instagram ── */}
        <a
          href="https://www.instagram.com/resin.dreams._/?hl=en"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-2xl border border-stone-100 bg-white px-5 py-4 shadow-sm transition hover:shadow-md active:scale-[.98]"
          style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fff 60%)' }}
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #f9ce34, #ee2a7b, #6228d7)' }}
          >
            <svg className="h-6 w-6 fill-white" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-stone-900">Instagram</p>
            <p className="text-sm text-stone-500">@resin.dreams._</p>
          </div>
          <svg
            className="h-5 w-5 text-stone-300 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>

        {/* ── Website ── */}
        <a
          href="https://resindreamstore.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-2xl border border-stone-100 bg-white px-5 py-4 shadow-sm transition hover:shadow-md active:scale-[.98]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <circle cx="12" cy="12" r="10" />
              <path
                strokeLinecap="round"
                d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"
              />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-stone-900">Website</p>
            <p className="text-sm text-stone-500">resindreamstore.com</p>
          </div>
          <svg
            className="h-5 w-5 text-stone-300 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>

        {/* ── Location ── */}
        <div className="rounded-2xl border border-stone-100 bg-white px-5 py-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-[#D4860B]">
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </span>
            <div>
              <p className="font-bold text-stone-900">Our Locations</p>
              <p className="text-sm text-stone-500">Ahmedabad, Gujarat</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {['Chandkheda', 'Vastral'].map((area) => (
              <div
                key={area}
                className="flex items-center gap-2.5 rounded-xl bg-stone-50 px-4 py-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#D4860B]/10 text-[#D4860B] text-sm">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.013 3.5-4.619 3.5-7.327A8.25 8.25 0 0012 3.75a8.25 8.25 0 00-8.25 8.25c0 2.708 1.556 5.314 3.5 7.327a19.583 19.583 0 002.683 2.282 16.975 16.975 0 001.144.742zM12 13.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span className="text-sm font-semibold text-stone-700">{area}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Ships all over India ── */}
        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-amber-100 px-5 py-4">
          <span className="text-2xl">
            {/* Indian flag colours representation via emoji-safe approach */}
            <svg className="h-8 w-8" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="12" fill="#FF9933" rx="2" />
              <rect y="12" width="36" height="12" fill="#fff" />
              <rect y="24" width="36" height="12" fill="#138808" rx="2" />
              <circle cx="18" cy="18" r="4" stroke="#000080" strokeWidth="1.5" fill="none" />
              <circle cx="18" cy="18" r="1" fill="#000080" />
            </svg>
          </span>
          <div>
            <p className="font-bold text-stone-900">We ship all over India</p>
            <p className="text-sm text-stone-600">
              Doorstep delivery across all states and cities.
            </p>
          </div>
        </div>

        {/* ── Business hours note ── */}
        <p className="text-center text-xs text-stone-400 pb-2">
          WhatsApp replies typically within a few hours &bull; Monday to Saturday
        </p>
      </div>
    </PageShell>
  );
}
