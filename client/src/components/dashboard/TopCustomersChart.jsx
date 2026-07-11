import { useEffect, useState } from 'react';
import { authFetch } from '../../lib/api.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function TopCustomersChart({ apiBaseUrl }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await authFetch(`${apiBaseUrl}/api/receipts/analytics/top-customers`);
        if (response.ok) {
          const json = await response.json();
          // Sort ascending so the highest is at the top in the vertical bar chart
          const formatted = json.map(row => ({
            name: row.customer_name || 'Unknown',
            revenue: parseFloat(row.revenue) || 0,
            count: parseInt(row.receipt_count, 10) || 0
          })).sort((a, b) => a.revenue - b.revenue);
          setData(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch top customers data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [apiBaseUrl]);

  if (loading) return <div className="h-64 border border-[var(--line)] flex items-center justify-center font-mono text-sm text-[var(--ink-muted)]">Loading chart...</div>;

  return (
    <div className="border border-[var(--line)] bg-[var(--bg-primary)] p-4 h-64 flex flex-col">
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-[var(--ink-soft)]">Top 10 Customers</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: 'var(--ink-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'var(--bg-secondary)' }}
              contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--line)', borderRadius: 0, fontFamily: 'monospace', fontSize: 12 }}
              itemStyle={{ color: 'var(--text)' }}
              formatter={(value, name) => [name === 'revenue' ? `$${value}` : value, name === 'revenue' ? 'Revenue' : 'Receipts']}
            />
            <Bar dataKey="revenue" fill="var(--ink)" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
