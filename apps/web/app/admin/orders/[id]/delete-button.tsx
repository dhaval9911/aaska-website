'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DeleteOrderButton({ orderId, token }: { orderId: string; token: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
      const res = await fetch(`${apiUrl}/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete order.');
      router.push('/admin/orders');
    } catch {
      setLoading(false);
      setConfirm(false);
    }
  }

  if (confirm) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-stone-600">Move to trash?</p>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Moving...' : 'Yes, trash it'}
          </button>
          <button
            onClick={() => setConfirm(false)}
            className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
      Move to Trash
    </button>
  );
}
