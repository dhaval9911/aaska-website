'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button, Card, Input } from '@aaska/ui';

import { apiFetch, apiUpload } from '@/lib/api';

const UNITS = ['KG', 'LITRE', 'ML', 'METER', 'PACK', 'PIECE', 'BOTTLE', 'COMBO_KIT'] as const;

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.coerce.number().min(0, 'Price must be ≥ 0'),
    showComparePrice: z.boolean().default(false),
    compareAtPrice: z.preprocess((val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const n = Number(val);
      return isNaN(n) ? undefined : n;
    }, z.number().min(0, 'Must be ≥ 0').optional()),
    stock: z.coerce.number().int().min(0, 'Stock must be ≥ 0'),
    unit: z.enum(UNITS),
    categoryId: z.string().min(1, 'Select a category'),
    slug: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.showComparePrice) return;
    if (data.compareAtPrice === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Original price is required when sale pricing is on',
        path: ['compareAtPrice'],
      });
    } else if (data.compareAtPrice <= data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Original price must be higher than selling price',
        path: ['compareAtPrice'],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

interface Category {
  id: string;
  name: string;
}

interface ExistingProduct {
  id: string;
  name: string;
  slug?: string;
  description: string;
  price: number;
  compareAtPrice?: number | string | null;
  showComparePrice?: boolean;
  stock: number;
  unit: string;
  categoryId: string;
  images: string[];
}

interface ProductFormProps {
  categories: Category[];
  token: string;
  product?: ExistingProduct;
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
    watch,
    setValue,
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
          showComparePrice: product.showComparePrice ?? false,
          compareAtPrice:
            product.compareAtPrice != null ? Number(product.compareAtPrice) : undefined,
        }
      : { unit: 'PIECE', showComparePrice: false },
  });

  const showComparePrice = watch('showComparePrice');
  const sellingPrice = watch('price') ?? 0;
  const compareAtPrice = watch('compareAtPrice') ?? 0;

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
      const payload = {
        ...values,
        images,
        showComparePrice: values.showComparePrice,
        compareAtPrice: values.showComparePrice ? (values.compareAtPrice ?? null) : null,
      };

      if (product) {
        await apiFetch(`/products/${product.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
          token,
        });
      } else {
        await apiFetch('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
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
            <label className="text-sm font-medium text-stone-700">Selling Price (₹) *</label>
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

        {/* ── Sale Price ────────────────────────────────────────────────── */}
        <div className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50/60 px-4 py-4">
          {/* Toggle row */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-stone-700">Show sale / compare price</label>
            <button
              type="button"
              role="switch"
              aria-checked={showComparePrice}
              onClick={() =>
                setValue('showComparePrice', !showComparePrice, { shouldValidate: true })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                showComparePrice ? 'bg-amber-500' : 'bg-stone-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  showComparePrice ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Revealed when toggle is ON */}
          {showComparePrice && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">
                  Original Price / MRP (₹)
                </label>
                <Input
                  {...register('compareAtPrice')}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="2000"
                />
                <p className="text-xs text-stone-400">
                  This will appear as a crossed-out price — e.g. ₹2000 crossed out, selling at ₹1000
                </p>
                {errors.compareAtPrice && (
                  <p className="text-xs text-red-500">{errors.compareAtPrice.message}</p>
                )}
              </div>

              {/* Live preview */}
              {compareAtPrice > 0 && sellingPrice > 0 && compareAtPrice > sellingPrice && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-stone-200 bg-white px-4 py-3">
                  <span className="text-sm text-stone-400 line-through">
                    ₹{Number(compareAtPrice).toLocaleString('en-IN')}
                  </span>
                  <span className="text-base font-bold text-stone-900">
                    ₹{Number(sellingPrice).toLocaleString('en-IN')}
                  </span>
                  <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    SAVE ₹{(Number(compareAtPrice) - Number(sellingPrice)).toLocaleString('en-IN')}{' '}
                    ·{' '}
                    {Math.round(
                      ((Number(compareAtPrice) - Number(sellingPrice)) / Number(compareAtPrice)) *
                        100,
                    )}
                    % off
                  </span>
                </div>
              )}
            </div>
          )}
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
