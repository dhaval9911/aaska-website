'use client';

import { useRouter } from 'next/navigation';

export function MonthPicker({ current }: { current: string }) {
  const router = useRouter();

  // Build options: current month back 24 months
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }

  return (
    <select
      value={current}
      onChange={(e) => router.push(`/admin/analytics?month=${e.target.value}`)}
      className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
