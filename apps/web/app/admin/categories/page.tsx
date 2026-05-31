'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button, Card, PageShell } from '@aaska/ui';

import { apiFetch } from '@/lib/api';
import { CategoryForm, type CategoryFormData } from '@/components/admin/category-form';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CategoryBase {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  bannerImage: string | null;
  homeTileImage: string | null;
  featuredOnHome: boolean;
  homeDisplayOrder: number;
  description: string | null;
  createdAt: string;
  _count: { products: number };
}

interface Category extends CategoryBase {
  children: CategoryBase[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function totalProducts(cat: Category) {
  return cat._count.products + cat.children.reduce((s, c) => s + c._count.products, 0);
}

function toFormData(cat: Category | CategoryBase, hasChildren: boolean): CategoryFormData {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    parentId: cat.parentId,
    bannerImage: cat.bannerImage,
    homeTileImage: cat.homeTileImage,
    description: cat.description,
    featuredOnHome: cat.featuredOnHome,
    homeDisplayOrder: cat.homeDisplayOrder,
    hasChildren,
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Up/down reorder arrows for the homepage tiles card. */
function ReorderButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'up' | 'down';
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-6 w-6 items-center justify-center rounded-lg border border-stone-200 text-xs text-stone-500 transition hover:border-stone-400 hover:text-stone-800 disabled:pointer-events-none disabled:opacity-30"
    >
      {direction === 'up' ? '▲' : '▼'}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type FormMode =
  | { type: 'list' }
  | { type: 'new'; defaultParentId?: string }
  | { type: 'edit'; cat: Category | CategoryBase; hasChildren: boolean };

export default function AdminCategoriesPage() {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const qc = useQueryClient();

  const [mode, setMode] = useState<FormMode>({ type: 'list' });
  const [homeTiles, setHomeTiles] = useState<CategoryBase[]>([]);
  const [tilesModified, setTilesModified] = useState(false);

  // ── Fetch tree ──────────────────────────────────────────────────────────
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories-tree'],
    queryFn: () => apiFetch<Category[]>('/categories?tree=true'),
  });

  // Sync homepage tiles from server whenever the query refreshes (skip if user
  // has unsaved drag-reorder changes).
  useEffect(() => {
    if (tilesModified) return;
    const featured = categories
      .flatMap((c) => [c, ...c.children])
      .filter((c) => c.featuredOnHome)
      .sort((a, b) => a.homeDisplayOrder - b.homeDisplayOrder);
    setHomeTiles(featured);
  }, [categories, tilesModified]);

  // ── Mutations ───────────────────────────────────────────────────────────

  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, featuredOnHome }: { id: string; featuredOnHome: boolean }) =>
      apiFetch(`/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ featuredOnHome }),
        token,
      }),
    onSuccess: () => {
      setTilesModified(false);
      qc.invalidateQueries({ queryKey: ['categories-tree'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/categories/${id}`, { method: 'DELETE', token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories-tree'] }),
  });

  const saveOrderMutation = useMutation({
    mutationFn: (tiles: CategoryBase[]) =>
      apiFetch('/categories/home-order', {
        method: 'PATCH',
        body: JSON.stringify({
          tiles: tiles.map((t, i) => ({ id: t.id, homeDisplayOrder: i })),
        }),
        token,
      }),
    onSuccess: () => {
      setTilesModified(false);
      qc.invalidateQueries({ queryKey: ['categories-tree'] });
    },
  });

  // ── Tile reorder helpers ─────────────────────────────────────────────────

  function moveTile(index: number, direction: 'up' | 'down') {
    setHomeTiles((prev) => {
      const next = [...prev];
      const swapIdx = direction === 'up' ? index - 1 : index + 1;
      [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
      return next;
    });
    setTilesModified(true);
  }

  // ── Top-level categories for parent dropdown ─────────────────────────────
  const topLevelCategories = categories.map((c) => ({ id: c.id, name: c.name }));

  // ── Render ───────────────────────────────────────────────────────────────

  if (mode.type !== 'list') {
    return (
      <PageShell className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode({ type: 'list' })}
            className="text-sm text-stone-400 transition hover:text-stone-700"
          >
            ← Categories
          </button>
        </div>

        <CategoryForm
          parentCategories={topLevelCategories}
          token={token}
          category={mode.type === 'edit' ? toFormData(mode.cat, mode.hasChildren) : undefined}
          defaultParentId={mode.type === 'new' ? mode.defaultParentId : undefined}
          onSuccess={() => {
            setMode({ type: 'list' });
            qc.invalidateQueries({ queryKey: ['categories-tree'] });
          }}
          onCancel={() => setMode({ type: 'list' })}
        />
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-stone-900">Categories</h1>
        <Button onClick={() => setMode({ type: 'new' })}>+ New Category</Button>
      </div>

      {/* Homepage Tiles Card */}
      {homeTiles.length > 0 && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-stone-900">Homepage Tiles</h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Drag order ← use arrows to reorder, then save.
              </p>
            </div>
            {tilesModified && (
              <Button
                size="sm"
                disabled={saveOrderMutation.isPending}
                onClick={() => saveOrderMutation.mutate(homeTiles)}
              >
                {saveOrderMutation.isPending ? 'Saving…' : 'Save Order'}
              </Button>
            )}
          </div>

          <div className="divide-y divide-stone-100 rounded-xl border border-stone-200">
            {homeTiles.map((tile, i) => (
              <div key={tile.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-5 text-center text-xs font-bold text-stone-400">{i + 1}</span>

                {tile.homeTileImage ? (
                  <img
                    src={tile.homeTileImage}
                    alt=""
                    className="h-9 w-9 rounded-lg object-cover border border-stone-100"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-lg bg-stone-100 flex items-center justify-center text-stone-300 text-xs">
                    img
                  </div>
                )}

                <span className="flex-1 text-sm font-medium text-stone-900">{tile.name}</span>

                {tile.parentId && (
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-400">
                    sub
                  </span>
                )}

                <div className="flex gap-1">
                  <ReorderButton
                    direction="up"
                    disabled={i === 0}
                    onClick={() => moveTile(i, 'up')}
                  />
                  <ReorderButton
                    direction="down"
                    disabled={i === homeTiles.length - 1}
                    onClick={() => moveTile(i, 'down')}
                  />
                </div>
              </div>
            ))}
          </div>

          {!tilesModified && (
            <p className="text-xs text-stone-400">
              Use ▲ ▼ to reorder — a Save Order button will appear.
            </p>
          )}
        </Card>
      )}

      {/* Category Tree Table */}
      {isLoading ? (
        <p className="text-stone-400">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100 bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-400">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-center">Featured</th>
                <th className="px-4 py-3 text-right">Products</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {categories.map((cat) => (
                <>
                  {/* ── Parent row ── */}
                  <tr key={cat.id} className="bg-stone-50/60 transition hover:bg-stone-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900">{cat.name}</span>
                        {cat.children.length > 0 && (
                          <span className="rounded-full bg-stone-200 px-1.5 py-0.5 text-[10px] font-medium text-stone-500">
                            {cat.children.length} sub
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-400">{cat.slug}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        title={cat.featuredOnHome ? 'Remove from homepage' : 'Feature on homepage'}
                        disabled={toggleFeaturedMutation.isPending}
                        onClick={() =>
                          toggleFeaturedMutation.mutate({
                            id: cat.id,
                            featuredOnHome: !cat.featuredOnHome,
                          })
                        }
                        className={`text-lg transition ${
                          cat.featuredOnHome
                            ? 'text-amber-400 hover:text-stone-400'
                            : 'text-stone-200 hover:text-amber-300'
                        } disabled:opacity-40`}
                      >
                        ★
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right text-stone-500">{totalProducts(cat)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          className="text-stone-400 transition hover:text-stone-900"
                          onClick={() =>
                            setMode({ type: 'edit', cat, hasChildren: cat.children.length > 0 })
                          }
                        >
                          Edit
                        </button>
                        <button
                          className="text-xs text-amber-600 transition hover:text-amber-800"
                          onClick={() => setMode({ type: 'new', defaultParentId: cat.id })}
                        >
                          + Sub
                        </button>
                        <button
                          className="text-red-400 transition hover:text-red-600 disabled:opacity-40"
                          disabled={
                            totalProducts(cat) > 0 ||
                            cat.children.length > 0 ||
                            deleteMutation.isPending
                          }
                          title={
                            cat.children.length > 0
                              ? 'Remove subcategories first'
                              : totalProducts(cat) > 0
                                ? 'Remove all products first'
                                : 'Delete'
                          }
                          onClick={() => {
                            if (confirm(`Delete "${cat.name}"?`)) deleteMutation.mutate(cat.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* ── Child rows ── */}
                  {cat.children.map((child) => (
                    <tr key={child.id} className="transition hover:bg-stone-50">
                      <td className="py-2.5 pl-10 pr-4">
                        <div className="flex items-center gap-1.5 text-stone-600">
                          <span className="text-stone-300">↳</span>
                          {child.name}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-stone-400">{child.slug}</td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          title={
                            child.featuredOnHome ? 'Remove from homepage' : 'Feature on homepage'
                          }
                          disabled={toggleFeaturedMutation.isPending}
                          onClick={() =>
                            toggleFeaturedMutation.mutate({
                              id: child.id,
                              featuredOnHome: !child.featuredOnHome,
                            })
                          }
                          className={`text-lg transition ${
                            child.featuredOnHome
                              ? 'text-amber-400 hover:text-stone-400'
                              : 'text-stone-200 hover:text-amber-300'
                          } disabled:opacity-40`}
                        >
                          ★
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-right text-stone-500">
                        {child._count.products}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            className="text-stone-400 transition hover:text-stone-900"
                            onClick={() =>
                              setMode({ type: 'edit', cat: child, hasChildren: false })
                            }
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-400 transition hover:text-red-600 disabled:opacity-40"
                            disabled={child._count.products > 0 || deleteMutation.isPending}
                            title={
                              child._count.products > 0 ? 'Remove all products first' : 'Delete'
                            }
                            onClick={() => {
                              if (confirm(`Delete "${child.name}"?`))
                                deleteMutation.mutate(child.id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              ))}

              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                    No categories yet. Click <strong>+ New Category</strong> to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
