'use client';

import { useEffect, useState } from 'react';
import { useWishlistStore } from '@/lib/wishlist-store';

export function WishlistCountStat() {
  const [mounted, setMounted] = useState(false);
  const count = useWishlistStore((s) => s.items.length);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <span className="text-2xl font-black text-stone-900">{mounted ? count : '—'}</span>
      <span className="text-xs font-medium text-stone-500">Saved items</span>
    </>
  );
}
