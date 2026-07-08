import { PageShell } from '@aaska/ui';

import { apiFetch } from '@/lib/api';
import { auth } from '@/lib/auth';
import { AnalyticsCharts } from '@/components/admin/AnalyticsCharts';
import { MonthPicker } from './month-picker';

interface AnalyticsOverview {
  totalVisits: number;
  uniqueVisitors: number;
  avgVisitsPerVisitor: number;
  dailyBreakdown: { date: string; visits: number; uniqueVisitors: number }[];
  topLocations: { state: string | null; city: string | null; count: number }[];
  topPages: { path: string; count: number }[];
  monthlyTrend: { month: string; visits: number; uniqueVisitors: number }[];
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const session = await auth();
  const token = session?.accessToken ?? '';

  const selectedMonth = month ?? currentMonth();
  const [year, mon] = selectedMonth.split('-').map(Number);
  const monthLabel = new Date(year, mon - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const data = await apiFetch<AnalyticsOverview>(
    `/admin/analytics/overview?month=${selectedMonth}`,
    { token },
  ).catch(
    (): AnalyticsOverview => ({
      totalVisits: 0,
      uniqueVisitors: 0,
      avgVisitsPerVisitor: 0,
      dailyBreakdown: [],
      topLocations: [],
      topPages: [],
      monthlyTrend: [],
    }),
  );

  const statCards = [
    { label: 'Total Page Views', value: data.totalVisits.toLocaleString('en-IN') },
    { label: 'Unique Visitors', value: data.uniqueVisitors.toLocaleString('en-IN') },
    { label: 'Avg. Views per Visitor', value: data.avgVisitsPerVisitor.toFixed(1) },
  ];

  return (
    <PageShell className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-stone-900">Visitor Analytics</h1>
          <p className="mt-0.5 text-sm text-stone-500">{monthLabel}</p>
        </div>
        <MonthPicker current={selectedMonth} />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-black text-stone-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <AnalyticsCharts daily={data.dailyBreakdown} monthly={data.monthlyTrend} />

      {/* Tables row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Locations */}
        <div className="rounded-2xl border border-stone-200 bg-white">
          <div className="border-b border-stone-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-stone-700">Top Locations</h3>
          </div>
          {data.topLocations.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-stone-400">No location data yet.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {data.topLocations.map((loc, i) => (
                <li key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400">📍</span>
                    <span className="text-stone-700">
                      {loc.city && loc.state
                        ? `${loc.city}, ${loc.state}`
                        : loc.state ?? loc.city ?? 'Unknown'}
                    </span>
                  </div>
                  <span className="font-semibold text-stone-900">
                    {loc.count.toLocaleString('en-IN')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top Pages */}
        <div className="rounded-2xl border border-stone-200 bg-white">
          <div className="border-b border-stone-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-stone-700">Top Pages</h3>
          </div>
          {data.topPages.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-stone-400">No page data yet.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {data.topPages.map((page, i) => (
                <li key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="truncate font-mono text-xs text-stone-600">{page.path}</span>
                  <span className="ml-3 flex-shrink-0 font-semibold text-stone-900">
                    {page.count.toLocaleString('en-IN')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageShell>
  );
}
