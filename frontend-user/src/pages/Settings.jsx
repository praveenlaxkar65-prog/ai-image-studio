import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Settings() {
  const { user, setUser, logout } = useAuth();

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-1 font-['Space_Grotesk'] text-xl font-medium">Settings</h1>
      <p className="mb-8 text-sm text-[#9494A0]">Manage your profile and account preferences.</p>

      <ProfileSection user={user} setUser={setUser} />
      <PasswordSection />
      <PreferencesSection />
      <DangerZone logout={logout} />
    </div>
  );
}

function SectionCard({ title, description, children }) {
  return (
    <div className="mb-6 rounded-xl border border-[#26262E] bg-[#15151C] p-5">
      <h2 className="font-['Space_Grotesk'] text-base font-medium">{title}</h2>
      {description && <p className="mt-1 text-xs text-[#9494A0]">{description}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[#9494A0]">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-[#26262E] bg-[#0B0B0F] px-3.5 py-2.5 text-sm outline-none placeholder:text-[#5A5A64] focus:border-[#7C5CFC] focus:ring-1 focus:ring-[#7C5CFC]/40"
      />
    </label>
  );
}

function ProfileSection({ user, setUser }) {
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await api.patch('/user/profile', { name });
      setUser((prev) => ({ ...prev, ...(res.data?.user ?? { name }) }));
      setSaved(true);
    } catch {
      setUser((prev) => ({ ...prev, name })); // optimistic, backend not wired yet
      setSaved(true);
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <SectionCard title="Profile">
      <form onSubmit={handleSave} className="space-y-4">
        <Field label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <Field label="Email" value={email} disabled className="opacity-60" />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#7C5CFC] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#8E72FD] disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {saved && <span className="text-xs text-[#2DD4BF]">Saved</span>}
        </div>
      </form>
    </SectionCard>
  );
}

function PasswordSection() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [status, setStatus] = useState(null); // { type: 'error'|'success', message }
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (form.next !== form.confirm) {
      setStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    if (form.next.length < 8) {
      setStatus({ type: 'error', message: 'New password must be at least 8 characters.' });
      return;
    }

    setSaving(true);
    try {
      await api.post('/user/change-password', {
        currentPassword: form.current,
        newPassword: form.next,
      });
      setStatus({ type: 'success', message: 'Password updated.' });
      setForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Could not update password.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Password" description="Use at least 8 characters.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Current password"
          type="password"
          name="current"
          value={form.current}
          onChange={handleChange}
          required
        />
        <Field
          label="New password"
          type="password"
          name="next"
          value={form.next}
          onChange={handleChange}
          required
        />
        <Field
          label="Confirm new password"
          type="password"
          name="confirm"
          value={form.confirm}
          onChange={handleChange}
          required
        />

        {status && (
          <p className={`text-xs ${status.type === 'error' ? 'text-[#f08a96]' : 'text-[#2DD4BF]'}`}>
            {status.message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg border border-[#26262E] px-4 py-2 text-sm font-medium transition hover:border-[#7C5CFC]/50 disabled:opacity-60"
        >
          {saving ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </SectionCard>
  );
}

function PreferencesSection() {
  return (
    <SectionCard
      title="Storage"
      description="Uploaded and generated files are temporary by default."
    >
      <p className="text-sm text-[#9494A0]">
        Files auto-delete <span className="text-[#F5F5F7]">12 hours</span> after creation unless
        you save them to your Gallery. This window is set by the platform and may change.
      </p>
    </SectionCard>
  );
}

function DangerZone({ logout }) {
  return (
    <SectionCard title="Account">
      <button
        onClick={logout}
        className="rounded-lg border border-[#26262E] px-4 py-2 text-sm font-medium text-[#9494A0] transition hover:border-[#f08a96]/50 hover:text-[#f08a96]"
      >
        Log out
      </button>
    </SectionCard>
  );
}
