import Image from 'next/image';

import { PageShell } from '@aaska/ui';

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200/80 bg-white/70 py-10">
      <PageShell className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Resin Dreams"
            width={100}
            height={100}
            className="h-14 w-auto object-contain"
          />
          <p className="text-sm text-stone-600">Handcrafted resin art from Ahmedabad, Gujarat.</p>
        </div>
        <p className="text-sm text-stone-500">
          © {new Date().getFullYear()} Resin Dreams. All rights reserved.
        </p>
      </PageShell>
    </footer>
  );
}
