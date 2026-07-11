import { useEffect, useState } from 'react';
import { authFetch } from '../../lib/api.js';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function MonthlyChart({ apiBaseUrl }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('revenue'); // 'revenue' or 'count'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const response = await authFetch(`${apiBaseUrl}/api/receipts/analytics/monthly?tz=${encodeURIComponent(tz)}`);
        if (response.ok) {
          const json = await response.json();
          const formatted = json.map(row => {
            const [year, month] = row.month.split('-');
            const d = new Date(year, month - 1);
            return {
              ...row,
              label: d.toLocaleString('default', { month: 'short' })
            };
          });
          setData(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch monthly data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [apiBaseUrl]);

  if (loading) return <div className="h-64 border border-[var(--line)] flex items-center justify-center font-mono text-sm text-[var(--ink-muted)]">Loading chart...</div>;

  return (
    <div className="border border-[var(--line)] bg-[var(--bg-primary)] p-4 h-64 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">Monthly Trend</h3>
        <div className="flex gap-2">
          <button 
            className={`text-[10px] font-mono px-2 py-0.5 border ${view === 'revenue' ? 'border-text bg-text text-bg' : 'border-[var(--line)] text-[var(--ink-muted)]'}`}
            onClick={() => setView('revenue')}
          >
            Rev
          </button>
          <button 
            className={`text-[10px] font-mono px-2 py-0.5 border ${view === 'count' ? 'border-text bg-text text-bg' : 'border-[var(--line)] text-[var(--ink-muted)]'}`}
            onClick={() => setView('count')}
          >
            Count
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={view === 'revenue' ? "var(--accent-red)" : "var(--ink)"} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={view === 'revenue' ? "var(--accent-red)" : "var(--ink)"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--ink-muted)' }} axisLine={false} tickLine={false} />
            <YAxis 
              tickFormatter={(val) => view === 'revenue' ? `$${val}` : val} 
              tick={{ fontSize: 10, fill: 'var(--ink-muted)' }} 
              axisLine={false} 
              tickLine={false} 
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--line)', borderRadius: 0, fontFamily: 'monospace', fontSize: 12 }}
              itemStyle={{ color: 'var(--text)' }}
              formatter={(value) => [view === 'revenue' ? `$${value}` : value, view === 'revenue' ? 'Revenue' : 'Count']}
            />
            <Area 
              type="monotone" 
              dataKey={view} 
              stroke={view === 'revenue' ? "var(--accent-red)" : "var(--ink)"} 
              fillOpacity={1} 
              fill="url(#colorValue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
