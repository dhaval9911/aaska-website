import { PageShell } from '@aaska/ui';

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200/80 bg-white/70 py-10">
      <PageShell className="flex flex-col gap-3 text-sm text-stone-600 md:flex-row md:items-center md:justify-between">
        <p>Resin art commerce foundation for custom gifts, finished products, and raw materials.</p>
        <p>© Resin Dreams — Handcrafted resin art from Ahmedabad, Gujarat.</p>
      </PageShell>
    </footer>
  );
}
