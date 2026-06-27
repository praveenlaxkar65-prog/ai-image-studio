import React from 'react';
import { useEffect, useState } from 'react';
import { Check, X, ShieldAlert } from 'lucide-react';
import api from '../services/api';

export default function Moderation() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    fetchFlags();
  }, []);

  function fetchFlags() {
    setLoading(true);
    api
      .get('/moderation', { params: { status: 'pending', limit: 50 } })
      .then((res) => setFlags(res.data?.flags ?? []))
      .catch(() => setFlags([]))
      .finally(() => setLoading(false));
  }

  async function handleResolve(flag, decision) {
    setActingId(flag.id);
    try {
      await api.put(`/moderation/${flag.id}/resolve`, { decision });
      setFlags((prev) => prev.filter((f) => f.id !== flag.id));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not resolve flag.');
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-1 font-['Space_Grotesk'] text-xl font-medium">Moderation</h1>
      <p className="mb-6 text-sm text-[#9494A0]">
        Content flagged by the Safety Layer (NSFW / deepfake / copyright). Approve to release, reject to block.
      </p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-[#15151C]" />
          ))}
        </div>
      ) : flags.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#26262E] py-16 text-center">
          <ShieldAlert size={22} className="text-[#3a3a44]" strokeWidth={1.5} />
          <p className="text-sm text-[#9494A0]">Queue is clear. Nothing pending review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <div key={flag.id} className="flex items-center gap-4 rounded-xl border border-[#26262E] bg-[#15151C] p-4">
              <div className="flex-1">
                <span className="inline-block rounded-full bg-[#3a1f24] px-2 py-0.5 font-['JetBrains_Mono'] text-[10px] text-[#f08a96]">
                  {flag.flag_type}
                </span>
                <p className="mt-1.5 text-sm text-[#E4E4E8]">{flag.flag_reason || 'No reason provided.'}</p>
                <p className="mt-1 font-['JetBrains_Mono'] text-[11px] text-[#6B6B76]">
                  Project: {flag.project_id} · {new Date(flag.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => handleResolve(flag, 'approved')}
                disabled={actingId === flag.id}
                className="flex items-center gap-1 rounded-md border border-[#26262E] px-3 py-1.5 text-xs hover:border-[#2DD4BF]/50 hover:text-[#2DD4BF] disabled:opacity-50"
              >
                <Check size={12} /> Approve
              </button>
              <button
                onClick={() => handleResolve(flag, 'rejected')}
                disabled={actingId === flag.id}
                className="flex items-center gap-1 rounded-md border border-[#26262E] px-3 py-1.5 text-xs hover:border-[#f08a96]/50 hover:text-[#f08a96] disabled:opacity-50"
              >
                <X size={12} /> Reject
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
