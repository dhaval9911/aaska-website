'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ALL_STATUSES = [
  { value: 'PENDING_WHATSAPP', label: 'Awaiting WhatsApp' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PAYMENT_PENDING', label: 'Payment Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PROCESSING', label: 'Preparing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function StatusForm({
  orderId,
  currentStatus,
  token,
}: {
  orderId: string;
  currentStatus: string;
  token: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleUpdate() {
    if (status === currentStatus) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
      const res = await fetch(`${apiUrl}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? 'Update failed.');
      }

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          Update status
        </span>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setSuccess(false);
          }}
          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
        >
          {ALL_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      {success && (
        <p className="rounded-xl bg-green-50 px-3 py-2 text-xs text-green-700">
          Status updated! WhatsApp notification sent if applicable.
        </p>
      )}

      <button
        onClick={handleUpdate}
        disabled={loading || status === currentStatus}
        className="w-full rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:opacity-50"
      >
        {loading ? 'Updating...' : 'Update Status'}
      </button>
    </div>
  );
}
