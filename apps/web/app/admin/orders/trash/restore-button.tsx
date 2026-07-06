'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RestoreOrderButton({ orderId, token }: { orderId: string; token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRestore() {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
      const res = await fetch(`${apiUrl}/orders/${orderId}/restore`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to restore order.');
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRestore}
      disabled={loading}
      className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
    >
      {loading ? 'Restoring...' : 'Restore'}
    </button>
  );
}
