'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { useMobile } from '@/components/mobile-provider';
import { BottomTabBar } from './BottomTabBar';
import { MobileTopBar } from './MobileTopBar';

interface LayoutProps {
  /** Pre-rendered server component — SiteHeader */
  header: ReactNode;
  /** Pre-rendered server component — SiteFooter */
  footer: ReactNode;
  children: ReactNode;
}

/** Desktop: sticky header + scrollable content + footer */
function DesktopLayout({ header, footer, children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {header}
      <main className="flex-1 py-12">{children}</main>
      {footer}
    </div>
  );
}

/**
 * Mobile: fixed top bar + scrollable content with bottom padding
 * + fixed bottom tab bar. No site footer (navigation replaces it).
 */
function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <MobileTopBar />
      {/* pt-14 clears the fixed top bar; pb-16 clears the fixed bottom tab bar */}
      <main className="flex-1 pb-16 pt-14">{children}</main>
      <BottomTabBar />
    </div>
  );
}

/**
 * Picks the correct shell based on viewport size and route.
 * Admin routes always use DesktopLayout regardless of device —
 * the admin panel is not designed for mobile.
 *
 * Server components (header, footer) are passed as ReactNode props
 * so they remain server-rendered while this client component decides
 * where to slot them.
 */
export function ResponsiveLayout({ header, footer, children }: LayoutProps) {
  const { isDesktop } = useMobile();
  const pathname = usePathname();

  // Admin always gets the full desktop shell
  if (pathname.startsWith('/admin') || isDesktop) {
    return (
      <DesktopLayout header={header} footer={footer}>
        {children}
      </DesktopLayout>
    );
  }

  return <MobileLayout>{children}</MobileLayout>;
}
