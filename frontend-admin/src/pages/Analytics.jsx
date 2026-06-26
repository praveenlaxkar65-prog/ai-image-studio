import React from 'react';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../services/api';

const COLORS = ['#7C5CFC', '#2DD4BF', '#f0b94f', '#f08a96', '#5fa8f0', '#9580FD'];

export default function Analytics() {
  const [usage, setUsage] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api.get('/analytics/tool-usage'), api.get('/analytics/revenue-series')]).then(
      ([usageRes, revRes]) => {
        if (usageRes.status === 'fulfilled') {
          const d = usageRes.value.data?.usage ?? usageRes.value.data;
          if (Array.isArray(d)) setUsage(d);
        }
        if (revRes.status === 'fulfilled') {
          const d = revRes.value.data?.series ?? revRes.value.data;
          if (Array.isArray(d)) setRevenue(d);
        }
        setLoading(false);
      },
    );
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-6 font-['Space_Grotesk'] text-xl font-medium">Analytics</h1>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-[#26262E] bg-[#15151C] p-5">
          <h2 className="mb-4 font-['Space_Grotesk'] text-sm font-medium text-[#9494A0]">
            Tool usage share
          </h2>
          {usage.length === 0 ? (
            <EmptyChart loading={loading} />
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

        <div className="rounded-xl border border-[#26262E] bg-[#15151C] p-5">
          <h2 className="mb-4 font-['Space_Grotesk'] text-sm font-medium text-[#9494A0]">
            Revenue — last 7 days
          </h2>
          {revenue.length === 0 ? (
            <EmptyChart loading={loading} />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#26262E" />
                  <XAxis dataKey="day" stroke="#6B6B76" fontSize={11} />
                  <YAxis stroke="#6B6B76" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#15151C', border: '1px solid #26262E', borderRadius: 8 }} />
                  <Bar dataKey="amount" fill="#2DD4BF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ loading }) {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-[#6B6B76]">
      {loading ? 'Loading…' : 'No data yet.'}
    </div>
  );
}
