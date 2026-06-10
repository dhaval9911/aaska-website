'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

import { Button } from '@aaska/ui';

import { useCartStore } from '@/lib/cart-store';

interface AddToCartProps {
  productId: string;
  stock: number;
  variantId?: string;
  className?: string;
  size?: 'default' | 'sm';
}

export function AddToCart({
  productId,
  stock,
  variantId,
  className,
  size = 'default',
}: AddToCartProps) {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const addItem = useCartStore((s) => s.addItem);

  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  if (stock === 0) {
    return (
      <Button disabled className={className} variant="outline">
        Out of stock
      </Button>
    );
  }

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (state === 'loading') return;
    setState('loading');
    try {
      await addItem(productId, 1, token, variantId);
      setState('done');
      setTimeout(() => setState('idle'), 1500);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    }
  }

  const label = {
    idle: size === 'sm' ? 'Add' : 'Add to cart',
    loading: '...',
    done: '✓ Added',
    error: 'Try again',
  }[state];

  return (
    <Button
      onClick={handleAdd}
      disabled={state === 'loading'}
      className={className}
      variant={state === 'done' ? 'outline' : 'default'}
    >
      {label}
    </Button>
  );
}
