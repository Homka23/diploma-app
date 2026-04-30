import { API_BASE } from '../config.js';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthImage from '../components/AuthImage';
import GoogleAuthButton from '../components/GoogleAuthButton';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError]     = useState('');
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
      const res  = await fetch(`${API_BASE}/api/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username: form.username, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      const loginRes  = await fetch(`${API_BASE}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: form.email, password: form.password }),
      });
      const loginData = await loginRes.json();
      localStorage.setItem('token', loginData.token);
      localStorage.setItem('user',  JSON.stringify(loginData.user));
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

          <h1 className="mb-1 text-center text-2xl font-bold text-primary sm:text-3xl">
            Create Your Account
          </h1>
          <p className="mb-5 text-center text-sm text-primary/50 sm:mb-7">
            Start your music theory journey today
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="text"     placeholder="Username"         value={form.username} onChange={set('username')} required className={inputClass} />
            <input type="email"    placeholder="Email"            value={form.email}    onChange={set('email')}    required className={inputClass} />
            <input type="password" placeholder="Password"         value={form.password} onChange={set('password')} required className={inputClass} />
            <input type="password" placeholder="Confirm Password" value={form.confirm}  onChange={set('confirm')}  required className={inputClass} />

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Sign Up'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-primary/15" />
            <span className="text-xs text-primary/40">or</span>
            <div className="h-px flex-1 bg-primary/15" />
          </div>

          <GoogleAuthButton
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google login failed')}
          />

          <p className="mt-4 text-center text-sm text-primary/50">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary transition-colors hover:text-primary-hover">
              Login
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
}
