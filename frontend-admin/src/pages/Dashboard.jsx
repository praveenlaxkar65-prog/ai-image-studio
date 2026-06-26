import { useEffect, useState } from 'react';
import { Users, Zap, Activity, ShieldAlert } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import api from '../services/api';

const FALLBACK_STATS = { totalUsers: 0, creditsSpentToday: 0, jobsToday: 0, pendingModeration: 0 };
const FALLBACK_SERIES = Array.from({ length: 7 }).map((_, i) => ({ day: `D${i + 1}`, jobs: 0 }));

export default function Dashboard() {
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [series, setSeries] = useState(FALLBACK_SERIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api.get('/analytics/summary'), api.get('/analytics/jobs-series')]).then(
      ([statsRes, seriesRes]) => {
        if (statsRes.status === 'fulfilled') setStats((p) => ({ ...p, ...statsRes.value.data }));
        if (seriesRes.status === 'fulfilled') {
          const data = seriesRes.value.data?.series ?? seriesRes.value.data;
          if (Array.isArray(data) && data.length) setSeries(data);
        }
        setLoading(false);
      },
    );
  }, []);

  const cards = [
    { label: 'Total users', value: stats.totalUsers, icon: Users, color: '#7C5CFC' },
    { label: 'Credits spent today', value: stats.creditsSpentToday, icon: Zap, color: '#2DD4BF' },
    { label: 'Jobs today', value: stats.jobsToday, icon: Activity, color: '#7C5CFC' },
    { label: 'Pending moderation', value: stats.pendingModeration, icon: ShieldAlert, color: '#f08a96' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 font-['Space_Grotesk'] text-xl font-medium">Overview</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      <div className="rounded-xl border border-[#26262E] bg-[#15151C] p-5">
        <h2 className="mb-4 font-['Space_Grotesk'] text-sm font-medium text-[#9494A0]">
          Jobs processed — last 7 days
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#26262E" />
              <XAxis dataKey="day" stroke="#6B6B76" fontSize={11} />
              <YAxis stroke="#6B6B76" fontSize={11} />
              <Tooltip
                contentStyle={{ background: '#15151C', border: '1px solid #26262E', borderRadius: 8 }}
                labelStyle={{ color: '#F5F5F7' }}
              />
              <Line type="monotone" dataKey="jobs" stroke="#7C5CFC" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
