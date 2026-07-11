import { useEffect, useState } from 'react';
import { authFetch } from '../../lib/api.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeeklyChart({ apiBaseUrl }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const response = await authFetch(`${apiBaseUrl}/api/receipts/analytics/weekly?tz=${encodeURIComponent(tz)}`);
        if (response.ok) {
          const json = await response.json();
          // Map to shorter labels
          const formatted = json.map(row => {
             const d = new Date(row.week_start);
             return {
               ...row,
               label: `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`
             };
          });
          setData(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch weekly data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [apiBaseUrl]);

  if (loading) return <div className="h-64 border border-[var(--line)] flex items-center justify-center font-mono text-sm text-[var(--ink-muted)]">Loading chart...</div>;

  return (
    <div className="border border-[var(--line)] bg-[var(--bg-primary)] p-4 h-64 flex flex-col">
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-[var(--ink-soft)]">Weekly Revenue & Count</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--ink-muted)' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tickFormatter={(val) => `$${val}`} tick={{ fontSize: 10, fill: 'var(--ink-muted)' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'var(--ink-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--line)', borderRadius: 0, fontFamily: 'monospace', fontSize: 12 }}
              itemStyle={{ color: 'var(--text)' }}
            />
            <Bar yAxisId="left" dataKey="revenue" fill="var(--accent-red)" name="Revenue" radius={[2, 2, 0, 0]} />
            <Bar yAxisId="right" dataKey="count" fill="var(--ink)" name="Count" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
