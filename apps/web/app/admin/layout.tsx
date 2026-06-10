import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { PageShell } from '@aaska/ui';

import { auth } from '@/lib/auth';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const adminNav = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/categories', label: 'Categories' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="border-b border-stone-200 bg-white">
        <PageShell className="flex h-12 items-center gap-6">
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Admin</span>
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-stone-600 transition hover:text-stone-900"
            >
              {item.label}
            </Link>
          ))}
          <span className="ml-auto text-xs text-stone-400">{session.user?.email}</span>
        </PageShell>
      </div>
      <main className="py-8">{children}</main>
    </div>
  );
}
