'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button, Card, Input } from '@aaska/ui';

import { apiFetch, apiUpload } from '@/lib/api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const UNITS = ['KG', 'LITRE', 'ML', 'METER', 'PACK', 'PIECE', 'BOTTLE', 'COMBO_KIT'] as const;

const PRESETS: Record<string, string[]> = {
  'Frame sizes': ['8x10 inch', '10x12 inch', '12x16 inch', '16x20 inch', 'A4 Size', 'A3 Size'],
  'Weight (supply)': ['100g', '250g', '500g', '1kg'],
  'Volume (supply)': ['50ml', '100ml', '250ml', '500ml', '1L'],
};

// ---------------------------------------------------------------------------
// Variant state
// ---------------------------------------------------------------------------

interface VariantRow {
  _key: string;
  label: string;
  price: string;
  compareAtPrice: string;
  showComparePrice: boolean;
  stock: string;
  sku: string;
  isDefault: boolean;
}

function makeVariantRow(label = '', isDefault = false): VariantRow {
  return {
    _key:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    label,
    price: '',
    compareAtPrice: '',
    showComparePrice: false,
    stock: '0',
    sku: '',
    isDefault,
  };
}

// ---------------------------------------------------------------------------
// Zod schema (base product fields — variants handled separately)
// ---------------------------------------------------------------------------

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    hasVariants: z.boolean().default(false),
    price: z.preprocess(
      (v) => (v === '' || v === undefined ? 0 : Number(v)),
      z.number().min(0, 'Price must be ≥ 0'),
    ),
    showComparePrice: z.boolean().default(false),
    compareAtPrice: z.preprocess((val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const n = Number(val);
      return isNaN(n) ? undefined : n;
    }, z.number().min(0, 'Must be ≥ 0').optional()),
    stock: z.preprocess(
      (v) => (v === '' || v === undefined ? 0 : Number(v)),
      z.number().int().min(0, 'Stock must be ≥ 0'),
    ),
    unit: z.enum(UNITS),
    categoryId: z.string().min(1, 'Select a category'),
    slug: z.string().optional(),
    showStock: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.hasVariants) return; // variants supply their own prices
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

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface Category {
  id: string;
  name: string;
}

export interface ExistingVariant {
  id: string;
  label: string;
  price: string | number;
  compareAtPrice?: string | number | null;
  showComparePrice?: boolean;
  stock: number;
  sku?: string | null;
  isDefault: boolean;
  displayOrder: number;
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
  hasVariants?: boolean;
  variants?: ExistingVariant[];
  showStock?: boolean;
}

interface ProductFormProps {
  categories: Category[];
  token: string;
  product?: ExistingProduct;
}

// ---------------------------------------------------------------------------
// Variant row component
// ---------------------------------------------------------------------------

interface VariantRowProps {
  variant: VariantRow;
  index: number;
  total: number;
  onChange: (patch: Partial<VariantRow>) => void;
  onDelete: () => void;
  onMove: (dir: 'up' | 'down') => void;
  onSetDefault: () => void;
}

function VariantRowEditor({
  variant,
  index,
  total,
  onChange,
  onDelete,
  onMove,
  onSetDefault,
}: VariantRowProps) {
  const [showExtra, setShowExtra] = useState(variant.showComparePrice || !!variant.sku);

  const sellNum = parseFloat(variant.price) || 0;
  const origNum = parseFloat(variant.compareAtPrice) || 0;
  const showPreview = variant.showComparePrice && origNum > 0 && sellNum > 0 && origNum > sellNum;

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3 space-y-2.5">
      {/* ── Row 1: up/down + label + default star + delete ── */}
      <div className="flex items-start gap-2">
        {/* Up / down arrows */}
        <div className="flex flex-col gap-0.5 pt-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => onMove('up')}
            disabled={index === 0}
            className="flex h-5 w-5 items-center justify-center rounded text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 disabled:opacity-20"
            aria-label="Move up"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onMove('down')}
            disabled={index === total - 1}
            className="flex h-5 w-5 items-center justify-center rounded text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 disabled:opacity-20"
            aria-label="Move down"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={variant.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="e.g. 10x12 inch, 150g, Small"
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
          />
        </div>

        {/* Default star */}
        <button
          type="button"
          onClick={onSetDefault}
          title={variant.isDefault ? 'Default variant (pre-selected)' : 'Set as default'}
          className={`flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl border transition ${
            variant.isDefault
              ? 'border-amber-300 bg-amber-50 text-amber-500'
              : 'border-stone-200 text-stone-300 hover:text-stone-500'
          }`}
        >
          <svg
            className="h-4 w-4"
            fill={variant.isDefault ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 text-stone-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
          aria-label="Delete variant"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Row 2: price + stock ── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-stone-500">Price (₹) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={variant.price}
            onChange={(e) => onChange({ price: e.target.value })}
            placeholder="500"
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-stone-500">Stock *</label>
          <input
            type="number"
            min="0"
            value={variant.stock}
            onChange={(e) => onChange({ stock: e.target.value })}
            placeholder="10"
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
          />
        </div>
      </div>

      {/* ── Row 3: compare price + SKU (collapsible) ── */}
      {!showExtra ? (
        <button
          type="button"
          onClick={() => setShowExtra(true)}
          className="text-xs font-medium text-stone-400 transition hover:text-stone-600"
        >
          + Add sale price / SKU
        </button>
      ) : (
        <div className="space-y-2 rounded-xl bg-stone-50/80 p-2.5">
          {/* Compare price toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-stone-600">Show sale / compare price</label>
            <button
              type="button"
              role="switch"
              aria-checked={variant.showComparePrice}
              onClick={() => onChange({ showComparePrice: !variant.showComparePrice })}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                variant.showComparePrice ? 'bg-amber-500' : 'bg-stone-300'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  variant.showComparePrice ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {variant.showComparePrice && (
            <div className="space-y-1.5">
              <input
                type="number"
                step="0.01"
                min="0"
                value={variant.compareAtPrice}
                onChange={(e) => onChange({ compareAtPrice: e.target.value })}
                placeholder="MRP ₹ (e.g. 750)"
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
              />
              {showPreview && (
                <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs">
                  <span className="text-stone-400 line-through">
                    ₹{origNum.toLocaleString('en-IN')}
                  </span>
                  <span className="font-bold text-stone-900">
                    ₹{sellNum.toLocaleString('en-IN')}
                  </span>
                  <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">
                    {Math.round(((origNum - sellNum) / origNum) * 100)}% off
                  </span>
                </div>
              )}
            </div>
          )}

          {/* SKU */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-stone-600">SKU (optional)</label>
            <input
              type="text"
              value={variant.sku}
              onChange={(e) => onChange({ sku: e.target.value })}
              placeholder="e.g. RF-10x12-BLK"
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------

export function ProductForm({ categories, token, product }: ProductFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [variantError, setVariantError] = useState('');

  // Variants managed outside react-hook-form
  const [variants, setVariants] = useState<VariantRow[]>(() => {
    if (!product?.hasVariants || !product.variants?.length) return [];
    return product.variants
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((v) => ({
        _key: v.id,
        label: v.label,
        price: String(Number(v.price)),
        compareAtPrice: v.compareAtPrice != null ? String(Number(v.compareAtPrice)) : '',
        showComparePrice: v.showComparePrice ?? false,
        stock: String(v.stock),
        sku: v.sku ?? '',
        isDefault: v.isDefault,
      }));
  });

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
          hasVariants: product.hasVariants ?? false,
          showComparePrice: product.showComparePrice ?? false,
          compareAtPrice:
            product.compareAtPrice != null ? Number(product.compareAtPrice) : undefined,
          showStock: product.showStock ?? true,
        }
      : { unit: 'PIECE', showComparePrice: false, hasVariants: false, showStock: true },
  });

  const hasVariants = watch('hasVariants');
  const showComparePrice = watch('showComparePrice');
  const showStock = watch('showStock');
  const sellingPrice = watch('price') ?? 0;
  const compareAtPrice = watch('compareAtPrice') ?? 0;

  // ── Variant helpers ───────────────────────────────────────────────────────

  function addVariant() {
    setVariants((prev) => [
      ...prev,
      makeVariantRow('', prev.length === 0), // first variant auto-becomes default
    ]);
    setVariantError('');
  }

  function deleteVariant(i: number) {
    setVariants((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      // If we deleted the default, promote the first remaining one
      if (prev[i].isDefault && next.length > 0) {
        next[0] = { ...next[0], isDefault: true };
      }
      return next;
    });
  }

  function updateVariant(i: number, patch: Partial<VariantRow>) {
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }

  function setDefault(i: number) {
    setVariants((prev) => prev.map((v, idx) => ({ ...v, isDefault: idx === i })));
  }

  function moveVariant(i: number, dir: 'up' | 'down') {
    setVariants((prev) => {
      const next = [...prev];
      const swapIdx = dir === 'up' ? i - 1 : i + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[i], next[swapIdx]] = [next[swapIdx], next[i]];
      return next;
    });
  }

  function handlePreset(e: React.ChangeEvent<HTMLSelectElement>) {
    const key = e.target.value;
    if (!key) return;
    const labels = PRESETS[key] ?? [];
    const isFirst = variants.length === 0;
    setVariants((prev) => [
      ...prev,
      ...labels.map((label, i) => makeVariantRow(label, isFirst && i === 0)),
    ]);
    e.target.value = '';
    setVariantError('');
  }

  // ── Image upload ─────────────────────────────────────────────────────────

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

  // ── Submit ────────────────────────────────────────────────────────────────

  async function onSubmit(values: FormValues) {
    setServerError('');
    setVariantError('');

    // Validate variants when toggle is ON
    if (values.hasVariants) {
      if (variants.length === 0) {
        setVariantError('Add at least one variant.');
        return;
      }
      if (variants.some((v) => !v.label.trim())) {
        setVariantError('All variants must have a label.');
        return;
      }
      if (variants.some((v) => !v.price || parseFloat(v.price) <= 0)) {
        setVariantError('All variants must have a price greater than 0.');
        return;
      }
      if (!variants.some((v) => v.isDefault)) {
        setVariantError('Select a default variant (★).');
        return;
      }
    }

    try {
      const cleanVariants = values.hasVariants
        ? variants.map((v, i) => {
            const sell = parseFloat(v.price) || 0;
            const orig = parseFloat(v.compareAtPrice) || 0;
            const validSale = v.showComparePrice && orig > sell && sell > 0;
            return {
              label: v.label.trim(),
              price: sell,
              compareAtPrice: validSale ? orig : null,
              showComparePrice: validSale,
              stock: parseInt(v.stock) || 0,
              sku: v.sku.trim() || null,
              isDefault: v.isDefault,
              displayOrder: i,
            };
          })
        : [];

      // Derive product-level price + stock from variants when hasVariants=true
      const defaultVariant = cleanVariants.find((v) => v.isDefault) ?? cleanVariants[0];
      const payload = {
        ...values,
        images,
        hasVariants: values.hasVariants,
        showStock: values.showStock,
        price: values.hasVariants ? (defaultVariant?.price ?? 0) : values.price,
        stock: values.hasVariants ? cleanVariants.reduce((s, v) => s + v.stock, 0) : values.stock,
        showComparePrice: values.hasVariants ? false : values.showComparePrice,
        compareAtPrice: values.hasVariants
          ? null
          : values.showComparePrice
            ? (values.compareAtPrice ?? null)
            : null,
        variants: cleanVariants,
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* ── Name + Slug ─────────────────────────────────────────────── */}
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

        {/* ── Description ─────────────────────────────────────────────── */}
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

        {/* ── Variants toggle ─────────────────────────────────────────── */}
        <div className="rounded-2xl border border-stone-200 bg-stone-50/60 px-4 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-stone-700">
                Product has size / variant options
              </label>
              <p className="text-xs text-stone-400 mt-0.5">
                e.g. multiple frame sizes, weight options, volume choices
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hasVariants}
              onClick={() => setValue('hasVariants', !hasVariants, { shouldValidate: true })}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                hasVariants ? 'bg-amber-500' : 'bg-stone-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  hasVariants ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* ── Variant builder (shown when toggle ON) ────────────────── */}
          {hasVariants && (
            <div className="space-y-3">
              {/* Quick add presets */}
              <div className="flex items-center gap-2">
                <select
                  onChange={handlePreset}
                  defaultValue=""
                  className="flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-stone-500"
                >
                  <option value="" disabled>
                    Quick add preset sizes…
                  </option>
                  {Object.entries(PRESETS).map(([group, labels]) => (
                    <optgroup key={group} label={group}>
                      <option value={group}>{labels.join(', ')}</option>
                    </optgroup>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addVariant}
                  className="flex-shrink-0 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                >
                  + Add variant
                </button>
              </div>

              {/* Variant rows */}
              {variants.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-300 py-6 text-center text-sm text-stone-400">
                  No variants yet — use the preset or add manually
                </div>
              ) : (
                <div className="space-y-2">
                  {variants.map((v, i) => (
                    <VariantRowEditor
                      key={v._key}
                      variant={v}
                      index={i}
                      total={variants.length}
                      onChange={(patch) => updateVariant(i, patch)}
                      onDelete={() => deleteVariant(i)}
                      onMove={(dir) => moveVariant(i, dir)}
                      onSetDefault={() => setDefault(i)}
                    />
                  ))}
                </div>
              )}

              {/* Variant error */}
              {variantError && <p className="text-xs text-red-500">{variantError}</p>}

              {/* Live preview */}
              {variants.length > 0 && variants.some((v) => v.label && v.price) && (
                <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-xs text-stone-600">
                  <span className="font-semibold text-stone-400 uppercase tracking-wider text-[10px] mr-2">
                    Preview:
                  </span>
                  {variants
                    .filter((v) => v.label && v.price)
                    .map((v) => (
                      <span
                        key={v._key}
                        className={`mr-3 ${v.isDefault ? 'font-bold text-stone-900' : ''}`}
                      >
                        {v.label}{' '}
                        <span className="text-amber-600">
                          ₹{(parseFloat(v.price) || 0).toLocaleString('en-IN')}
                        </span>
                        {v.isDefault && (
                          <span className="ml-1 rounded-full bg-amber-100 px-1.5 text-amber-700">
                            default
                          </span>
                        )}
                      </span>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Base price / stock / unit (shown when variants OFF) ─────── */}
        {!hasVariants && (
          <>
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

            {/* ── Sale Price ───────────────────────────────────────────── */}
            <div className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50/60 px-4 py-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-stone-700">
                  Show sale / compare price
                </label>
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
                      Appears crossed-out — e.g. ₹2000 crossed out, selling at ₹1000
                    </p>
                    {errors.compareAtPrice && (
                      <p className="text-xs text-red-500">{errors.compareAtPrice.message}</p>
                    )}
                  </div>
                  {compareAtPrice > 0 && sellingPrice > 0 && compareAtPrice > sellingPrice && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-stone-200 bg-white px-4 py-3">
                      <span className="text-sm text-stone-400 line-through">
                        ₹{Number(compareAtPrice).toLocaleString('en-IN')}
                      </span>
                      <span className="text-base font-bold text-stone-900">
                        ₹{Number(sellingPrice).toLocaleString('en-IN')}
                      </span>
                      <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                        SAVE ₹
                        {(Number(compareAtPrice) - Number(sellingPrice)).toLocaleString('en-IN')} ·{' '}
                        {Math.round(
                          ((Number(compareAtPrice) - Number(sellingPrice)) /
                            Number(compareAtPrice)) *
                            100,
                        )}
                        % off
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Unit selector when variants ARE on (still needed for product listing) */}
        {hasVariants && (
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
        )}

        {/* ── Category ────────────────────────────────────────────────── */}
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

        {/* ── Show stock toggle ───────────────────────────────────────── */}
        <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50/60 px-4 py-4">
          <div>
            <label className="text-sm font-medium text-stone-700">
              Show stock count on product page
            </label>
            <p className="mt-0.5 text-xs text-stone-400">
              When off, customers won&apos;t see &quot;X in stock&quot; or &quot;Only X left&quot;
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showStock}
            onClick={() => setValue('showStock', !showStock, { shouldValidate: true })}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              showStock ? 'bg-amber-500' : 'bg-stone-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                showStock ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* ── Images ──────────────────────────────────────────────────── */}
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
