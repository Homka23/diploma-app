import { API_BASE } from '../config.js';


import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function initials(user) {
  const name = user?.display_name || user?.username || user?.email || '?';
  return name.slice(0, 2).toUpperCase();
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function ChevronIcon({ open, className = '' }) {
  return (
    <svg
      className={`transition-transform duration-300 ${open ? 'rotate-180' : ''} ${className}`}
      viewBox="0 0 20 20" fill="currentColor"
    >
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/12 bg-white px-5 py-4">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-3xl font-black leading-none text-primary">{done}</span>
          <span className="ml-1.5 text-sm font-medium text-primary/30">/ {total}</span>
        </div>
        <span className="rounded-lg bg-accent/40 px-2 py-0.5 text-xs font-bold text-primary">
          {pct}%
        </span>
      </div>
      <div>
        <div className="h-1.5 overflow-hidden rounded-full bg-accent/30">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs font-medium text-primary/50">{label}</p>
      </div>
    </div>
  );
}

// ── Lesson card ───────────────────────────────────────────────────────────────
function LessonCard({ lesson, index }) {
  const tabs = [
    { key: 'theory',        label: 'Theory',        done: lesson.theory        },
    { key: 'test',          label: 'Test',          done: lesson.test          },
    { key: 'transcription', label: 'Transcription', done: lesson.transcription },
  ];
  const doneCount = tabs.filter(t => t.done).length;
  const allDone   = doneCount === 3;

  return (
    <div className={`flex flex-col gap-3 rounded-xl border p-4 transition-all duration-200 hover:-translate-y-px hover:shadow-md hover:shadow-primary/8 ${
      allDone
        ? 'border-accent bg-accent/15'
        : 'border-primary/10 bg-white hover:border-primary/20'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-widest text-primary/25">
          {String(index + 1).padStart(2, '0')}
        </span>
        {allDone && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
            Completed
          </span>
        )}
      </div>

      <Link
        to={`/lesson/${lesson.id}`}
        className={`text-sm font-semibold leading-snug hover:underline ${allDone ? 'text-primary/40' : 'text-primary'}`}
      >
        {lesson.title}
      </Link>

      <div className="space-y-1.5">
        {tabs.map(tab => (
          <Link
            key={tab.key}
            to={`/lesson/${lesson.id}?tab=${tab.key}`}
            className="flex items-center gap-2 rounded-lg transition-colors hover:bg-primary/5 -mx-1 px-1 py-0.5"
          >
            <div className={`h-4 w-4 flex-shrink-0 rounded-full border-2 transition-colors ${
              tab.done ? 'border-primary bg-primary' : 'border-primary/20 bg-transparent'
            }`}>
              {tab.done && (
                <svg className="h-full w-full p-0.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2,6 5,9 10,3" />
                </svg>
              )}
            </div>
            <span className={`text-xs ${tab.done ? 'font-medium text-primary' : 'text-primary/35'}`}>
              {tab.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Topic card ────────────────────────────────────────────────────────────────
function TopicCard({ topic, index }) {
  const [open, setOpen] = useState(false);
  const completedCount  = topic.lessons.filter(l => l.theory && l.test && l.transcription).length;

  return (
    <div className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
      topic.locked
        ? 'border-primary/8 bg-white opacity-50'
        : open
          ? 'border-primary shadow-lg shadow-primary/10'
          : 'border-primary/12 bg-white hover:border-primary/30 hover:shadow-sm hover:shadow-primary/5'
    }`}>
      <button
        onClick={() => !topic.locked && setOpen(o => !o)}
        disabled={topic.locked}
        className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors disabled:cursor-not-allowed ${
          open ? 'bg-primary hover:bg-primary-hover' : 'bg-white hover:bg-primary/3'
        }`}
      >
        {/* Number */}
        <span className={`w-8 flex-shrink-0 text-sm font-black transition-colors ${
          open ? 'text-accent' : 'text-primary/40'
        }`}>
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Title + description */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`font-semibold transition-colors ${open ? 'text-white' : 'text-primary'}`}>
              {topic.title}
            </p>
            {topic.locked && (
              <span className="text-primary/30"><LockIcon /></span>
            )}
          </div>
          <p className={`mt-0.5 truncate text-xs transition-colors ${open ? 'text-white/50' : 'text-primary/40'}`}>
            {topic.description}
          </p>

          {/* Mobile progress */}
          <div className="mt-2 flex items-center gap-2 sm:hidden">
            <div className={`h-1 flex-1 overflow-hidden rounded-full ${open ? 'bg-white/20' : 'bg-accent/30'}`}>
              <div
                className={`h-full rounded-full transition-all duration-700 ${open ? 'bg-accent' : 'bg-primary'}`}
                style={{ width: `${topic.progress}%` }}
              />
            </div>
            <span className={`text-[10px] ${open ? 'text-white/50' : 'text-primary/40'}`}>
              {completedCount}/{topic.lessons.length}
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-shrink-0 items-center gap-4">
          <div className="hidden flex-col items-end gap-1.5 sm:flex">
            <div className={`h-1.5 w-28 overflow-hidden rounded-full ${open ? 'bg-white/20' : 'bg-accent/30'}`}>
              <div
                className={`h-full rounded-full transition-all duration-700 ${open ? 'bg-accent' : 'bg-primary'}`}
                style={{ width: `${topic.progress}%` }}
              />
            </div>
            <span className={`text-[10px] ${open ? 'text-white/50' : 'text-primary/40'}`}>
              {completedCount} / {topic.lessons.length} lessons
            </span>
          </div>
          <span className={`w-10 text-right text-sm font-bold ${open ? 'text-accent' : 'text-primary'}`}>
            {topic.progress}%
          </span>
          {!topic.locked && (
            <ChevronIcon open={open} className={`h-4 w-4 ${open ? 'text-white/60' : 'text-primary/30'}`} />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-primary/20 bg-surface px-5 py-4">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {topic.lessons.map((lesson, i) => (
              <LessonCard key={lesson.id} lesson={lesson} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const [user, setUser]           = useState(null);
  const [profileOpen, setProfile] = useState(false);
  const [topics, setTopics]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/login'); return; }
    setUser(JSON.parse(stored));

    const token = localStorage.getItem('token');

    fetch(`${API_BASE}/api/auth/ping`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.streakDays != null) setStreakDays(d.streakDays); })
      .catch(() => {});

    fetch(`${API_BASE}/api/topics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.status === 401) { navigate('/login'); return null; }
        return res.json();
      })
      .then(data => { if (data) setTopics(data); })
      .finally(() => setLoading(false));
  }, [navigate]);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  const totalLessons     = topics.reduce((s, t) => s + t.lessons.length, 0);
  const completedLessons = topics.reduce((s, t) => s + t.lessons.filter(l => l.theory && l.test && l.transcription).length, 0);
  const completedTopics  = topics.filter(t => t.lessons.length > 0 && t.lessons.every(l => l.theory && l.test && l.transcription)).length;
  const totalTabs        = totalLessons * 3;
  const completedTabs    = topics.reduce((s, t) => s + t.lessons.reduce((ls, l) =>
    ls + [l.theory, l.test, l.transcription].filter(Boolean).length, 0), 0);

  if (!user) return null;

  const displayName = user.display_name || user.username || user.email?.split('@')[0] || 'there';

  // Find the next lesson/tab to continue
  const TABS_ORDER = ['theory', 'test', 'transcription'];
  let continueLesson = null;
  let continueTab    = 'theory';
  outer: for (const topic of topics) {
    if (topic.locked) continue;
    for (const lesson of topic.lessons) {
      for (const t of TABS_ORDER) {
        if (!lesson[t]) {
          continueLesson = lesson;
          continueTab    = t;
          break outer;
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-surface">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-primary/10 bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-dark">Music Theory</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setProfile(o => !o)}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-primary/8"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {initials(user)}
              </div>
              <span className="hidden text-sm font-medium text-dark sm:block">
                {user.display_name || user.username || user.email}
              </span>
              <ChevronIcon open={profileOpen} className="h-3.5 w-3.5 text-primary/40" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-primary/12 bg-white shadow-lg shadow-primary/8">
                <Link
                  to="/profile"
                  className="block px-4 py-2.5 text-sm text-primary/70 transition-colors hover:bg-surface hover:text-primary"
                >
                  Profile
                </Link>
                <div className="mx-3 h-px bg-primary/8" />
                <button
                  onClick={logout}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl animate-fade-slide-up px-6 py-10">

        {/* ── Page title ── */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-primary/40">Dashboard</p>
            <h1 className="mt-1 text-2xl font-bold text-primary">{displayName}</h1>
          </div>
          {/* ── Streak ── */}
          <div className="flex flex-col gap-2 rounded-2xl border border-primary/12 bg-white px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className="text-lg leading-none">🔥</span>
              <span className="text-sm font-black text-primary">{streakDays} day streak</span>
            </div>
            <div className="flex gap-1.5">
              {(() => {
                const today    = new Date();
                const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
                return Array.from({ length: 7 }, (_, i) => {
                  const d       = new Date(today);
                  d.setDate(today.getDate() - 6 + i);
                  const isPast  = i < 7 - streakDays;
                  const isToday = i === 6;
                  const dow     = (d.getDay() + 6) % 7;
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors ${
                        isPast
                          ? 'bg-accent/20 text-primary/20'
                          : isToday
                            ? 'bg-primary text-white ring-2 ring-accent'
                            : 'bg-accent text-primary'
                      }`}>
                        {isPast ? '' : '✓'}
                      </div>
                      <span className={`text-[9px] font-medium ${isToday ? 'text-primary' : 'text-primary/30'}`}>
                        {dayNames[dow]}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* ── Continue ── */}
        {continueLesson && (
          <Link
            to={`/lesson/${continueLesson.id}?tab=${continueTab}`}
            className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-primary px-5 py-4 shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Continue where you left off</p>
              <p className="mt-0.5 truncate font-semibold text-white">{continueLesson.title}</p>
              <p className="mt-0.5 text-xs font-medium capitalize text-white/60">{continueTab}</p>
            </div>
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </Link>
        )}

        {/* ── Overall progress ── */}
        <div className="mb-4 flex items-center gap-4">
          <div className="flex-1 overflow-hidden rounded-full bg-accent/30" style={{ height: 8 }}>
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${totalTabs > 0 ? Math.round((completedTabs / totalTabs) * 100) : 0}%` }}
            />
          </div>
          <span className="flex-shrink-0 text-sm font-black text-primary">
            {totalTabs > 0 ? Math.round((completedTabs / totalTabs) * 100) : 0}%
          </span>
        </div>

        {/* ── Stats ── */}
        <div className="mb-8 grid grid-cols-3 gap-3">
          <StatCard label="Topics"  done={completedTopics}  total={topics.length} />
          <StatCard label="Lessons" done={completedLessons} total={totalLessons}  />
          <StatCard label="Tabs"    done={completedTabs}    total={totalTabs}     />
        </div>

        {/* ── Topics ── */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-primary">Topics</p>
          <p className="text-xs text-primary/40">
            {topics.filter(t => !t.locked).length} / {topics.length} unlocked
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-primary/30">Loading…</div>
        ) : (
          <div className="space-y-2">
            {topics.map((topic, i) => (
              <TopicCard key={topic.id} topic={topic} index={i} />
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
