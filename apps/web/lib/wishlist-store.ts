import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  id: string;
  name: string;
  slug: string;
  price: string;
  images: string[];
  unit: string;
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  toggle: (item: WishlistItem) => void;
  hasItem: (id: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((s) => ({
          items: s.items.some((i) => i.id === item.id) ? s.items : [...s.items, item],
        })),

      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      toggle: (item) => {
        if (get().hasItem(item.id)) {
          get().removeItem(item.id);
        } else {
          get().addItem(item);
        }
      },

      hasItem: (id) => get().items.some((i) => i.id === id),

      clear: () => set({ items: [] }),
    }),
    { name: 'aaska-wishlist' },
  ),
);
