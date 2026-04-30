import { API_BASE } from '../config.js';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function initials(user) {
  const name = user?.display_name || user?.username || user?.email || '?';
  return name.slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const navigate = useNavigate();

  const [user, setUser]         = useState(null);
  const [topics, setTopics]     = useState([]);
  const [editing, setEditing]   = useState(false);
  const [nameVal, setNameVal]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [saveErr, setSaveErr]   = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (r.status === 401) { navigate('/login'); return null; } return r.json(); })
      .then(d => { if (d?.user) { setUser(d.user); setNameVal(d.user.display_name || ''); } })
      .catch(() => {});

    fetch(`${API_BASE}/api/topics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setTopics(d); })
      .catch(() => {});
  }, [navigate]);

  async function saveName() {
    if (!nameVal.trim()) return;
    setSaving(true); setSaveErr('');
    try {
      const res  = await fetch(`${API_BASE}/api/auth/me`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ display_name: nameVal.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setSaveErr(data.error); return; }
      setUser(u => ({ ...u, display_name: data.user.display_name }));
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, display_name: data.user.display_name }));
      setEditing(false);
    } catch { setSaveErr('Connection error'); }
    finally   { setSaving(false); }
  }

  if (!user) return null;

  const totalLessons     = topics.reduce((s, t) => s + t.lessons.length, 0);
  const completedLessons = topics.reduce((s, t) => s + t.lessons.filter(l => l.theory && l.test && l.transcription).length, 0);
  const completedTopics  = topics.filter(t => t.lessons.length > 0 && t.lessons.every(l => l.theory && l.test && l.transcription)).length;
  const totalTabs        = totalLessons * 3;
  const completedTabs    = topics.reduce((s, t) => s + t.lessons.reduce((ls, l) =>
    ls + [l.theory, l.test, l.transcription].filter(Boolean).length, 0), 0);
  const overallPct       = totalTabs > 0 ? Math.round((completedTabs / totalTabs) * 100) : 0;

  const streakDays = user.streak_days ?? 0;
  const dayNames   = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const today      = new Date();
  const joinedDate = new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-surface">

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-primary/10 bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-3.5">
          <button
            onClick={() => navigate('/home')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-primary/50 transition-colors hover:bg-primary/8 hover:text-primary"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-primary">Profile</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl animate-fade-slide-up px-6 py-8 space-y-4">

        {/* Avatar + name */}
        <div className="flex items-center gap-5 rounded-2xl border border-primary/12 bg-white px-6 py-5">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xl font-black text-white">
            {initials(user)}
          </div>
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameVal}
                  onChange={e => setNameVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditing(false); }}
                  className="flex-1 rounded-lg border border-primary/25 px-3 py-1.5 text-sm text-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                />
                <button
                  onClick={saveName}
                  disabled={saving}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                >
                  {saving ? '…' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditing(false); setSaveErr(''); }}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary/50 transition-colors hover:bg-primary/8"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="truncate font-bold text-primary">
                  {user.display_name || user.username || user.email}
                </p>
                <button
                  onClick={() => setEditing(true)}
                  className="flex-shrink-0 text-primary/30 transition-colors hover:text-primary"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              </div>
            )}
            {saveErr && <p className="mt-1 text-xs text-red-500">{saveErr}</p>}
            <p className="mt-0.5 text-xs text-primary/40">{user.email}</p>
            {user.username && <p className="text-xs text-primary/30">@{user.username}</p>}
            <p className="mt-1 text-[10px] text-primary/25">Joined {joinedDate}</p>
          </div>
        </div>

        {/* Streak */}
        <div className="rounded-2xl border border-primary/12 bg-white px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <span className="font-bold text-primary">{streakDays} day streak</span>
          </div>
          <div className="flex justify-between">
            {Array.from({ length: 7 }, (_, i) => {
              const d      = new Date(today);
              d.setDate(today.getDate() - 6 + i);
              const isPast  = i < 7 - streakDays;
              const isToday = i === 6;
              const dow     = (d.getDay() + 6) % 7;
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isPast
                      ? 'bg-accent/20 text-primary/20'
                      : isToday
                        ? 'bg-primary text-white ring-2 ring-accent'
                        : 'bg-accent text-primary'
                  }`}>
                    {isPast ? '' : '✓'}
                  </div>
                  <span className={`text-[10px] font-medium ${isToday ? 'text-primary' : 'text-primary/30'}`}>
                    {dayNames[dow]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress stats */}
        <div className="rounded-2xl border border-primary/12 bg-white px-5 py-4">
          <p className="mb-3 text-xs font-semibold text-primary/40 uppercase tracking-wider">Progress</p>

          <div className="mb-4 flex items-center gap-3">
            <div className="flex-1 overflow-hidden rounded-full bg-accent/30" style={{ height: 8 }}>
              <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${overallPct}%` }} />
            </div>
            <span className="flex-shrink-0 text-sm font-black text-primary">{overallPct}%</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Topics',  done: completedTopics,  total: topics.length },
              { label: 'Lessons', done: completedLessons, total: totalLessons  },
              { label: 'Tabs',    done: completedTabs,    total: totalTabs     },
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-surface px-3 py-2.5 text-center">
                <p className="text-xl font-black text-primary">{s.done}</p>
                <p className="text-[10px] text-primary/30">/ {s.total} {s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Account actions */}
        <div className="rounded-2xl border border-primary/12 bg-white overflow-hidden">
          <p className="px-5 pt-4 pb-2 text-xs font-semibold text-primary/40 uppercase tracking-wider">Account</p>
          <Link
            to="/change-password"
            className="flex items-center justify-between px-5 py-3.5 text-sm text-primary/70 transition-colors hover:bg-surface hover:text-primary"
          >
            <span>Change Password</span>
            <svg className="h-4 w-4 text-primary/25" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
          <div className="mx-5 h-px bg-primary/6" />
          <button
            onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }}
            className="flex w-full items-center justify-between px-5 py-3.5 text-sm text-red-400 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <span>Log out</span>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

      </main>
    </div>
  );
}
