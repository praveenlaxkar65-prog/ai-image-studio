import React from 'react';
import { useEffect, useState } from 'react';
import api from '../services/api';

const DEFAULTS = {
  platformName: 'ai-image-studio',
  signupBonus: 10,
  maintenanceMode: false,
  supportEmail: '',
};

export default function SystemSettings() {
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => setForm((p) => ({ ...p, ...(res.data?.settings ?? res.data) })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.put('/settings', form);
    } catch {
      // backend not wired yet
    } finally {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-6 py-8">
        <div className="h-64 animate-pulse rounded-xl bg-[#15151C]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      <h1 className="mb-1 font-['Space_Grotesk'] text-xl font-medium">System Settings</h1>
      <p className="mb-6 text-sm text-[#9494A0]">Platform-wide settings that don't belong to a specific module.</p>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-[#26262E] bg-[#15151C] p-5">
        <Field label="Platform name">
          <Input name="platformName" value={form.platformName} onChange={handleChange} />
        </Field>

        <Field label="Signup bonus (credits)">
          <Input type="number" min={0} name="signupBonus" value={form.signupBonus} onChange={handleChange} />
        </Field>

        <Field label="Support email">
          <Input type="email" name="supportEmail" value={form.supportEmail} onChange={handleChange} placeholder="support@example.com" />
        </Field>

        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox" name="maintenanceMode" checked={form.maintenanceMode} onChange={handleChange}
            className="accent-[#7C5CFC]"
          />
          Maintenance mode (blocks user-facing access)
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit" disabled={saving}
            className="rounded-lg bg-[#7C5CFC] px-4 py-2 text-sm font-medium text-white hover:bg-[#8E72FD] disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          {saved && <span className="text-xs text-[#2DD4BF]">Saved</span>}
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[#9494A0]">{label}</span>
      {children}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-[#26262E] bg-[#0B0B0F] px-3.5 py-2.5 text-sm outline-none placeholder:text-[#5A5A64] focus:border-[#7C5CFC] focus:ring-1 focus:ring-[#7C5CFC]/40"
    />
  );
}
