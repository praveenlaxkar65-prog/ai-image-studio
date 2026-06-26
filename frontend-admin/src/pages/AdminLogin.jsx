import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminLogin() {
  const { login, authError, setAuthError } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setAuthError(null);
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(form);
    setSubmitting(false);
    if (result.success) navigate(redirectTo, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0B0F] px-6 text-[#F5F5F7]">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <ApertureMark />
          <div>
            <p className="font-['Space_Grotesk'] text-base font-medium leading-tight">
              ai-image-studio
            </p>
            <p className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.15em] text-[#7C5CFC]">
              Admin
            </p>
          </div>
        </div>

        <h1 className="mb-1 font-['Space_Grotesk'] text-xl font-medium">Admin sign in</h1>
        <p className="mb-7 text-sm text-[#9494A0]">Restricted access. Use your admin credentials.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            required
          />

          {authError && (
            <p className="rounded-lg border border-[#3a1f24] bg-[#1c1216] px-3 py-2 text-sm text-[#f08a96]">
              {authError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#7C5CFC] py-2.5 text-sm font-medium text-white transition hover:bg-[#8E72FD] disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[#9494A0]">{label}</span>
      <input
        name={name}
        {...props}
        className="w-full rounded-lg border border-[#26262E] bg-[#15151C] px-3.5 py-2.5 text-sm outline-none placeholder:text-[#5A5A64] focus:border-[#7C5CFC] focus:ring-1 focus:ring-[#7C5CFC]/40"
      />
    </label>
  );
}

function ApertureMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="15" stroke="#26262E" strokeWidth="1.5" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <line key={deg} x1="16" y1="16" x2="16" y2="4" stroke="#7C5CFC" strokeWidth="2" strokeLinecap="round" transform={`rotate(${deg} 16 16)`} />
      ))}
      <circle cx="16" cy="16" r="3" fill="#2DD4BF" />
    </svg>
  );
}
