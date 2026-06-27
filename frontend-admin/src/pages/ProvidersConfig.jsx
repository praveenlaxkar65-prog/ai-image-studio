import React from 'react';
import { useEffect, useState } from 'react';
import { Plus, Trash2, Zap } from 'lucide-react';
import api from '../services/api';

export default function ProvidersConfig() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [testingId, setTestingId] = useState(null);

  useEffect(() => {
    api
      .get('/providers')
      .then((res) => setProviders(res.data?.providers ?? []))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    if (!confirm('Remove this provider? Tools assigned to it will need reassigning.')) return;
    try {
      await api.delete(`/providers/${id}`);
    } catch {}
    setProviders((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleToggleStatus(provider) {
    const newStatus = provider.status === 'active' ? 'inactive' : 'active';
    setProviders((prev) => prev.map((p) => (p.id === provider.id ? { ...p, status: newStatus } : p)));
    try {
      await api.put(`/providers/${provider.id}`, { status: newStatus });
    } catch {}
  }

  async function handleTest(provider) {
    setTestingId(provider.id);
    try {
      const res = await api.post(`/providers/${provider.id}/test`);
      alert(res.data?.healthy ? 'Provider is healthy ✅' : 'Health-check failed — adapter may be missing or misconfigured.');
    } catch {
      alert('Could not run health-check.');
    } finally {
      setTestingId(null);
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
        AI provider adapters used by tools. API keys are masked after creation.
      </p>

      {showAddForm && (
        <AddProviderForm
          onAdded={(p) => {
            setProviders((prev) => [...prev, p]);
            setShowAddForm(false);
          }}
        />
      )}

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
                <p className="font-['Space_Grotesk'] text-sm font-medium">{p.provider_name}</p>
                <p className="mt-1 truncate font-['JetBrains_Mono'] text-xs text-[#6B6B76]">{p.endpoint_url}</p>
                <p className="mt-1 font-['JetBrains_Mono'] text-xs text-[#6B6B76]">
                  Key: {p.api_key_encrypted || '— none —'}
                </p>
              </div>

              <button
                onClick={() => handleTest(p)}
                disabled={testingId === p.id}
                className="flex items-center gap-1 rounded-md border border-[#26262E] px-2 py-1.5 text-xs hover:border-[#2DD4BF]/50 hover:text-[#2DD4BF] disabled:opacity-50"
              >
                <Zap size={12} /> {testingId === p.id ? 'Testing…' : 'Test'}
              </button>

              <button
                onClick={() => handleToggleStatus(p)}
                className={`relative h-5 w-9 shrink-0 rounded-full transition ${p.status === 'active' ? 'bg-[#7C5CFC]' : 'bg-[#26262E]'}`}
              >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${p.status === 'active' ? 'left-[18px]' : 'left-0.5'}`} />
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

function AddProviderForm({ onAdded }) {
  const [form, setForm] = useState({ provider_name: '', endpoint_url: '', api_key: '' });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/providers', form);
      onAdded(res.data?.provider);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not add provider.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-5 grid gap-3 rounded-xl border border-[#26262E] bg-[#15151C] p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
      <input
        name="provider_name" value={form.provider_name} onChange={handleChange} placeholder="Provider name (e.g. Stability AI)" required
        className="rounded-lg border border-[#26262E] bg-[#0B0B0F] px-3 py-2 text-sm outline-none focus:border-[#7C5CFC]"
      />
      <input
        name="endpoint_url" value={form.endpoint_url} onChange={handleChange} placeholder="Endpoint URL" required
        className="rounded-lg border border-[#26262E] bg-[#0B0B0F] px-3 py-2 text-sm outline-none focus:border-[#7C5CFC]"
      />
      <input
        name="api_key" value={form.api_key} onChange={handleChange} placeholder="API key" type="password"
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
