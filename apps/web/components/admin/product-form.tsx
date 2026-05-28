'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button, Card, Input } from '@aaska/ui';

import { apiFetch, apiUpload } from '@/lib/api';

const UNITS = ['KG', 'LITRE', 'ML', 'METER', 'PACK', 'PIECE', 'BOTTLE', 'COMBO_KIT'] as const;

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().min(0, 'Price must be ≥ 0'),
  stock: z.coerce.number().int().min(0, 'Stock must be ≥ 0'),
  unit: z.enum(UNITS),
  categoryId: z.string().min(1, 'Select a category'),
  slug: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  categories: Category[];
  token: string;
  product?: FormValues & { id: string; images: string[] };
}

export function ProductForm({ categories, token, product }: ProductFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          unit: product.unit as (typeof UNITS)[number],
          categoryId: product.categoryId,
          slug: product.slug,
        }
      : { unit: 'PIECE' },
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setUploading(true);
    try {
      const results = await Promise.all(files.map((f) => apiUpload(f, token)));
      setImages((prev) => [...prev, ...results.map((r) => r.path)]);
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function onSubmit(values: FormValues) {
    setServerError('');
    try {
      if (product) {
        await apiFetch(`/products/${product.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ ...values, images }),
          token,
        });
      } else {
        await apiFetch('/products', {
          method: 'POST',
          body: JSON.stringify({ ...values, images }),
          token,
        });
      }
      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setServerError((err as Error).message);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Name *</label>
            <Input {...register('name')} placeholder="Luxury Resin Frame" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Slug (auto-generated)</label>
            <Input {...register('slug')} placeholder="luxury-resin-frame" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700">Description *</label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Describe the product…"
            className="w-full rounded-2xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
          />
          {errors.description && (
            <p className="text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Price (₹) *</label>
            <Input {...register('price')} type="number" step="0.01" min="0" placeholder="999" />
            {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Stock *</label>
            <Input {...register('stock')} type="number" min="0" placeholder="10" />
            {errors.stock && <p className="text-xs text-red-500">{errors.stock.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Unit *</label>
            <select
              {...register('unit')}
              className="w-full rounded-2xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700">Category *</label>
          <select
            {...register('categoryId')}
            className="w-full rounded-2xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
          >
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700">Images</label>
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative">
                <img
                  src={img}
                  alt=""
                  className="h-16 w-16 rounded-xl object-cover border border-stone-200"
                />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="text-sm text-stone-500"
          />
          <p className="text-xs text-stone-400">
            JPEG, PNG, WebP or HEIC — up to 30 MB each. Auto-compressed to WebP on upload.
          </p>
          {uploading && (
            <p className="text-xs text-amber-600 font-medium">Compressing &amp; uploading…</p>
          )}
        </div>

        {serverError && <p className="text-sm text-red-500">{serverError}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting || uploading}>
            {isSubmitting ? 'Saving…' : product ? 'Save changes' : 'Create product'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push('/admin/products')}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
