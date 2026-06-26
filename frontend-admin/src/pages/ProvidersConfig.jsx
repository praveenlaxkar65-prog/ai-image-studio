import React from 'react';
import { useEffect, useState } from 'react';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

export default function ProvidersConfig() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealedId, setRevealedId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    api
      .get('/providers')
      .then((res) => setProviders(res.data?.providers ?? res.data ?? []))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    if (!confirm('Remove this provider? Tools assigned to it will need reassigning.')) return;
    try {
      await api.delete(`/providers/${id}`);
    } catch {
      // backend not wired yet
    }
    setProviders((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleToggleActive(provider) {
    const updated = { ...provider, active: !provider.active };
    setProviders((prev) => prev.map((p) => (p.id === provider.id ? updated : p)));
    try {
      await api.patch(`/providers/${provider.id}`, { active: updated.active });
    } catch {
      // backend not wired yet — local state stays as the user set it
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="font-['Space_Grotesk'] text-xl font-medium">Providers</h1>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-[#7C5CFC] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#8E72FD]"
        >
          <Plus size={14} /> Add provider
        </button>
      </div>
      <p className="mb-6 text-sm text-[#9494A0]">
        AI provider adapters used by tools. Keys are encrypted at rest; only the last 4 characters are shown by default.
      </p>

      {showAddForm && <AddProviderForm onAdded={(p) => { setProviders((prev) => [...prev, p]); setShowAddForm(false); }} />}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-[#15151C]" />
          ))}
        </div>
      ) : providers.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#26262E] py-10 text-center text-sm text-[#9494A0]">
          No providers configured yet. Add one above to power your tools.
        </p>
      ) : (
        <div className="space-y-3">
          {providers.map((p) => (
            <div key={p.id} className="flex items-center gap-4 rounded-xl border border-[#26262E] bg-[#15151C] p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-['Space_Grotesk'] text-sm font-medium">{p.name}</p>
                  <span className="rounded-full bg-[#26262E] px-2 py-0.5 font-['JetBrains_Mono'] text-[10px] text-[#9494A0]">
                    {p.type}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 font-['JetBrains_Mono'] text-xs text-[#6B6B76]">
                  {revealedId === p.id ? p.apiKey : maskKey(p.apiKey)}
                  <button onClick={() => setRevealedId(revealedId === p.id ? null : p.id)} className="text-[#6B6B76] hover:text-[#F5F5F7]">
                    {revealedId === p.id ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleToggleActive(p)}
                className={`relative h-5 w-9 shrink-0 rounded-full transition ${p.active ? 'bg-[#7C5CFC]' : 'bg-[#26262E]'}`}
              >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${p.active ? 'left-[18px]' : 'left-0.5'}`} />
              </button>

              <button
                onClick={() => handleDelete(p.id)}
                className="rounded-md border border-[#26262E] p-1.5 text-[#9494A0] hover:border-[#f08a96]/50 hover:text-[#f08a96]"
                aria-label="Delete provider"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function maskKey(key) {
  if (!key) return '—';
  return `••••••••${key.slice(-4)}`;
}

function AddProviderForm({ onAdded }) {
  const [form, setForm] = useState({ name: '', type: 'stability', apiKey: '' });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/providers', form);
      onAdded(res.data?.provider ?? { ...form, id: `local_${Date.now()}`, active: true });
    } catch {
      onAdded({ ...form, id: `local_${Date.now()}`, active: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-5 grid gap-3 rounded-xl border border-[#26262E] bg-[#15151C] p-4 sm:grid-cols-[1fr_140px_1fr_auto]">
      <input
        name="name" value={form.name} onChange={handleChange} placeholder="Display name" required
        className="rounded-lg border border-[#26262E] bg-[#0B0B0F] px-3 py-2 text-sm outline-none focus:border-[#7C5CFC]"
      />
      <select
        name="type" value={form.type} onChange={handleChange}
        className="rounded-lg border border-[#26262E] bg-[#0B0B0F] px-3 py-2 text-sm outline-none focus:border-[#7C5CFC]"
      >
        <option value="stability">Stability AI</option>
        <option value="replicate">Replicate</option>
        <option value="openai">OpenAI</option>
        <option value="custom">Custom adapter</option>
      </select>
      <input
        name="apiKey" value={form.apiKey} onChange={handleChange} placeholder="API key" required type="password"
        className="rounded-lg border border-[#26262E] bg-[#0B0B0F] px-3 py-2 text-sm outline-none focus:border-[#7C5CFC]"
      />
      <button
        type="submit" disabled={saving}
        className="rounded-lg bg-[#7C5CFC] px-4 py-2 text-sm font-medium text-white hover:bg-[#8E72FD] disabled:opacity-60"
      >
        {saving ? 'Adding…' : 'Add'}
      </button>
    </form>
  );
}
