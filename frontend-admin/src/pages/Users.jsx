import React from 'react';
import { useEffect, useState } from 'react';
import { Search, Ban, CheckCircle2, Plus } from 'lucide-react';
import api from '../services/api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  function fetchUsers(search = '') {
    setLoading(true);
    api
      .get('/users', { params: { limit: 50, search } })
      .then((res) => setUsers(res.data?.users ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchUsers(query);
  }

  function updateLocal(id, patch) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  async function handleToggleBan(user) {
    const nextStatus = user.status === 'banned' ? 'active' : 'banned';
    setBusyId(user.id);
    try {
      await api.put(`/users/${user.id}/status`, { status: nextStatus });
      updateLocal(user.id, { status: nextStatus });
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update status.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleAddCredits(user) {
    const input = prompt(`How many credits to add to ${user.name || user.email}?`, '10');
    const amount = Number(input);
    if (!amount || amount <= 0) return;

    setBusyId(user.id);
    try {
      const res = await api.post(`/users/${user.id}/add-credits`, { amount });
      updateLocal(user.id, { credits_balance: res.data?.newBalance ?? user.credits_balance + amount });
    } catch (err) {
      alert(err.response?.data?.message || 'Could not add credits.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-1 font-['Space_Grotesk'] text-xl font-medium">Users</h1>
      <p className="mb-6 text-sm text-[#9494A0]">Search users, add credits, or suspend access.</p>

      <form onSubmit={handleSearchSubmit} className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B76]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email, press Enter…"
          className="w-full rounded-lg border border-[#26262E] bg-[#15151C] py-2.5 pl-9 pr-3.5 text-sm outline-none placeholder:text-[#5A5A64] focus:border-[#7C5CFC] focus:ring-1 focus:ring-[#7C5CFC]/40"
        />
      </form>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-[#15151C]" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#26262E] py-10 text-center text-sm text-[#9494A0]">
          No users found.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#26262E]">
          <div className="grid grid-cols-[1fr_110px_140px_140px] gap-3 border-b border-[#26262E] bg-[#15151C] px-4 py-2.5 font-['JetBrains_Mono'] text-[11px] uppercase tracking-wide text-[#6B6B76]">
            <span>User</span>
            <span>Credits</span>
            <span>Status</span>
            <span></span>
          </div>
          {users.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-[1fr_110px_140px_140px] items-center gap-3 border-b border-[#26262E] px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm">{user.name || '—'}</p>
                <p className="truncate font-['JetBrains_Mono'] text-[11px] text-[#6B6B76]">{user.email}</p>
              </div>

              <button
                onClick={() => handleAddCredits(user)}
                disabled={busyId === user.id}
                className="flex items-center gap-1 font-['JetBrains_Mono'] text-xs hover:text-[#7C5CFC] disabled:opacity-50"
              >
                {user.credits_balance ?? 0} <Plus size={11} />
              </button>

              <span
                className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                  user.status === 'banned' ? 'bg-[#3a1f24] text-[#f08a96]' : 'bg-[#15301f] text-[#5fd98a]'
                }`}
              >
                {user.status === 'banned' ? 'Banned' : 'Active'}
              </span>

              <button
                onClick={() => handleToggleBan(user)}
                disabled={busyId === user.id}
                className={`flex items-center justify-center gap-1 rounded-md border border-[#26262E] px-2 py-1.5 text-xs disabled:opacity-50 ${
                  user.status === 'banned'
                    ? 'hover:border-[#2DD4BF]/50 hover:text-[#2DD4BF]'
                    : 'hover:border-[#f08a96]/50 hover:text-[#f08a96]'
                }`}
              >
                {user.status === 'banned' ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                {user.status === 'banned' ? 'Unban' : 'Ban'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
