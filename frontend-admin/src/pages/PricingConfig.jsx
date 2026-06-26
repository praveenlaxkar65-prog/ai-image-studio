import React from 'react';
import { useEffect, useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import api from '../services/api';

export default function PricingConfig() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    api
      .get('/pricing/packs')
      .then((res) => setPacks(res.data?.packs ?? res.data ?? []))
      .catch(() => setPacks([]))
      .finally(() => setLoading(false));
  }, []);

  function updateLocal(id, patch) {
    setPacks((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function addPack() {
    setPacks((prev) => [...prev, { id: `new_${Date.now()}`, credits: 100, price: 9.99, popular: false, isNew: true }]);
  }

  async function handleSave(pack) {
    setSavingId(pack.id);
    try {
      if (pack.isNew) {
        const res = await api.post('/pricing/packs', pack);
        const saved = res.data?.pack ?? pack;
        setPacks((prev) => prev.map((p) => (p.id === pack.id ? { ...saved, isNew: false } : p)));
      } else {
        await api.patch(`/pricing/packs/${pack.id}`, pack);
        updateLocal(pack.id, { isNew: false });
      }
    } catch {
      updateLocal(pack.id, { isNew: false }); // backend not wired yet, keep local edit applied
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/pricing/packs/${id}`);
    } catch {
      // backend not wired yet
    }
    setPacks((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="font-['Space_Grotesk'] text-xl font-medium">Pricing</h1>
        <button
          onClick={addPack}
          className="flex items-center gap-1.5 rounded-lg bg-[#7C5CFC] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#8E72FD]"
        >
          <Plus size={14} /> Add pack
        </button>
      </div>
      <p className="mb-6 text-sm text-[#9494A0]">
        Credit packs shown to users on the Wallet page. Per-tool credit cost is set on the{' '}
        <span className="text-[#F5F5F7]">Tools</span> page.
      </p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-[#15151C]" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {packs.map((pack) => (
            <div key={pack.id} className="flex items-center gap-3 rounded-xl border border-[#26262E] bg-[#15151C] p-4">
              <div className="flex-1">
                <label className="mb-1 block font-['JetBrains_Mono'] text-[10px] uppercase tracking-wide text-[#6B6B76]">Credits</label>
                <input
                  type="number" value={pack.credits}
                  onChange={(e) => updateLocal(pack.id, { credits: Number(e.target.value) })}
                  className="w-full rounded-md border border-[#26262E] bg-[#0B0B0F] px-2.5 py-1.5 text-sm outline-none focus:border-[#7C5CFC]"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block font-['JetBrains_Mono'] text-[10px] uppercase tracking-wide text-[#6B6B76]">Price (USD)</label>
                <input
                  type="number" step="0.01" value={pack.price}
                  onChange={(e) => updateLocal(pack.id, { price: Number(e.target.value) })}
                  className="w-full rounded-md border border-[#26262E] bg-[#0B0B0F] px-2.5 py-1.5 text-sm outline-none focus:border-[#7C5CFC]"
                />
              </div>
              <label className="flex items-center gap-1.5 self-end pb-2 text-xs text-[#9494A0]">
                <input
                  type="checkbox" checked={!!pack.popular}
                  onChange={(e) => updateLocal(pack.id, { popular: e.target.checked })}
                  className="accent-[#7C5CFC]"
                />
                Popular
              </label>
              <button
                onClick={() => handleSave(pack)}
                disabled={savingId === pack.id}
                className="self-end rounded-md border border-[#26262E] p-1.5 hover:border-[#7C5CFC]/50 disabled:opacity-50"
              >
                <Save size={14} className={savingId === pack.id ? 'animate-pulse text-[#7C5CFC]' : ''} />
              </button>
              <button
                onClick={() => handleDelete(pack.id)}
                className="self-end rounded-md border border-[#26262E] p-1.5 text-[#9494A0] hover:border-[#f08a96]/50 hover:text-[#f08a96]"
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
