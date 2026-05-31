import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { apiFetch } from '@/lib/api';
import {
  CategoryPageClient,
  type CategoryDetail,
  type FlatCategory,
} from '@/components/category/CategoryPageClient';

export const revalidate = 60;

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await apiFetch<CategoryDetail>(`/categories/${slug}`).catch(() => null);
  if (!category) return {};
  return {
    title: `${category.name} — Aaska`,
    description:
      category.description ??
      `Browse ${category.name} — handcrafted resin art and raw materials at Aaska.`,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sub?: string }>;
}) {
  const { slug } = await params;
  const { sub: initialSub } = await searchParams;

  // Primary fetch — category + children + products
  const category = await apiFetch<CategoryDetail>(`/categories/${slug}`).catch(() => null);
  if (!category) notFound();

  let parentCategory: FlatCategory | null = null;
  let siblings: FlatCategory[] = [];

  // For subcategory pages, fetch the flat list to find parent info + siblings
  if (category.parentId) {
    const allCategories = await apiFetch<FlatCategory[]>('/categories').catch(
      () => [] as FlatCategory[],
    );
    parentCategory = allCategories.find((c) => c.id === category.parentId) ?? null;
    siblings = allCategories.filter(
      (c) => c.parentId === category.parentId && c.id !== category.id,
    );
  }

  return (
    <CategoryPageClient
      category={category}
      parentCategory={parentCategory}
      siblings={siblings}
      initialSub={initialSub}
    />
  );
}
