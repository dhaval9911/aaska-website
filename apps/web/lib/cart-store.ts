import { create } from 'zustand';

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  images: string[];
  unit: string;
  stock: number;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: CartProduct;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

/**
 * UUID generator that works in both secure (HTTPS) and insecure (HTTP LAN)
 * contexts.  crypto.randomUUID() requires a secure context; on plain HTTP
 * we fall back to a Math.random()-based v4 UUID.
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for HTTP on local network
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Stable guest session ID — generated once per browser, lives in localStorage. */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('cart_session');
  if (!id) {
    id = generateUUID();
    localStorage.setItem('cart_session', id);
  }
  return id;
}

function cartHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-cart-session': getSessionId(),
  };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  loading: boolean;

  // UI
  openCart: () => void;
  closeCart: () => void;

  // Server sync
  fetchCart: (token?: string, silent?: boolean) => Promise<void>;
  addItem: (productId: string, quantity: number, token?: string) => Promise<void>;
  updateItem: (id: string, quantity: number, token?: string) => Promise<void>;
  removeItem: (id: string, token?: string) => Promise<void>;
  mergeCart: (token: string) => Promise<void>;
  clearLocalCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,
  loading: false,

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  clearLocalCart: () => set({ items: [] }),

  fetchCart: async (token, silent = false) => {
    if (!silent) set({ loading: true });
    try {
      const res = await fetch(`${API}/cart`, { headers: cartHeaders(token) });
      if (res.ok) {
        const items: CartItem[] = await res.json();
        set({ items });
      }
    } finally {
      if (!silent) set({ loading: false });
    }
  },

  addItem: async (productId, quantity = 1, token) => {
    const res = await fetch(`${API}/cart`, {
      method: 'POST',
      headers: cartHeaders(token),
      body: JSON.stringify({ productId, quantity }),
    });
    if (!res.ok) throw new Error('Failed to add to cart');

    // Re-fetch to keep state consistent
    await get().fetchCart(token);
    set({ isOpen: true });
  },

  updateItem: async (id, quantity, token) => {
    // Optimistic update — reflect the new quantity immediately, no loading flash
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
    }));
    try {
      const res = await fetch(`${API}/cart/${id}`, {
        method: 'PATCH',
        headers: cartHeaders(token),
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error('Failed to update cart');
      // Silent background sync to stay consistent with server
      await get().fetchCart(token, true);
    } catch {
      // Revert by re-fetching with spinner
      await get().fetchCart(token);
    }
  },

  removeItem: async (id, token) => {
    const res = await fetch(`${API}/cart/${id}`, {
      method: 'DELETE',
      headers: cartHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to remove item');
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },

  mergeCart: async (token) => {
    await fetch(`${API}/cart/merge`, {
      method: 'POST',
      headers: cartHeaders(token),
    });
    // After merge, re-fetch user's full cart
    await get().fetchCart(token);
  },
}));

// Derived helpers
export const cartCount = (items: CartItem[]) => items.reduce((s, i) => s + i.quantity, 0);
export const cartTotal = (items: CartItem[]) =>
  items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
