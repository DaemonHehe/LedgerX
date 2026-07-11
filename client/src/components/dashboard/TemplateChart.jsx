import { useEffect, useState } from 'react';
import { authFetch } from '../../lib/api.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function TemplateChart({ apiBaseUrl }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await authFetch(`${apiBaseUrl}/api/receipts/analytics/by-template`);
        if (response.ok) {
          const json = await response.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to fetch template performance', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [apiBaseUrl]);

  if (loading) return <div className="h-64 border border-[var(--line)] flex items-center justify-center font-mono text-sm text-[var(--ink-muted)]">Loading chart...</div>;

  return (
    <div className="border border-[var(--line)] bg-[var(--bg-primary)] p-4 h-64 flex flex-col">
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-[var(--ink-soft)]">Top Templates</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="template_name" 
              tick={{ fontSize: 10, fill: 'var(--ink)' }} 
              axisLine={false} 
              tickLine={false}
              width={100}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--line)', borderRadius: 0, fontFamily: 'monospace', fontSize: 12 }}
              itemStyle={{ color: 'var(--text)' }}
              cursor={{ fill: 'var(--bg-secondary)' }}
            />
            <Bar dataKey="count" fill="var(--ink-muted)" name="Usage Count" radius={[0, 2, 2, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
