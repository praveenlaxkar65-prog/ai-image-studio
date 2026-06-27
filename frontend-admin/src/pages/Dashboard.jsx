import React from 'react';
import { useEffect, useState } from 'react';
import { Users, Coins, TrendingDown, ShieldAlert } from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingModeration: 0,
    purchasedCredits: 0,
    usedCredits: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/users', { params: { limit: 1 } }),
      api.get('/moderation', { params: { status: 'pending', limit: 1 } }),
      api.get('/analytics/revenue'),
    ]).then(([usersRes, modRes, revRes]) => {
      setStats({
        totalUsers: usersRes.status === 'fulfilled' ? usersRes.value.data?.total ?? 0 : 0,
        pendingModeration: modRes.status === 'fulfilled' ? modRes.value.data?.total ?? 0 : 0,
        purchasedCredits: revRes.status === 'fulfilled' ? revRes.value.data?.purchasedCredits ?? 0 : 0,
        usedCredits: revRes.status === 'fulfilled' ? revRes.value.data?.usedCredits ?? 0 : 0,
      });
      setLoading(false);
    });
  }, []);

  const cards = [
    { label: 'Total users', value: stats.totalUsers, icon: Users, color: '#7C5CFC' },
    { label: 'Pending moderation', value: stats.pendingModeration, icon: ShieldAlert, color: '#f08a96' },
    { label: 'Purchased credits', value: stats.purchasedCredits, icon: Coins, color: '#2DD4BF' },
    { label: 'Used credits', value: stats.usedCredits, icon: TrendingDown, color: '#f0b94f' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-6 font-['Space_Grotesk'] text-xl font-medium">Overview</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-[#26262E] bg-[#15151C] p-5">
            <Icon size={18} style={{ color }} strokeWidth={1.75} />
            <p className="mt-3 font-['Space_Grotesk'] text-2xl font-medium">
              {loading ? '—' : value}
            </p>
            <p className="mt-1 text-xs text-[#9494A0]">{label}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-[#6B6B76]">
        See the Analytics page for tool-usage breakdown by type.
      </p>
    </div>
  );
}
