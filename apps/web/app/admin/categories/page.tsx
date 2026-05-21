'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button, Card, Input, PageShell } from '@aaska/ui';

import { apiFetch } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

export default function AdminCategoriesPage() {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const qc = useQueryClient();

  const [name, setName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiFetch<Category[]>('/categories'),
  });

  const createMutation = useMutation({
    mutationFn: (catName: string) =>
      apiFetch('/categories', { method: 'POST', body: JSON.stringify({ name: catName }), token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setName('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, catName }: { id: string; catName: string }) =>
      apiFetch(`/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: catName }),
        token,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setEditId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/categories/${id}`, { method: 'DELETE', token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });

  return (
    <PageShell className="space-y-6">
      <h1 className="text-2xl font-black text-stone-900">Categories</h1>

      <Card className="max-w-sm">
        <h2 className="font-bold text-stone-900">New category</h2>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) createMutation.mutate(name.trim());
          }}
        >
          <Input
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
            Add
          </Button>
        </form>
        {createMutation.isError && (
          <p className="mt-2 text-sm text-red-500">{(createMutation.error as Error).message}</p>
        )}
      </Card>

      {isLoading ? (
        <p className="text-stone-400">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100 bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-400">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-right">Products</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="transition hover:bg-stone-50">
                  <td className="px-4 py-3">
                    {editId === cat.id ? (
                      <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          updateMutation.mutate({ id: cat.id, catName: editName });
                        }}
                      >
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-7 text-sm"
                          autoFocus
                        />
                        <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditId(null)}
                        >
                          Cancel
                        </Button>
                      </form>
                    ) : (
                      <span className="font-medium text-stone-900">{cat.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-400">{cat.slug}</td>
                  <td className="px-4 py-3 text-right text-stone-500">{cat._count.products}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        className="text-stone-400 transition hover:text-stone-900"
                        onClick={() => {
                          setEditId(cat.id);
                          setEditName(cat.name);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-400 transition hover:text-red-600 disabled:opacity-40"
                        disabled={cat._count.products > 0 || deleteMutation.isPending}
                        title={cat._count.products > 0 ? 'Remove all products first' : 'Delete'}
                        onClick={() => {
                          if (confirm(`Delete "${cat.name}"?`)) deleteMutation.mutate(cat.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
