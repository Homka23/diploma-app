import { API_BASE, handleBlocked } from '../config.js';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Loader from '../components/Loader';

// Анімація лічильника від 0 до target
function useCountUp(target, trigger) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    if (target === 0) { setCount(0); return; }
    const duration = 900;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, trigger]);
  return count;
}

function initials(user) {
  const name = user?.display_name || user?.username || user?.email || '?';
  return name.slice(0, 2).toUpperCase();
}
const XP_LEVELS = [0, 200, 500, 1000, 2000];
function getLevel(xp = 0) {
  let lv = 1;
  for (let i = 0; i < XP_LEVELS.length; i++) { if (xp >= XP_LEVELS[i]) lv = i + 1; }
  return lv;
}
function pct(d, t) { return t > 0 ? Math.round(d / t * 100) : 0; }
function tabsDone(l) { return [l.theory, l.test, l.transcription].filter(Boolean).length; }
function lessonDone(l) { return tabsDone(l) === 3; }

function ChevronIcon({ open, className = '' }) {
  return (
    <svg className={`transition-transform duration-300 ${open ? 'rotate-180' : ''} ${className}`}
      viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ label, done, total, trigger }) {
  const animDone = useCountUp(done, trigger);
  const p        = pct(done, total);
  const animPct  = trigger ? pct(animDone, total) : 0;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/10 bg-white px-3 py-3.5 sm:px-6 sm:py-5">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-2xl font-bold leading-none text-primary tabular-nums">{animDone}</span>
          <span className="ml-1 text-xs text-primary/30">/ {total}</span>
        </div>
        <span className="rounded-lg bg-accent/40 px-2 py-0.5 text-[10px] font-bold text-primary tabular-nums">{p}%</span>
      </div>
      <div>
        <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-accent/30">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${animPct}%`, backgroundColor: '#408A71' }} />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/40">{label}</p>
      </div>
    </div>
  );
}

// ── LessonCard ────────────────────────────────────────────────────────────────
function LessonCard({ lesson, index }) {
  const tabs = [
    { key: 'theory',        label: 'Theory',        done: lesson.theory        },
    { key: 'test',          label: 'Test',          done: lesson.test          },
    { key: 'transcription', label: 'Transcription', done: lesson.transcription },
  ];
  const allDone = tabs.every(t => t.done);

  if (lesson.locked) {
    return (
      <div className="flex flex-col gap-2.5 rounded-xl border border-primary/8 bg-white p-3.5 opacity-50">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest text-primary/25">
            {String(index + 1).padStart(2, '0')}
          </span>
          <svg className="h-3.5 w-3.5 text-primary/30" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-sm font-semibold leading-snug text-primary/40">{lesson.title}</p>
        <div className="space-y-1">
          {tabs.map(tab => (
            <div key={tab.key} className="flex items-center gap-2 -mx-1 px-1 py-0.5">
              <div className="h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 border-primary/15" />
              <span className="text-xs text-primary/25">{tab.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2.5 rounded-xl border p-3.5 transition-all duration-200 hover:-translate-y-px hover:shadow-sm hover:shadow-primary/8 ${
      allDone ? 'border-accent bg-accent/15' : 'border-primary/10 bg-white hover:border-primary/20'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-widest text-primary/25">
          {String(index + 1).padStart(2, '0')}
        </span>
        {allDone && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">Completed</span>
        )}
      </div>
      <Link to={`/lesson/${lesson.id}`}
        className={`text-sm font-semibold leading-snug ${allDone ? 'text-primary/40' : 'text-[#408A71]'}`}>
        {lesson.title}
      </Link>
      <div className="space-y-1">
        {tabs.map(tab => (
          <Link key={tab.key} to={`/lesson/${lesson.id}?tab=${tab.key}`}
            className="flex items-center gap-2 rounded-lg -mx-1 px-1 py-0.5 transition-colors hover:bg-[#408A71]/8">
            <div className={`h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 transition-colors ${
              tab.done ? 'border-[#408A71] bg-[#408A71]' : 'border-[#408A71]/25'
            }`}>
              {tab.done && (
                <svg className="h-full w-full p-px text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2,6 5,9 10,3" />
                </svg>
              )}
            </div>
            <span className={`text-xs ${tab.done ? 'font-medium text-[#408A71]' : 'text-[#408A71]/45'}`}>{tab.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── TopicRow ──────────────────────────────────────────────────────────────────
function TopicRow({ topic, index, defaultOpen, animStart }) {
  const [open, setOpen] = useState(defaultOpen);
  const [hovered, setHovered] = useState(false);
  const doneCount = topic.lessons.filter(lessonDone).length;
  const p = pct(doneCount, topic.lessons.length);
  const animP = useCountUp(p, animStart);

  const activeHover = open && hovered;

  return (
    <div className={`overflow-hidden rounded-xl border transition-all duration-300 ${
      topic.locked
        ? 'border-primary/8 bg-white opacity-50'
        : open
          ? 'border-transparent shadow-xl shadow-primary/14'
          : 'border-primary/10 bg-white hover:border-primary/25'
    }`}>
      <button
        onClick={() => !topic.locked && setOpen(o => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={topic.locked}
        className={`flex w-full items-center gap-3 px-4 py-3.5 sm:px-6 sm:py-4 text-left transition-colors disabled:cursor-not-allowed ${
          activeHover ? 'bg-[#408A71]' : open ? 'bg-primary' : 'bg-white hover:bg-primary/5'
        }`}
      >
        <span className={`w-5 flex-shrink-0 text-[11px] font-bold tracking-wider transition-colors ${open ? 'text-white/40' : 'text-primary/30'}`}>
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className={`text-sm font-semibold truncate transition-colors ${open ? 'text-white' : 'text-primary'}`}>
              {topic.title}
            </p>
            {topic.locked && (
              <svg className="h-3 w-3 flex-shrink-0 text-primary/30" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <p className={`text-xs truncate transition-colors ${open ? 'text-white/45' : 'text-primary/40'}`}>{topic.description}</p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-3">
          <div className="hidden sm:flex items-center gap-3">
            <div className={`h-1.5 w-28 overflow-hidden rounded-full transition-colors ${open ? 'bg-white/25' : 'bg-accent/30'}`}>
              <div className={`h-full rounded-full transition-all duration-700 ${open ? 'bg-white' : 'bg-[#408A71]'}`}
                style={{ width: `${animP}%` }} />
            </div>
            <span className={`text-sm font-bold w-8 text-right tabular-nums transition-colors ${open ? 'text-white' : 'text-primary'}`}>{animP}%</span>
          </div>
          {!topic.locked && (
            <ChevronIcon open={open} className={`h-3.5 w-3.5 transition-colors ${open ? 'text-white/50' : 'text-primary/35'}`} />
          )}
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open && !topic.locked ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="border-t border-primary/15 bg-[#f7f7f7] px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {topic.lessons.map((lesson, i) => (
              <LessonCard key={lesson.id} lesson={lesson} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const [user, setUser]             = useState(null);
  const [profileOpen, setProfile]   = useState(false);
  const [topics, setTopics]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [streakDays, setStreakDays] = useState(0);
  const [animStart, setAnimStart]   = useState(false);
  const [practiceStats, setPracticeStats] = useState({ completed: 0, total: 0 });
  const [coins, setCoins]                 = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/login'); return; }
    setUser(JSON.parse(stored));

    const token = localStorage.getItem('token');

    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.user) { setUser(d.user); localStorage.setItem('user', JSON.stringify(d.user)); } })
      .catch(() => {});

    fetch(`${API_BASE}/api/auth/ping`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.streakDays != null) setStreakDays(d.streakDays); })
      .catch(() => {});

    fetch(`${API_BASE}/api/practice/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.completed != null) setPracticeStats({ completed: d.completed, total: d.total }); })
      .catch(() => {});
    fetch(`${API_BASE}/api/practice/coins`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.coins != null) setCoins(d.coins); })
      .catch(() => {});

    fetch(`${API_BASE}/api/topics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.status === 401) { navigate('/login'); return null; }
        if (res.status === 403) { handleBlocked(); return null; }
        return res.json();
      })
      .then(data => { if (data) setTopics(data); })
      .finally(() => { setLoading(false); setAnimStart(true); });
  }, [navigate]);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  const totalLessons     = topics.reduce((s, t) => s + t.lessons.length, 0);
  const completedLessons = topics.reduce((s, t) => s + t.lessons.filter(lessonDone).length, 0);
  const completedTopics  = topics.filter(t => t.lessons.length > 0 && t.lessons.every(lessonDone)).length;
  const totalTabs        = totalLessons * 3;
  const completedTabs    = topics.reduce((s, t) => s + t.lessons.reduce((ls, l) => ls + tabsDone(l), 0), 0);
  const overallPct       = pct(completedTabs, totalTabs);

  const TABS_ORDER = ['theory', 'test', 'transcription'];
  const TAB_LABEL  = { theory: 'Theory', test: 'Test', transcription: 'Transcription' };
  let nextTopic = null, nextLesson = null, nextTab = 'theory';
  outer: for (const topic of topics) {
    if (topic.locked) continue;
    for (const lesson of topic.lessons) {
      if (lesson.locked) continue;
      for (const t of TABS_ORDER) {
        if (!lesson[t]) { nextTopic = topic; nextLesson = lesson; nextTab = t; break outer; }
      }
    }
  }

  if (!user) return null;

  const displayName = user.display_name || user.username || user.email?.split('@')[0] || 'there';
  const today       = new Date();
  const dayNames    = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  return (
    <div className="min-h-screen bg-[#f7f7f7]">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-primary/10 bg-[#f7f7f7]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
            <span className="text-base font-bold text-dark">Music Theory</span>
          </div>

          <div className="flex items-center gap-2">
          {coins !== null && (
            <div className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1">
              <svg className="h-3.5 w-3.5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v2m0 8v2M9 9.5h4.5a1.5 1.5 0 010 3H10a1.5 1.5 0 000 3H15" />
              </svg>
              <span className="text-xs font-bold text-amber-600">{coins}</span>
            </div>
          )}
          <div className="relative">
            <button onClick={() => setProfile(o => !o)}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-primary/8">
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                  {initials(user)}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#408A71] text-[9px] font-black text-white ring-1 ring-white">
                  {getLevel(user?.xp)}
                </div>
              </div>
              <span className="hidden text-sm font-medium text-dark sm:block">{displayName}</span>
              <ChevronIcon open={profileOpen} className="h-3.5 w-3.5 text-primary/40" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-primary/12 bg-white shadow-lg shadow-primary/8 z-50">
                <Link to="/profile"
                  className="block px-4 py-2.5 text-sm text-primary/70 transition-colors hover:bg-[#f7f7f7] hover:text-primary">
                  Profile
                </Link>

                {user?.role === 'admin' && (
                  <Link to="/admin"
                    className="block px-4 py-2.5 text-sm text-[#408A71] font-medium transition-colors hover:bg-[#f7f7f7]">
                    Admin panel
                  </Link>
                )}
                <div className="mx-3 h-px bg-primary/8" />
                <button onClick={logout}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-50 hover:text-red-500">
                  Log out
                </button>
              </div>
            )}
          </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10 space-y-7 sm:space-y-8">

        {/* ── Greeting + overall progress ── */}
        <div className="animate-fade-slide-up" style={{ animationDelay: '0ms' }}>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary/40 mb-1">Dashboard</p>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">{displayName}</h1>
            <span className="text-sm font-black text-primary">{overallPct}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-accent/30">
            <div className="h-full rounded-full transition-all duration-700" style={{ backgroundColor: '#408A71', width: `${overallPct}%` }} />
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="hidden sm:grid grid-cols-3 gap-2.5 animate-fade-slide-up" style={{ animationDelay: '80ms' }}>
          <StatCard label="Topics"  done={completedTopics}         total={topics.length}          trigger={animStart} />
          <StatCard label="Lessons" done={completedLessons}        total={totalLessons}           trigger={animStart} />
          <StatCard label="Tasks"   done={practiceStats.completed} total={practiceStats.total}    trigger={animStart} />
        </div>

        {/* Stats mobile */}
        <div className="flex justify-between sm:hidden animate-fade-slide-up" style={{ animationDelay: '80ms' }}>
          {[
            { label: 'Topics',  done: completedTopics,  total: topics.length },
            { label: 'Lessons', done: completedLessons, total: totalLessons  },
            { label: 'Tasks',   done: practiceStats.completed, total: practiceStats.total },
          ].map((s, i) => (
            <div key={s.label} className={`flex-1 text-center ${i !== 2 ? 'border-r border-primary/10' : ''}`}>
              <p className="text-xl font-bold text-primary">{s.done}<span className="text-xs font-medium text-primary/30 ml-0.5">/{s.total}</span></p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/40 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Continue + Streak ── */}
        <div className="flex flex-col gap-2.5 sm:flex-row animate-fade-slide-up" style={{ animationDelay: '160ms' }}>
          {/* Continue */}
          {nextLesson && (
            <Link to={`/lesson/${nextLesson.id}?tab=${nextTab}`}
              className="flex flex-1 items-center justify-between gap-4 rounded-xl px-5 py-4 shadow-md transition-all duration-200 hover:scale-[1.015] hover:shadow-xl" style={{ backgroundColor: '#408A71', boxShadow: '0 4px 16px #408A7130' }}>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-0.5">
                  Continue · {nextTopic?.title}
                </p>
                <p className="truncate font-semibold text-white">{nextLesson.title}</p>
                <p className="text-xs text-white/60 mt-0.5">Next: {TAB_LABEL[nextTab]}</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-white/15 px-3 py-2">
                <span className="text-sm font-medium text-white">Open</span>
                <svg className="h-3.5 w-3.5 text-white/60" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </Link>
          )}

          {/* Streak */}
          <div className="flex flex-col justify-between rounded-xl border border-primary/10 bg-white px-4 py-3.5 sm:w-[320px] sm:flex-shrink-0">
            <div className="flex items-baseline gap-1.5 mb-2.5">
              <span className="text-2xl font-bold leading-none text-primary">{streakDays}</span>
              <span className="text-xs text-primary/40">day streak 🔥</span>
            </div>
            <div>
              <div className="flex gap-1 mb-1">
                {Array.from({ length: 7 }, (_, i) => {
                  const d       = new Date(today);
                  d.setDate(today.getDate() - 6 + i);
                  const isPast  = i < 7 - streakDays;
                  const isToday = i === 6;
                  const dow     = (d.getDay() + 6) % 7;
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
                      <div className={`aspect-square w-full rounded-[5px] flex items-center justify-center ${
                        isPast ? 'bg-accent/20' : isToday ? 'bg-primary' : 'bg-accent'
                      }`}>
                        {!isPast && (
                          <svg width="7" height="7" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="2,6 5,9 10,3" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-[8px] font-medium ${isPast ? 'text-primary/20' : 'text-primary/50'}`}>
                        {dayNames[dow].slice(0, 1)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/40">This week</p>
            </div>
          </div>
        </div>

        {/* ── Tools row ── */}
        <div className="flex gap-2 animate-fade-slide-up" style={{ animationDelay: '210ms' }}>

          {/* Metronome */}
          <Link to="/metronome"
            className="flex-1 flex items-center gap-3 rounded-xl border border-primary/10 bg-white px-4 py-3 transition-all hover:border-primary/25 hover:shadow-sm">
            <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-primary/8 text-primary/50">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M6 6l2.5 2.5M15.5 15.5L18 18M2 12h4M18 12h4M6 18l2.5-2.5M15.5 8.5L18 6"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-primary">Metronome</span>
          </Link>

          {/* Practice */}
          <Link to="/practice"
            className="flex-1 flex items-center gap-3 rounded-xl border border-primary/10 bg-white px-4 py-3 transition-all hover:border-primary/25 hover:shadow-sm">
            <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-primary/8 text-primary/50">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
            <span className="text-sm font-medium text-primary">Practice</span>
          </Link>

        </div>

        {/* ── Curriculum ── */}
        <div className="animate-fade-slide-up" style={{ animationDelay: '240ms' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/50">Curriculum</p>
            <p className="text-xs text-primary/35">
              {topics.filter(t => !t.locked).length} / {topics.length} unlocked
            </p>
          </div>

          {loading ? (
            <Loader />
          ) : (
            <div className="flex flex-col gap-2">
              {topics.map((topic, i) => (
                <TopicRow key={topic.id} topic={topic} index={i} defaultOpen={i === 0} animStart={animStart} />
              ))}
            </div>
          )}
        </div>

      </main>

      {profileOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setProfile(false)} />
      )}
    </div>
  );
}
