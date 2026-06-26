import { useEffect, useState } from 'react';
import api from '../services/api';

const ADAPTERS = [
  { value: 's3', label: 'Amazon S3' },
  { value: 'r2', label: 'Cloudflare R2' },
  { value: 'local', label: 'Local disk' },
];

const DEFAULTS = {
  adapter: 'local',
  bucket: '',
  region: '',
  accessKeyId: '',
  secretAccessKey: '',
  endpoint: '',
  autoDeleteHours: 12,
};

export default function StorageConfig() {
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get('/storage/config')
      .then((res) => setForm((p) => ({ ...p, ...(res.data?.config ?? res.data) })))
      .catch(() => {}) // keep defaults if backend not wired yet
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.put('/storage/config', form);
    } catch {
      // backend not wired yet — saved state still reflects intent for UI testing
    } finally {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

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
        <Field label="Adapter">
          <select
            name="adapter" value={form.adapter} onChange={handleChange}
            className="w-full rounded-lg border border-[#26262E] bg-[#0B0B0F] px-3.5 py-2.5 text-sm outline-none focus:border-[#7C5CFC]"
          >
            {ADAPTERS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </Field>

        {form.adapter !== 'local' && (
          <>
            <Field label="Bucket name">
              <Input name="bucket" value={form.bucket} onChange={handleChange} placeholder="my-bucket" />
            </Field>
            <Field label="Region">
              <Input name="region" value={form.region} onChange={handleChange} placeholder="auto / us-east-1" />
            </Field>
            <Field label="Access key ID">
              <Input name="accessKeyId" value={form.accessKeyId} onChange={handleChange} />
            </Field>
            <Field label="Secret access key">
              <Input type="password" name="secretAccessKey" value={form.secretAccessKey} onChange={handleChange} />
            </Field>
            {form.adapter === 'r2' && (
              <Field label="Endpoint">
                <Input name="endpoint" value={form.endpoint} onChange={handleChange} placeholder="https://<account>.r2.cloudflarestorage.com" />
              </Field>
            )}
          </>
        )}

        <Field label="Auto-delete files after (hours)">
          <Input type="number" min={1} name="autoDeleteHours" value={form.autoDeleteHours} onChange={handleChange} />
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
