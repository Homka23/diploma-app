import { API_BASE } from '../config.js';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import AuthImage from '../components/AuthImage';
import GoogleAuthButton from '../components/GoogleAuthButton';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user',  JSON.stringify(data.user));
      navigate('/home');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess({ credential }) {
    try {
      const res  = await fetch(`${API_BASE}/api/auth/google`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user',  JSON.stringify(data.user));
      navigate('/home');
    } catch {
      setError('Connection error. Please try again.');
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">

      {/* ── Form side (left) ── */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-6 sm:px-10 sm:py-10">
        <div className="w-full max-w-sm animate-fade-slide-up">

          <h1 className="mb-1 text-center text-2xl font-bold text-primary sm:text-3xl">
            Welcome Back!
          </h1>
          <p className="mb-6 text-center text-sm text-primary/50 sm:mb-8">
            Sign in to continue your learning journey
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-primary/25 bg-white px-4 py-2 text-sm text-dark placeholder:text-primary/40 transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 sm:py-2.5"
            />

            <div className="space-y-1">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-primary/25 bg-white px-4 py-2 text-sm text-dark placeholder:text-primary/40 transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 sm:py-2.5"
              />
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-primary/60 transition-colors hover:text-primary">
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Login'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 sm:my-5">
            <div className="h-px flex-1 bg-primary/15" />
            <span className="text-xs text-primary/40">or</span>
            <div className="h-px flex-1 bg-primary/15" />
          </div>

          <GoogleAuthButton
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google login failed')}
          />

          <p className="mt-4 text-center text-sm text-primary/50 sm:mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary transition-colors hover:text-primary-hover">
              Sign Up
            </Link>
          </p>

        </div>
      </div>

      {/* ── Image side (right) — hidden on mobile ── */}
      <div className="hidden lg:block lg:flex-1">
        <AuthImage />
      </div>

    </div>
  );
}
