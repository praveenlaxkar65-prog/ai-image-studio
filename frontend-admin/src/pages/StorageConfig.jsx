import React from 'react';
import { useEffect, useState } from 'react';
import api from '../services/api';

const PROVIDERS = [
  { value: 's3', label: 'Amazon S3' },
  { value: 'r2', label: 'Cloudflare R2' },
  { value: 'local', label: 'Local disk' },
];

export default function StorageConfig() {
  const [provider, setProvider] = useState('local');
  const [config, setConfig] = useState({ accessKey: '', secretKey: '', bucketName: '', region: '', endpoint: '' });
  const [autoDeleteHours, setAutoDeleteHours] = useState(12);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get('/storage')
      .then((res) => {
        const s = res.data?.settings ?? {};
        if (s.storage_provider) setProvider(s.storage_provider);
        if (s.storage_config) setConfig((p) => ({ ...p, ...s.storage_config }));
        if (s.auto_delete_hours !== undefined) setAutoDeleteHours(s.auto_delete_hours);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleConfigChange = (e) => setConfig((p) => ({ ...p, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/storage/provider', { provider });
      await api.put('/storage/config', config);
      await api.put('/storage/auto-delete', { hours: Number(autoDeleteHours) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not save storage settings.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="h-72 animate-pulse rounded-xl bg-[#15151C]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-1 font-['Space_Grotesk'] text-xl font-medium">Storage</h1>
      <p className="mb-6 text-sm text-[#9494A0]">
        Where uploaded and generated files are stored, and how long they're kept.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-[#26262E] bg-[#15151C] p-5">
        <Field label="Provider">
          <select
            value={provider} onChange={(e) => setProvider(e.target.value)}
            className="w-full rounded-lg border border-[#26262E] bg-[#0B0B0F] px-3.5 py-2.5 text-sm outline-none focus:border-[#7C5CFC]"
          >
            {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </Field>

        {provider !== 'local' && (
          <>
            <Field label="Bucket name">
              <Input name="bucketName" value={config.bucketName} onChange={handleConfigChange} placeholder="my-bucket" />
            </Field>
            <Field label="Region">
              <Input name="region" value={config.region} onChange={handleConfigChange} placeholder="auto / us-east-1" />
            </Field>
            <Field label="Access key">
              <Input name="accessKey" value={config.accessKey} onChange={handleConfigChange} />
            </Field>
            <Field label="Secret key">
              <Input type="password" name="secretKey" value={config.secretKey} onChange={handleConfigChange} />
            </Field>
            {provider === 'r2' && (
              <Field label="Endpoint">
                <Input name="endpoint" value={config.endpoint} onChange={handleConfigChange} placeholder="https://<account>.r2.cloudflarestorage.com" />
              </Field>
            )}
          </>
        )}

        <Field label="Auto-delete files after (hours)">
          <Input type="number" min={1} value={autoDeleteHours} onChange={(e) => setAutoDeleteHours(e.target.value)} />
        </Field>

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
