import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from './AuthLayout';

export default function Signup() {
  const { signup, authError, setAuthError } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleChange = (e) => {
    setAuthError(null);
    setLocalError(null);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirm) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    const result = await signup({
      name: form.name,
      email: form.email,
      password: form.password,
    });
    setSubmitting(false);
    if (result.success) navigate('/dashboard', { replace: true });
  };

  const errorMessage = localError || authError;

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Twenty-three tools. One prompt away."
      subtitle="Sign up to get free starter credits, then crop, upscale, restore, or generate images — or just describe the edit in Prompt Studio."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[#7C5CFC] hover:text-[#9580FD]">
            Log in
          </Link>
        </>
      }
    >
      <h2 className="mb-1 font-['Space_Grotesk'] text-2xl font-medium tracking-tight">
        Create your account
      </h2>
      <p className="mb-7 text-sm text-[#9494A0]">No credit card needed to start.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Full name"
          name="name"
          type="text"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Jordan Lee"
          required
        />
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
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          placeholder="At least 8 characters"
          required
        />
        <Field
          label="Confirm password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={handleChange}
          placeholder="••••••••"
          required
        />

        {errorMessage && (
          <p className="rounded-lg border border-[#3a1f24] bg-[#1c1216] px-3 py-2 text-sm text-[#f08a96]">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-[#7C5CFC] py-2.5 text-sm font-medium text-white transition hover:bg-[#8E72FD] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-center text-[11px] leading-relaxed text-[#6B6B76]">
          By signing up you agree to the Terms of Service and Privacy Policy.
        </p>
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
