import React from 'react';
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Coins, TrendingDown, TrendingUp } from 'lucide-react';
import api from '../services/api';

const COLORS = ['#7C5CFC', '#2DD4BF', '#f0b94f', '#f08a96', '#5fa8f0', '#9580FD'];

export default function Analytics() {
  const [usage, setUsage] = useState([]);
  const [revenue, setRevenue] = useState({ purchasedCredits: 0, usedCredits: 0, netCredits: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api.get('/admin/analytics/usage'), api.get('/admin/analytics/revenue')]).then(
      ([usageRes, revRes]) => {
        if (usageRes.status === 'fulfilled') {
          const stats = usageRes.value.data?.stats ?? {};
          setUsage(Object.entries(stats).map(([tool, count]) => ({ tool, count })));
        }
        if (revRes.status === 'fulfilled') {
          const d = revRes.value.data;
          setRevenue({
            purchasedCredits: d?.purchasedCredits ?? 0,
            usedCredits: d?.usedCredits ?? 0,
            netCredits: d?.netCredits ?? 0,
          });
        }
        setLoading(false);
      },
    );
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-6 font-['Space_Grotesk'] text-xl font-medium">Analytics</h1>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <SummaryCard label="Purchased credits" value={revenue.purchasedCredits} icon={TrendingUp} color="#2DD4BF" loading={loading} />
        <SummaryCard label="Used credits" value={revenue.usedCredits} icon={TrendingDown} color="#f0b94f" loading={loading} />
        <SummaryCard label="Net credits" value={revenue.netCredits} icon={Coins} color="#7C5CFC" loading={loading} />
      </div>

      <div className="rounded-xl border border-[#26262E] bg-[#15151C] p-5">
        <h2 className="mb-4 font-['Space_Grotesk'] text-sm font-medium text-[#9494A0]">Tool usage share</h2>
        {loading ? (
          <div className="flex h-64 items-center justify-center text-sm text-[#6B6B76]">Loading…</div>
        ) : usage.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-[#6B6B76]">No usage data yet.</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={usage} dataKey="count" nameKey="tool" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {usage.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#15151C', border: '1px solid #26262E', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#9494A0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color, loading }) {
  return (
    <div className="rounded-xl border border-[#26262E] bg-[#15151C] p-5">
      <Icon size={18} style={{ color }} strokeWidth={1.75} />
      <p className="mt-3 font-['Space_Grotesk'] text-2xl font-medium">{loading ? '—' : value}</p>
      <p className="mt-1 text-xs text-[#9494A0]">{label}</p>
    </div>
  );
}
