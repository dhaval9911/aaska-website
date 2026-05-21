'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { apiFetch } from '@/lib/api';

interface DeleteButtonProps {
  id: string;
  name: string;
  endpoint: string;
  redirectPath?: string;
}

export function DeleteButton({ id, name, endpoint, redirectPath }: DeleteButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

    setLoading(true);
    try {
      await apiFetch(`${endpoint}/${id}`, {
        method: 'DELETE',
        token: session?.accessToken ?? '',
      });
      if (redirectPath) {
        router.push(redirectPath);
      }
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-400 transition hover:text-red-600 disabled:opacity-40"
    >
      {loading ? '…' : 'Delete'}
    </button>
  );
}
