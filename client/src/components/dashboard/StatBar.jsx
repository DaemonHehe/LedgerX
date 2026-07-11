import { useEffect, useState } from 'react';
import { authFetch } from '../../lib/api.js';

export default function StatBar({ apiBaseUrl }) {
  const [stats, setStats] = useState({
    total_revenue: 0,
    receipt_count: 0,
    avg_order_value: 0,
    top_template_name: '-'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await authFetch(`${apiBaseUrl}/api/receipts/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [apiBaseUrl]);

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[
        { label: 'TOTAL REVENUE', value: formatCurrency(stats.total_revenue) },
        { label: 'TOTAL RECEIPTS', value: stats.receipt_count },
        { label: 'AVG ORDER VALUE', value: formatCurrency(stats.avg_order_value) },
        { label: 'TOP TEMPLATE', value: stats.top_template_name || '-' },
      ].map((stat, i) => (
        <div key={i} className="border border-[var(--line)] bg-[var(--bg-secondary)] p-4 flex flex-col justify-center">
          <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-widest mb-2">{stat.label}</p>
          <div className="text-xl lg:text-2xl font-mono text-text truncate">
            {loading ? <span className="animate-pulse">---</span> : stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}
