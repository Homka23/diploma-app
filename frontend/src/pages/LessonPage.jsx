import { API_BASE } from '../config.js';
import { useState, useEffect } from 'react';

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
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { BlockCard }     from '../components/TheoryBlocks';
import { LessonSidebar } from '../components/LessonSidebar';
import { QuizTab }            from '../components/QuizTab';
import { TranscriptionTab }   from '../components/TranscriptionTab';

const TABS = [
  {
    key: 'theory',
    label: 'Theory',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    ),
  },
  {
    key: 'test',
    label: 'Test',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    key: 'transcription',
    label: 'Transcription',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0118 0v6" />
        <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z" />
        <path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
      </svg>
    ),
  },
];

export default function LessonPage() {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [tab, setTab]               = useState(() => {
    const t = searchParams.get('tab');
    return ['theory', 'test', 'transcription'].includes(t) ? t : 'theory';
  });
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [user, setUser]               = useState(null);
  const [profileOpen, setProfile]     = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const [theoryDone, setTheoryDone]   = useState(false);
  const [markingDone, setMarkingDone] = useState(false);
  const [refreshKey, setRefreshKey]   = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  function initials(u) {
    const name = u?.display_name || u?.username || u?.email || '?';
    return name.slice(0, 2).toUpperCase();
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    fetch(`${API_BASE}/api/lessons/${id}/theory`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.status === 401) { navigate('/login'); return null; }
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(d => { if (d) setData(d); })
      .catch(() => setError('Failed to load lesson'))
      .finally(() => setLoading(false));

    fetch(`${API_BASE}/api/topics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(topics => {
        const lesson = topics.flatMap(t => t.lessons).find(l => String(l.id) === String(id));
        if (lesson?.theory) setTheoryDone(true);
      })
      .catch(() => {});
  }, [id, navigate]);

  const topicTitle  = data?.lesson?.topic_title ?? '…';
  const lessonTitle = data?.lesson?.title ?? '…';

  return (
    <div className="flex min-h-screen bg-[#f7f7f7]">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-dark/20 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        flex flex-col bg-white border-r border-primary/10 flex-shrink-0
        fixed inset-y-0 left-0 z-40
        lg:relative lg:inset-auto lg:z-auto lg:sticky lg:top-0 lg:h-screen
        transition-all duration-300 ease-in-out
        ${sidebarOpen
          ? 'w-[320px] translate-x-0'
          : 'w-[320px] -translate-x-full lg:w-0 lg:translate-x-0 lg:overflow-hidden lg:border-0'
        }
      `}>
        <LessonSidebar
          currentId={id}
          refreshKey={refreshKey}
          onLinkClick={() => setSidebarOpen(false)}
          onCollapse={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-primary/10 bg-[#f7f7f7] transition-all duration-300">
          <div className={`px-4 sm:px-6 lg:px-10 transition-all duration-300 ${scrolled ? 'pt-2 pb-1' : 'pt-3 pb-2 sm:pt-4 sm:pb-3'}`}>

            <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'mt-0' : 'mt-2 sm:mt-3'}`}>
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="flex h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center rounded-lg text-[#408A71] transition-colors hover:bg-[#408A71]/10"
                  >
                    <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                )}
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                  <p className="flex-shrink-0 truncate text-xs font-bold uppercase tracking-[0.15em] text-primary/50 max-w-[120px] sm:max-w-none">
                    {topicTitle}
                  </p>
                  <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${scrolled ? 'max-w-[140px] sm:max-w-xs opacity-100' : 'max-w-0 opacity-0'}`}>
                    <span className="flex-shrink-0 text-primary/20">·</span>
                    <p className="truncate text-sm sm:text-base font-semibold text-[#285A48]">{lessonTitle}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {!sidebarOpen && (
                  <Link
                    to="/home"
                    className="flex items-center justify-center text-primary/50 transition-colors hover:text-primary/70"
                  >
                    <svg className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                  </Link>
                )}
                <div className="relative">
                  <button
                    onClick={() => setProfile(o => !o)}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-primary/8"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#285A48] text-[11px] font-bold text-white">
                      {user ? initials(user) : '?'}
                    </div>
                    <span className="hidden text-sm font-medium text-dark sm:block">
                      {user?.display_name || user?.username || user?.email}
                    </span>
                    <ChevronIcon open={profileOpen} className="h-3.5 w-3.5 text-primary/40" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-primary/12 bg-white shadow-lg shadow-primary/8 z-50">
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
            </div>

            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${scrolled ? 'max-h-0 opacity-0 mt-0' : 'max-h-24 opacity-100 mt-2'}`}>
              <h1 className="text-2xl sm:text-4xl font-semibold text-[#285A48] truncate">{lessonTitle}</h1>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex px-4 sm:px-6 lg:px-10">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative flex items-center gap-1.5 px-2 sm:px-3 py-3.5 mr-4 sm:mr-8 text-sm sm:text-base font-medium transition-colors ${
                  tab === t.key
                    ? 'text-[#408A71]'
                    : 'text-primary/35 hover:text-[#408A71]/60'
                }`}
              >
                {t.icon}
                {t.label}
                {tab === t.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[#408A71]" />
                )}
              </button>
            ))}
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto w-full max-w-5xl animate-fade-slide-up px-3 sm:px-6 py-4 sm:py-8">
          {loading && <div className="py-20 text-center text-sm text-primary/30">Loading…</div>}
          {error   && <div className="py-20 text-center text-sm text-red-400">{error}</div>}

          {!loading && !error && tab === 'theory' && (
            <div className="space-y-4">
              {data?.theory?.map(block => (
                <BlockCard key={block.blockId} block={block} />
              ))}
              {data?.theory?.length === 0 && (
                <p className="py-20 text-center text-sm text-primary/30">No theory content yet.</p>
              )}
              {data?.theory?.length > 0 && (
                <div className="flex justify-end pt-4">
                  {theoryDone ? (
                    <div className="flex items-center gap-2 rounded-xl bg-primary/8 px-5 py-3 text-sm font-semibold text-primary">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Theory completed
                    </div>
                  ) : (
                    <button
                      onClick={async () => {
                        if (markingDone) return;
                        setMarkingDone(true);
                        const token = localStorage.getItem('token');
                        const res = await fetch(`${API_BASE}/api/lessons/${id}/complete/theory`, {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (res.ok) {
                          setTheoryDone(true);
                          setRefreshKey(k => k + 1);
                        } else {
                          const err = await res.json().catch(() => ({}));
                          console.error('completeTab failed:', err);
                        }
                        setMarkingDone(false);
                      }}
                      disabled={markingDone}
                      className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Mark as Read
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {!loading && !error && tab === 'test' && (
            <QuizTab
              lessonId={id}
              onPassed={() => setRefreshKey(k => k + 1)}
            />
          )}

          {!loading && !error && tab === 'transcription' && (
            <TranscriptionTab
              lessonId={id}
              onPassed={() => setRefreshKey(k => k + 1)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
