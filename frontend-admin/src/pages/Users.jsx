import { useEffect, useState } from 'react';
import { Search, Ban, CheckCircle2, Plus, Minus } from 'lucide-react';
import api from '../services/api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [adjustingId, setAdjustingId] = useState(null);

  useEffect(() => {
    api
      .get('/users')
      .then((res) => setUsers(res.data?.users ?? res.data ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(query.toLowerCase()) ||
      u.email?.toLowerCase().includes(query.toLowerCase()),
  );

  function updateLocal(id, patch) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  async function handleToggleBan(user) {
    const banned = !user.banned;
    updateLocal(user.id, { banned });
    try {
      await api.patch(`/users/${user.id}`, { banned });
    } catch {
      // backend not wired yet — local state already reflects the change
    }
  }

  async function handleAdjustCredits(user, delta) {
    setAdjustingId(user.id);
    const newCredits = Math.max(0, (user.credits ?? 0) + delta);
    updateLocal(user.id, { credits: newCredits });
    try {
      await api.post(`/users/${user.id}/credits`, { delta });
    } catch {
      // backend not wired yet
    } finally {
      setAdjustingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-1 font-['Space_Grotesk'] text-xl font-medium">Users</h1>
      <p className="mb-6 text-sm text-[#9494A0]">Search users, adjust credits, or suspend access.</p>

      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B76]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full max-w-sm rounded-lg border border-[#26262E] bg-[#15151C] py-2.5 pl-9 pr-3.5 text-sm outline-none placeholder:text-[#5A5A64] focus:border-[#7C5CFC] focus:ring-1 focus:ring-[#7C5CFC]/40"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-[#15151C]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#26262E] py-10 text-center text-sm text-[#9494A0]">
          No users found.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#26262E]">
          <div className="grid grid-cols-[1fr_110px_140px_90px] gap-3 border-b border-[#26262E] bg-[#15151C] px-4 py-2.5 font-['JetBrains_Mono'] text-[11px] uppercase tracking-wide text-[#6B6B76]">
            <span>User</span>
            <span>Credits</span>
            <span>Status</span>
            <span></span>
          </div>
          {filtered.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-[1fr_110px_140px_90px] items-center gap-3 border-b border-[#26262E] px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm">{user.name || '—'}</p>
                <p className="truncate font-['JetBrains_Mono'] text-[11px] text-[#6B6B76]">{user.email}</p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleAdjustCredits(user, -10)}
                  disabled={adjustingId === user.id}
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-[#26262E] hover:border-[#7C5CFC]/50 disabled:opacity-50"
                >
                  <Minus size={11} />
                </button>
                <span className="w-8 text-center font-['JetBrains_Mono'] text-xs">{user.credits ?? 0}</span>
                <button
                  onClick={() => handleAdjustCredits(user, 10)}
                  disabled={adjustingId === user.id}
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-[#26262E] hover:border-[#7C5CFC]/50 disabled:opacity-50"
                >
                  <Plus size={11} />
                </button>
              </div>

              <span
                className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                  user.banned ? 'bg-[#3a1f24] text-[#f08a96]' : 'bg-[#15301f] text-[#5fd98a]'
                }`}
              >
                {user.banned ? 'Banned' : 'Active'}
              </span>

              <button
                onClick={() => handleToggleBan(user)}
                className={`flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs ${
                  user.banned
                    ? 'border-[#26262E] hover:border-[#2DD4BF]/50 hover:text-[#2DD4BF]'
                    : 'border-[#26262E] hover:border-[#f08a96]/50 hover:text-[#f08a96]'
                }`}
              >
                {user.banned ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                {user.banned ? 'Unban' : 'Ban'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
