'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DailyPoint {
  date: string;
  visits: number;
  uniqueVisitors: number;
}

interface MonthlyPoint {
  month: string;
  visits: number;
  uniqueVisitors: number;
}

interface Props {
  daily: DailyPoint[];
  monthly: MonthlyPoint[];
}

const shortDate = (iso: string) => {
  const [, , day] = iso.split('-');
  return day ? `${parseInt(day)}` : iso;
};

const shortMonth = (ym: string) => {
  const [year, mon] = ym.split('-');
  const d = new Date(Number(year), Number(mon) - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};

export function AnalyticsCharts({ daily, monthly }: Props) {
  return (
    <div className="space-y-8">
      {/* Daily visitors */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-stone-700">Daily Visitors This Month</h3>
        {daily.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">No data for this month yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={daily} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                tick={{ fontSize: 11, fill: '#a8a29e' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#a8a29e' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: '10px', border: '1px solid #e7e5e4', fontSize: 12 }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="visits"
                name="Page Views"
                stroke="#c4b5a0"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="uniqueVisitors"
                name="Unique Visitors"
                stroke="#78716c"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Monthly growth */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-stone-700">Monthly Growth (Last 12 Months)</h3>
        {monthly.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">No trend data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
              <XAxis
                dataKey="month"
                tickFormatter={shortMonth}
                tick={{ fontSize: 11, fill: '#a8a29e' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#a8a29e' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: '10px', border: '1px solid #e7e5e4', fontSize: 12 }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                labelFormatter={(label: any) => shortMonth(String(label))}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="visits" name="Page Views" fill="#c4b5a0" radius={[4, 4, 0, 0]} />
              <Bar dataKey="uniqueVisitors" name="Unique Visitors" fill="#78716c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
