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
      .get('/moderation/flags', { params: { status: 'pending' } })
      .then((res) => setFlags(res.data?.flags ?? res.data ?? []))
      .catch(() => setFlags([]))
      .finally(() => setLoading(false));
  }

  async function handleAction(flag, action) {
    setActingId(flag.id);
    try {
      await api.post(`/moderation/flags/${flag.id}/${action}`); // action: 'approve' | 'reject'
    } catch {
      // backend not wired yet
    } finally {
      setFlags((prev) => prev.filter((f) => f.id !== flag.id));
      setActingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="mb-1 font-['Space_Grotesk'] text-xl font-medium">Moderation</h1>
      <p className="mb-6 text-sm text-[#9494A0]">
        Content flagged by the Safety Layer (NSFW / deepfake / copyright). Approve to release, reject to block and notify the user.
      </p>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-lg bg-[#15151C]" />
          ))}
        </div>
      ) : flags.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#26262E] py-16 text-center">
          <ShieldAlert size={22} className="text-[#3a3a44]" strokeWidth={1.5} />
          <p className="text-sm text-[#9494A0]">Queue is clear. Nothing pending review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {flags.map((flag) => (
            <div key={flag.id} className="overflow-hidden rounded-xl border border-[#26262E] bg-[#15151C]">
              <div className="aspect-square overflow-hidden bg-[#0B0B0F]">
                <img src={flag.thumbnailUrl || flag.url} alt="Flagged content" className="h-full w-full object-cover" />
              </div>
              <div className="p-3">
                <span className="inline-block rounded-full bg-[#3a1f24] px-2 py-0.5 font-['JetBrains_Mono'] text-[10px] text-[#f08a96]">
                  {flag.reason || 'flagged'}
                </span>
                <p className="mt-1.5 truncate text-xs text-[#9494A0]">{flag.userEmail || `User #${flag.userId}`}</p>
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={() => handleAction(flag, 'approve')}
                    disabled={actingId === flag.id}
                    className="flex flex-1 items-center justify-center gap-1 rounded-md border border-[#26262E] py-1.5 text-xs hover:border-[#2DD4BF]/50 hover:text-[#2DD4BF] disabled:opacity-50"
                  >
                    <Check size={12} /> Approve
                  </button>
                  <button
                    onClick={() => handleAction(flag, 'reject')}
                    disabled={actingId === flag.id}
                    className="flex flex-1 items-center justify-center gap-1 rounded-md border border-[#26262E] py-1.5 text-xs hover:border-[#f08a96]/50 hover:text-[#f08a96] disabled:opacity-50"
                  >
                    <X size={12} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
