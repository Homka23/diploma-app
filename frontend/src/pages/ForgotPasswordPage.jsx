import { ErrorBanner } from '../components/ErrorView';
import { API_BASE } from '../config.js';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthImage from '../components/AuthImage';

export default function ForgotPasswordPage() {
  const [form, setForm]       = useState({ email: '', password: '', confirm: '' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: form.email, newPassword: form.password }),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error); return; }

      setSuccess(true);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-primary/25 bg-white px-4 py-2 text-sm text-dark placeholder:text-primary/40 transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 sm:py-2.5";

  return (
    <div className="flex h-screen overflow-hidden bg-surface">

      {/* ── Image side (left) — hidden on mobile ── */}
      <div className="hidden lg:block lg:flex-1">
        <AuthImage />
      </div>

      {/* ── Form side (right) ── */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-6 sm:px-10 sm:py-10">
        <div className="w-full max-w-sm animate-fade-slide-up">

          {success ? (
            <>
              <h1 className="mb-1 text-center text-2xl font-bold text-primary sm:text-3xl">
                Password Updated
              </h1>
              <p className="mb-8 text-center text-sm text-primary/50">
                Your password has been changed successfully
              </p>
              <Link
                to="/login"
                className="block w-full rounded-lg bg-primary py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Back to Login
              </Link>
            </>
          ) : (
            <>
              <h1 className="mb-1 text-center text-2xl font-bold text-primary sm:text-3xl">
                Reset Password
              </h1>
              <p className="mb-6 text-center text-sm text-primary/50 sm:mb-8">
                Enter your email and choose a new password
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={set('email')}
                  required
                  className={inputClass}
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={form.password}
                  onChange={set('password')}
                  required
                  minLength={8}
                  className={inputClass}
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={form.confirm}
                  onChange={set('confirm')}
                  required
                  className={inputClass}
                />

                {error && <ErrorBanner message={error} />}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                >
                  {loading ? 'Updating…' : 'Reset Password'}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-primary/50 sm:mt-6">
                Remember your password?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-primary transition-colors hover:text-primary-hover"
                >
                  Login
                </Link>
              </p>
            </>
          )}

        </div>
      </div>

    </div>
  );
}
