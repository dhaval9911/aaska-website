'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Do not track admin sessions
    if (pathname.startsWith('/admin')) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
    fetch(`${apiUrl}/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, referrer: document.referrer || undefined }),
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
