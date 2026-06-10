import type { Metadata } from 'next';

import { apiFetch } from '@/lib/api';
import { GalleryClient } from '@/components/gallery/GalleryClient';

export const metadata: Metadata = {
  title: 'Gallery | Resin Dreams',
  description:
    'Browse our handcrafted resin art gallery — frames, keychains, bangles and more. Every piece is unique.',
  openGraph: {
    title: 'Gallery | Resin Dreams',
    description:
      'Browse our handcrafted resin art gallery — frames, keychains, bangles and more. Every piece is unique.',
    type: 'website',
  },
};

export const revalidate = 60;

export interface GalleryProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  compareAtPrice: string | null;
  showComparePrice: boolean;
  images: string[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export default async function GalleryPage() {
  const products = await apiFetch<GalleryProduct[]>('/products').catch(
    () => [] as GalleryProduct[],
  );

  // Only include products that have at least one image; expand so each image
  // becomes its own gallery tile (shows the full range of the collection).
  const tiles = products.flatMap((p) =>
    p.images.map((src, i) => ({
      key: `${p.id}-${i}`,
      src,
      product: p,
    })),
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Page header */}
      <div className="py-12 text-center">
        <h1 className="font-serif text-4xl font-black text-stone-900 sm:text-5xl">Our Gallery</h1>
        <p className="mx-auto mt-3 max-w-md text-base text-stone-500">
          Every piece handcrafted with resin, pigment, and a whole lot of love.
        </p>
      </div>

      <GalleryClient tiles={tiles} />

      {/* Bottom padding for mobile nav bar */}
      <div className="h-20 md:h-8" />
    </div>
  );
}
