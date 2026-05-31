'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button, Card, Input } from '@aaska/ui';
import { apiFetch, apiUpload } from '@/lib/api';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().optional(),
  parentId: z.string().optional(),
  description: z.string().optional(),
  featuredOnHome: z.boolean().default(false),
  homeDisplayOrder: z.coerce.number().int().min(0).default(0),
});

type FormValues = z.infer<typeof schema>;

interface ParentCategory {
  id: string;
  name: string;
}

export interface CategoryFormData {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  bannerImage: string | null;
  homeTileImage: string | null;
  description: string | null;
  featuredOnHome: boolean;
  homeDisplayOrder: number;
  hasChildren: boolean;
}

interface CategoryFormProps {
  /** Top-level categories only (no subcategories allowed as parent). */
  parentCategories: ParentCategory[];
  token: string;
  /** When provided the form is in edit mode. */
  category?: CategoryFormData;
  /** Pre-select a parent when "Add Subcategory" is clicked. */
  defaultParentId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CategoryForm({
  parentCategories,
  token,
  category,
  defaultParentId,
  onSuccess,
  onCancel,
}: CategoryFormProps) {
  const [bannerImage, setBannerImage] = useState<string | null>(category?.bannerImage ?? null);
  const [homeTileImage, setHomeTileImage] = useState<string | null>(
    category?.homeTileImage ?? null,
  );
  const [uploading, setUploading] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: category
      ? {
          name: category.name,
          slug: category.slug,
          parentId: category.parentId ?? '',
          description: category.description ?? '',
          featuredOnHome: category.featuredOnHome,
          homeDisplayOrder: category.homeDisplayOrder,
        }
      : {
          parentId: defaultParentId ?? '',
          featuredOnHome: false,
          homeDisplayOrder: 0,
        },
  });

  const isFeatured = watch('featuredOnHome');

  async function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (path: string | null) => void,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await apiUpload(file, token);
      setter(result.path);
      e.target.value = '';
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(values: FormValues) {
    setServerError('');
    try {
      const body = {
        name: values.name,
        ...(values.slug && { slug: values.slug }),
        parentId: values.parentId || null,
        description: values.description || null,
        featuredOnHome: values.featuredOnHome,
        homeDisplayOrder: values.homeDisplayOrder,
        bannerImage,
        homeTileImage,
      };

      if (category) {
        await apiFetch(`/categories/${category.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
          token,
        });
      } else {
        await apiFetch('/categories', {
          method: 'POST',
          body: JSON.stringify(body),
          token,
        });
      }
      onSuccess();
    } catch (err) {
      setServerError((err as Error).message);
    }
  }

  return (
    <Card>
      <h2 className="mb-5 font-bold text-stone-900">
        {category ? `Edit: ${category.name}` : 'New Category'}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name + Slug */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Name *</label>
            <Input {...register('name')} placeholder="Resin Frames" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Slug (auto-generated)</label>
            <Input {...register('slug')} placeholder="resin-frames" />
          </div>
        </div>

        {/* Parent Category */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700">Parent Category</label>
          <select
            {...register('parentId')}
            disabled={category?.hasChildren}
            className="w-full rounded-2xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200 disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed"
          >
            <option value="">— Top-level category —</option>
            {parentCategories
              .filter((c) => c.id !== category?.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          {category?.hasChildren && (
            <p className="text-xs text-amber-600">
              Cannot change parent while this category has subcategories.
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Describe this category…"
            className="w-full rounded-2xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
          />
        </div>

        {/* Images */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">Banner Image</label>
            {bannerImage && (
              <div className="relative">
                <img
                  src={bannerImage}
                  alt="Banner"
                  className="h-24 w-full rounded-xl object-cover border border-stone-200"
                />
                <button
                  type="button"
                  onClick={() => setBannerImage(null)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow"
                >
                  ×
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, setBannerImage)}
              className="text-sm text-stone-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">Home Tile Image</label>
            {homeTileImage && (
              <div className="relative inline-block">
                <img
                  src={homeTileImage}
                  alt="Home tile"
                  className="h-24 w-24 rounded-xl object-cover border border-stone-200"
                />
                <button
                  type="button"
                  onClick={() => setHomeTileImage(null)}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow"
                >
                  ×
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, setHomeTileImage)}
              className="text-sm text-stone-500"
            />
          </div>
        </div>

        {/* Featured on Homepage */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              {...register('featuredOnHome')}
              className="h-4 w-4 rounded accent-amber-500"
            />
            <span className="text-sm font-medium text-stone-700">Featured on Homepage</span>
          </label>

          {isFeatured && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-stone-600">Display Order</label>
              <Input
                {...register('homeDisplayOrder')}
                type="number"
                min="0"
                className="w-20 text-center"
              />
            </div>
          )}
        </div>

        {uploading && (
          <p className="text-xs font-medium text-amber-600">Compressing &amp; uploading…</p>
        )}
        {serverError && <p className="text-sm text-red-500">{serverError}</p>}

        <div className="flex gap-3 pt-1">
          <Button type="submit" disabled={isSubmitting || uploading}>
            {isSubmitting ? 'Saving…' : category ? 'Save changes' : 'Create category'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
