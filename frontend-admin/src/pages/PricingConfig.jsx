import React from 'react';
import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../services/api';

export default function PricingConfig() {
  const [welcomeCredits, setWelcomeCredits] = useState(0);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingWelcome, setSavingWelcome] = useState(false);
  const [savingPackages, setSavingPackages] = useState(false);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    api
      .get('/pricing')
      .then((res) => {
        const s = res.data?.settings ?? {};
        setWelcomeCredits(s.welcome_credits ?? 0);
        setPackages(Array.isArray(s.credit_packages) ? s.credit_packages : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveWelcomeCredits() {
    setSavingWelcome(true);
    try {
      await api.put('/pricing/welcome-credits', { amount: Number(welcomeCredits) });
      flashSaved('welcome');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not save.');
    } finally {
      setSavingWelcome(false);
    }
  }

  async function savePackages(next) {
    setSavingPackages(true);
    try {
      await api.put('/pricing/packages', { packages: next });
      setPackages(next);
      flashSaved('packages');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not save.');
    } finally {
      setSavingPackages(false);
    }
  }

  function flashSaved(which) {
    setSaved(which);
    setTimeout(() => setSaved(''), 2000);
  }

  function updatePackageLocal(id, patch) {
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function addPackage() {
    setPackages((prev) => [...prev, { id: `pkg_${Date.now()}`, credits: 100, price: 9.99, currency: 'USD' }]);
  }

  function removePackage(id) {
    savePackages(packages.filter((p) => p.id !== id));
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="h-64 animate-pulse rounded-xl bg-[#15151C]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-1 font-['Space_Grotesk'] text-xl font-medium">Pricing</h1>
      <p className="mb-6 text-sm text-[#9494A0]">
        Welcome credits for new signups, and the credit packs shown on the user Wallet page.
      </p>

      <div className="mb-8 rounded-xl border border-[#26262E] bg-[#15151C] p-5">
        <h2 className="mb-3 font-['Space_Grotesk'] text-sm font-medium text-[#9494A0]">Welcome credits</h2>
        <div className="flex items-center gap-3">
          <input
            type="number" min={0} value={welcomeCredits}
            onChange={(e) => setWelcomeCredits(e.target.value)}
            className="w-32 rounded-lg border border-[#26262E] bg-[#0B0B0F] px-3 py-2 text-sm outline-none focus:border-[#7C5CFC]"
          />
          <button
            onClick={saveWelcomeCredits} disabled={savingWelcome}
            className="rounded-lg bg-[#7C5CFC] px-4 py-2 text-sm font-medium text-white hover:bg-[#8E72FD] disabled:opacity-60"
          >
            {savingWelcome ? 'Saving…' : 'Save'}
          </button>
          {saved === 'welcome' && <span className="text-xs text-[#2DD4BF]">Saved</span>}
        </div>
      </div>

      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-['Space_Grotesk'] text-sm font-medium text-[#9494A0]">Credit packages</h2>
        <button
          onClick={addPackage}
          className="flex items-center gap-1.5 rounded-lg bg-[#7C5CFC] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#8E72FD]"
        >
          <Plus size={14} /> Add package
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {packages.map((pack) => (
          <div key={pack.id} className="flex items-center gap-3 rounded-xl border border-[#26262E] bg-[#15151C] p-4">
            <Field label="Credits">
              <input
                type="number" value={pack.credits}
                onChange={(e) => updatePackageLocal(pack.id, { credits: Number(e.target.value) })}
                className="w-full rounded-md border border-[#26262E] bg-[#0B0B0F] px-2.5 py-1.5 text-sm outline-none focus:border-[#7C5CFC]"
              />
            </Field>
            <Field label="Price">
              <input
                type="number" step="0.01" value={pack.price}
                onChange={(e) => updatePackageLocal(pack.id, { price: Number(e.target.value) })}
                className="w-full rounded-md border border-[#26262E] bg-[#0B0B0F] px-2.5 py-1.5 text-sm outline-none focus:border-[#7C5CFC]"
              />
            </Field>
            <Field label="Currency">
              <input
                value={pack.currency || 'USD'}
                onChange={(e) => updatePackageLocal(pack.id, { currency: e.target.value })}
                className="w-20 rounded-md border border-[#26262E] bg-[#0B0B0F] px-2.5 py-1.5 text-sm outline-none focus:border-[#7C5CFC]"
              />
            </Field>
            <button
              onClick={() => removePackage(pack.id)}
              className="self-end rounded-md border border-[#26262E] p-1.5 text-[#9494A0] hover:border-[#f08a96]/50 hover:text-[#f08a96]"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => savePackages(packages)} disabled={savingPackages}
          className="rounded-lg bg-[#7C5CFC] px-4 py-2 text-sm font-medium text-white hover:bg-[#8E72FD] disabled:opacity-60"
        >
          {savingPackages ? 'Saving…' : 'Save packages'}
        </button>
        {saved === 'packages' && <span className="text-xs text-[#2DD4BF]">Saved</span>}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex-1">
      <span className="mb-1 block font-['JetBrains_Mono'] text-[10px] uppercase tracking-wide text-[#6B6B76]">{label}</span>
      {children}
    </label>
  );
}
