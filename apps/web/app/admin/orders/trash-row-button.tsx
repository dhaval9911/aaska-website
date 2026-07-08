'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function TrashRowButton({ orderId, token }: { orderId: string; token: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
      const res = await fetch(`${apiUrl}/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? '…' : 'Trash'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-stone-200 px-2 py-1 text-xs text-stone-500 transition hover:bg-stone-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      title="Move to trash"
      className="ml-3 rounded-lg border border-stone-200 p-1.5 text-stone-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}
