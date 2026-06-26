import React from 'react';
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from './AuthLayout';

export default function Login() {
  const { login, authError, setAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setAuthError(null);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(form);
    setSubmitting(false);
    if (result.success) navigate(redirectTo, { replace: true });
  };

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Pick up your edits right where you left them."
      subtitle="Crop, upscale, remove backgrounds, or describe the change you want in Prompt Studio — your projects and credits are waiting."
      footer={
        <>
          New to ai-image-studio?{' '}
          <Link to="/signup" className="font-medium text-[#7C5CFC] hover:text-[#9580FD]">
            Create an account
          </Link>
        </>
      }
    >
      <h2 className="mb-1 font-['Space_Grotesk'] text-2xl font-medium tracking-tight">
        Log in
      </h2>
      <p className="mb-7 text-sm text-[#9494A0]">Enter your details to access your studio.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          required
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          placeholder="••••••••"
          required
        />

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className="text-xs text-[#9494A0] hover:text-[#F5F5F7]"
          >
            Forgot password?
          </Link>
        </div>

        {authError && (
          <p className="rounded-lg border border-[#3a1f24] bg-[#1c1216] px-3 py-2 text-sm text-[#f08a96]">
            {authError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-[#7C5CFC] py-2.5 text-sm font-medium text-white transition hover:bg-[#8E72FD] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  );
}

function Field({ label, name, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[#9494A0]">{label}</span>
      <input
        name={name}
        {...props}
        className="w-full rounded-lg border border-[#26262E] bg-[#15151C] px-3.5 py-2.5 text-sm text-[#F5F5F7] outline-none transition placeholder:text-[#5A5A64] focus:border-[#7C5CFC] focus:ring-1 focus:ring-[#7C5CFC]/40"
      />
    </label>
  );
}
