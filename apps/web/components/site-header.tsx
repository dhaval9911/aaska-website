import Link from 'next/link';

import { Button, PageShell } from '@aaska/ui';

import { auth } from '@/lib/auth';
import { UserMenu } from './user-menu';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
];

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/75 backdrop-blur-xl">
      <PageShell className="flex h-20 items-center justify-between">
        <Link className="text-2xl font-black tracking-[0.2em] text-bark" href="/">
          AASKA
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-stone-700 md:flex">
          {navItems.map((item) => (
            <Link className="transition hover:text-bark" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {session?.user ? (
            <UserMenu
              name={session.user.name ?? session.user.email ?? 'Account'}
              role={(session.user as { role?: string }).role ?? 'CUSTOMER'}
            />
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </PageShell>
    </header>
  );
}
