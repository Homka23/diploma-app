import { ErrorBanner } from '../components/ErrorView';
import { API_BASE } from '../config.js';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ current: '', next: '', confirm: '' });
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.next !== form.confirm) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/auth/password`, {
        method:  'PUT',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error); return; }

      setSuccess(true);
      setForm({ current: '', next: '', confirm: '' });
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-primary/25 bg-white px-4 py-2.5 text-sm text-dark placeholder:text-primary/40 transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

  return (
    <div className="flex h-screen items-center justify-center overflow-hidden bg-surface px-6">
      <div className="w-full max-w-sm animate-fade-slide-up">

        {/* Back */}
        <button
          onClick={() => navigate('/home')}
          className="mb-8 flex items-center gap-1.5 text-sm text-primary/60 transition-colors hover:text-primary"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Home
        </button>

        <h1 className="mb-1 text-2xl font-bold text-primary">Change Password</h1>
        <p className="mb-8 text-sm text-primary/50">Choose a strong password you haven't used before</p>

        {success ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-5 py-4 text-center">
            <p className="font-medium text-primary">Password updated successfully</p>
            <button
              onClick={() => navigate('/home')}
              className="mt-4 text-sm text-primary/60 underline underline-offset-2 transition-colors hover:text-primary"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              placeholder="Current password"
              value={form.current}
              onChange={set('current')}
              required
              className={inputClass}
            />
            <input
              type="password"
              placeholder="New password"
              value={form.next}
              onChange={set('next')}
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
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
