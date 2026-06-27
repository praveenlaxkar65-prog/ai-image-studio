import React from 'react';
import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import api from '../services/api';

const CATEGORIES = ['basic', 'enhance', 'ai_edit', 'generate', 'convert'];

export default function ToolsConfig() {
  const [tools, setTools] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    Promise.allSettled([api.get('/tools'), api.get('/providers')]).then(([toolsRes, providersRes]) => {
      if (toolsRes.status === 'fulfilled') setTools(toolsRes.value.data?.tools ?? []);
      if (providersRes.status === 'fulfilled') setProviders(providersRes.value.data?.providers ?? []);
      setLoading(false);
    });
  }, []);

  function updateLocal(toolKey, patch) {
    setTools((prev) => prev.map((t) => (t.tool_key === toolKey ? { ...t, ...patch } : t)));
  }

  async function handleSave(tool) {
    setSavingKey(tool.tool_key);
    try {
      await api.put(`/tools/${tool.tool_key}`, {
        is_active: tool.is_active,
        is_free: tool.is_free,
        credit_cost: tool.credit_cost,
        assigned_provider_id: tool.assigned_provider_id || null,
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Could not save.');
    } finally {
      setSavingKey(null);
    }
  }

  async function handleDelete(toolKey) {
    if (!confirm(`Delete "${toolKey}"?`)) return;
    try {
      await api.delete(`/tools/${toolKey}`);
      setTools((prev) => prev.filter((t) => t.tool_key !== toolKey));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete.');
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="font-['Space_Grotesk'] text-xl font-medium">Tools</h1>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-[#7C5CFC] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#8E72FD]"
        >
          <Plus size={14} /> Add tool
        </button>
      </div>
      <p className="mb-6 text-sm text-[#9494A0]">
        This table starts empty — add a row here for any tool_key your backend controllers expect
        (e.g. <code className="text-[#2DD4BF]">crop_image</code>, <code className="text-[#2DD4BF]">resize_image</code>,{' '}
        <code className="text-[#2DD4BF]">compress_image</code>) before that tool can run for users.
      </p>

      {showAddForm && (
        <AddToolForm
          onAdded={(t) => {
            setTools((prev) => [...prev, t]);
            setShowAddForm(false);
          }}
        />
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-[#15151C]" />
          ))}
        </div>
      ) : tools.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#26262E] py-10 text-center text-sm text-[#9494A0]">
          No tools configured yet. Click "Add tool" above to create one.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#26262E]">
          <div className="grid grid-cols-[1fr_80px_90px_100px_150px_70px] gap-3 border-b border-[#26262E] bg-[#15151C] px-4 py-2.5 font-['JetBrains_Mono'] text-[11px] uppercase tracking-wide text-[#6B6B76]">
            <span>Tool</span>
            <span>Active</span>
            <span>Free</span>
            <span>Credits</span>
            <span>Provider</span>
            <span></span>
          </div>
          {tools.map((tool) => (
            <div
              key={tool.tool_key}
              className="grid grid-cols-[1fr_80px_90px_100px_150px_70px] items-center gap-3 border-b border-[#26262E] px-4 py-3 last:border-b-0"
            >
              <div>
                <p className="text-sm">{tool.tool_name}</p>
                <p className="font-['JetBrains_Mono'] text-[11px] text-[#6B6B76]">
                  {tool.tool_key} · {tool.category}
                </p>
              </div>

              <button
                onClick={() => updateLocal(tool.tool_key, { is_active: !tool.is_active })}
                className={`relative h-5 w-9 rounded-full transition ${tool.is_active ? 'bg-[#7C5CFC]' : 'bg-[#26262E]'}`}
              >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${tool.is_active ? 'left-[18px]' : 'left-0.5'}`} />
              </button>

              <button
                onClick={() => updateLocal(tool.tool_key, { is_free: !tool.is_free })}
                className={`relative h-5 w-9 rounded-full transition ${tool.is_free ? 'bg-[#2DD4BF]' : 'bg-[#26262E]'}`}
              >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${tool.is_free ? 'left-[18px]' : 'left-0.5'}`} />
              </button>

              <input
                type="number" min={0} value={tool.credit_cost ?? 0}
                onChange={(e) => updateLocal(tool.tool_key, { credit_cost: Number(e.target.value) })}
                className="w-20 rounded-md border border-[#26262E] bg-[#0B0B0F] px-2 py-1 text-sm outline-none focus:border-[#7C5CFC]"
              />

              <select
                value={tool.assigned_provider_id ?? ''}
                onChange={(e) => updateLocal(tool.tool_key, { assigned_provider_id: e.target.value })}
                className="rounded-md border border-[#26262E] bg-[#0B0B0F] px-2 py-1 text-xs outline-none focus:border-[#7C5CFC]"
              >
                <option value="">— none —</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>{p.provider_name}</option>
                ))}
              </select>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleSave(tool)}
                  disabled={savingKey === tool.tool_key}
                  className="flex items-center justify-center rounded-md border border-[#26262E] p-1.5 hover:border-[#7C5CFC]/50 disabled:opacity-50"
                >
                  <Save size={14} className={savingKey === tool.tool_key ? 'animate-pulse text-[#7C5CFC]' : ''} />
                </button>
                <button
                  onClick={() => handleDelete(tool.tool_key)}
                  className="flex items-center justify-center rounded-md border border-[#26262E] p-1.5 text-[#9494A0] hover:border-[#f08a96]/50 hover:text-[#f08a96]"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddToolForm({ onAdded }) {
  const [form, setForm] = useState({ tool_key: '', tool_name: '', category: 'basic', credit_cost: 1 });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: name === 'credit_cost' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/tools', { ...form, is_active: true, is_free: false });
      onAdded(res.data?.tool);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not create tool.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-5 grid gap-3 rounded-xl border border-[#26262E] bg-[#15151C] p-4 sm:grid-cols-[1fr_1fr_140px_100px_auto]">
      <input
        name="tool_key" value={form.tool_key} onChange={handleChange} placeholder="tool_key (e.g. crop_image)" required
        className="rounded-lg border border-[#26262E] bg-[#0B0B0F] px-3 py-2 text-sm outline-none focus:border-[#7C5CFC]"
      />
      <input
        name="tool_name" value={form.tool_name} onChange={handleChange} placeholder="Display name (e.g. Crop)" required
        className="rounded-lg border border-[#26262E] bg-[#0B0B0F] px-3 py-2 text-sm outline-none focus:border-[#7C5CFC]"
      />
      <select
        name="category" value={form.category} onChange={handleChange}
        className="rounded-lg border border-[#26262E] bg-[#0B0B0F] px-3 py-2 text-sm outline-none focus:border-[#7C5CFC]"
      >
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <input
        type="number" min={0} name="credit_cost" value={form.credit_cost} onChange={handleChange} placeholder="Credits"
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
